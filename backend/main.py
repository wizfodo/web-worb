import os
import time
import datetime
import logging
import httpx
from datetime import date, timedelta
from typing import List, Optional

# ใช้ tenacity เพื่อ Retry connection database/n8n
from tenacity import retry, stop_after_attempt, wait_fixed, retry_if_exception_type

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# SQLAlchemy สำหรับ Database
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text
from sqlalchemy.orm import sessionmaker, Session, declarative_base
from contextlib import asynccontextmanager

# --- Config & Setup ---
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("worddee-backend")

# อ่านค่า Environment Variables (ตั้ง Default ให้เข้ากับ MySQL)
DB_HOST = os.getenv("DB_HOST", "mysql_db")
DB_NAME = os.getenv("DB_NAME", "webwords_db")
DB_USER = os.getenv("DB_USER", "root")
DB_PASS = os.getenv("DB_PASS", "rootpassword")
DB_PORT = os.getenv("DB_PORT", "3306")

N8N_BASE_URL = os.getenv("N8N_URL", "http://n8n:5678/webhook")

# Connection String สำหรับ MySQL (ใช้ pymysql driver)
# รูปแบบ: mysql+pymysql://user:password@host:port/dbname
DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# Setup SQLAlchemy
# pool_recycle จำเป็นสำหรับ MySQL เพื่อป้องกัน connection หลุดเมื่อ idle นานๆ
engine = create_engine(DATABASE_URL, pool_recycle=3600)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- Database Models ---
class History(Base):
    __tablename__ = "history"
    
    id = Column(Integer, primary_key=True, index=True)
    # MySQL ต้องระบุความยาวสำหรับ String หรือใช้ Text สำหรับข้อความยาวๆ
    word = Column(String(255))               
    sentence = Column(Text)                  # ประโยคอาจจะยาว ใช้ Text
    score = Column(Float)
    level = Column(String(50))               # เช่น A1, B2, C1
    suggestion = Column(Text)                # คำแนะนำจาก AI
    corrected_sentence = Column(Text)        # ประโยคที่แก้แล้ว
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

# --- Pydantic Schemas (Validation) ---
class SummaryResponse(BaseModel):
    dates: List[str]
    scores: List[float]
    current_streak: int
    total_minutes: int

class SentenceInput(BaseModel):
    word: str
    sentence: str

# --- Global HTTP Client ---
http_client: Optional[httpx.AsyncClient] = None

# --- Lifespan Manager (Startup/Shutdown) ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Start HTTP Client
    global http_client
    http_client = httpx.AsyncClient(
        timeout=30.0, 
        limits=httpx.Limits(max_keepalive_connections=5, max_connections=10)
    )

    # 2. Wait for Database (Retry logic)
    # วนลูปเช็คว่า MySQL พร้อมหรือยัง ก่อนเริ่ม App จริง
    logger.info("Connecting to MySQL...")
    for i in range(15):
        try:
            # ลองสร้างตาราง (ถ้ายังไม่มี) เป็นการเช็ค connection ไปในตัว
            Base.metadata.create_all(bind=engine)
            logger.info("MySQL connected and tables created/verified!")
            break
        except Exception as e:
            logger.warning(f"MySQL not ready yet... Waiting ({i+1}/15). Error: {e}")
            time.sleep(3)
    else:
        logger.error("Could not connect to MySQL after multiple attempts.")
    
    yield  # App ทำงานตรงนี้

    # 3. Shutdown cleanup
    if http_client:
        await http_client.aclose()
        logger.info("HTTP Client closed.")

# --- Init App ---
app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Dependency ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Helpers ---
@retry(
    stop=stop_after_attempt(3),
    wait=wait_fixed(2),
    retry=retry_if_exception_type(httpx.RequestError),
    reraise=True
)
async def call_n8n(webhook_path: str, payload: dict = None):
    """ฟังก์ชันเรียก n8n พร้อมระบบ Retry อัตโนมัติ"""
    url = f"{N8N_BASE_URL}/{webhook_path}"
    try:
        logger.info(f"Sending request to n8n: {url}")
        response = await http_client.post(url, json=payload or {})
        response.raise_for_status()
        return response.json()
    except httpx.HTTPStatusError as e:
        logger.error(f"n8n Server Error: {e.response.text}")
        # กรณี n8n ตอบ 4xx/5xx ให้แจ้ง Frontend ว่า AI มีปัญหา
        raise HTTPException(status_code=e.response.status_code, detail="AI Service Error")
    except httpx.RequestError as e:
        logger.error(f"n8n Connection Failed: {e}")
        raise e

# --- API Endpoints ---

@app.get("/api/word")
async def get_word():
    """ดึงคำศัพท์ใหม่จาก n8n (Generate Word Workflow)"""
    try:
        # เรียก n8n webhook ชื่อ 'generate-word'
        result = await call_n8n("generate-word")
        
        # Fallback image ถ้า n8n ไม่ส่งรูปมา
        if 'image' not in result or not result['image']:
             result['image'] = f"https://via.placeholder.com/400?text={result.get('word', 'WORD')}"
             
        return result
    except Exception as e:
        logger.error(f"Critical Failure in /api/word: {e}")
        # คืนค่า Default กรณีระบบล่ม เพื่อให้หน้าเว็บไม่พัง
        return {
            "word": "System Offline",
            "pronunciation": "sys-tem off-line",
            "type": "Error",
            "meaning": "Unable to connect to AI service.",
            "example": "Please check n8n container.",
            "image": "https://via.placeholder.com/400?text=ERROR"
        }

@app.post("/api/validate")
async def validate_sentence(data: SentenceInput, db: Session = Depends(get_db)):
    """ส่งประโยคไปตรวจที่ n8n และบันทึกลง MySQL"""
    try:
        payload = {"word": data.word, "sentence": data.sentence}
        
        # 1. เรียก AI (n8n)
        result = await call_n8n("validate-sentence", payload)

        # 2. บันทึกลง Database
        new_record = History(
            word=data.word, 
            sentence=data.sentence, 
            score=float(result.get('score', 0)),
            level=result.get('level', 'Unknown'), 
            suggestion=result.get('suggestion', ''),
            corrected_sentence=result.get('corrected_sentence', '')
        )
        db.add(new_record)
        db.commit()
        
        # 3. ส่งผลลัพธ์กลับ Frontend
        return result
        
    except Exception as e:
        logger.error(f"Validation Failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/summary", response_model=SummaryResponse)
def get_dashboard_summary(db: Session = Depends(get_db)):
    """สรุปข้อมูลสำหรับ Dashboard (ดึงจาก MySQL)"""
    # ดึง 10 รายการล่าสุด
    history = db.query(History).order_by(History.created_at.desc()).limit(10).all()
    history_list = list(reversed(history)) # เรียงให้กราฟแสดงจากซ้ายไปขวา (เก่า -> ใหม่)

    # คำนวณสถิติรวม
    total_records = db.query(History).count()
    total_minutes = total_records * 2  # สมมติว่าใช้เวลา 2 นาทีต่อ 1 ประโยค

    # คำนวณ Streak (วันที่ต่อเนื่องกัน)
    all_dates_query = db.query(History.created_at).order_by(History.created_at.desc()).all()
    unique_dates = sorted(list(set([d[0].date() for d in all_dates_query])), reverse=True)
    
    current_streak = 0
    today = date.today()
    
    if unique_dates:
        # เช็คว่าวันล่าสุดคือวันนี้หรือเมื่อวาน (ถ้าใช่ เริ่มนับ streak)
        if unique_dates[0] == today or unique_dates[0] == today - timedelta(days=1):
            current_streak = 1
            for i in range(len(unique_dates) - 1):
                # ถ้าวันถัดไปในลิสต์ ห่างจากวันก่อนหน้า 1 วัน เป๊ะๆ
                if unique_dates[i] - unique_dates[i+1] == timedelta(days=1):
                    current_streak += 1
                else:
                    break
        else:
            current_streak = 0 

    return {
        "dates": [r.created_at.strftime("%H:%M") for r in history_list], # ส่งเวลาไปโชว์ในกราฟ
        "scores": [r.score for r in history_list],
        "current_streak": current_streak,
        "total_minutes": total_minutes
    }