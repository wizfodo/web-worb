'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, Play, Flame, Timer, RotateCcw, Send, BarChart2, CheckCircle, Lightbulb, Sparkles, Image as ImageIcon } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

// --- Interfaces ---
interface WordData { word: string; pronunciation: string; type: string; meaning: string; example: string; image: string; level: string;}
interface ResultData { score: number; level: string; suggestion: string; corrected_sentence: string;}
interface ChartData { time: string; score: number; }

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export default function WorddeePage() {
  const [view, setView] = useState<'dashboard' | 'challenge' | 'result'>('dashboard');
  
  // Data States
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [wordData, setWordData] = useState<WordData | null>(null);
  const [inputSentence, setInputSentence] = useState('');
  const [result, setResult] = useState<ResultData | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [stats, setStats] = useState({ streak: 0, totalMinutes: 0, avgScore: 0 });

  // Game Mechanics
  const SKIP_LIMIT = 3;
  const COOLDOWN_DURATION = 30;
  const [skipCount, setSkipCount] = useState(0);
  const [cooldown, setCooldown] = useState(0);

  // --- API Functions ---
  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API_URL}/summary`);
      const scores = res.data.scores || [];
      const dates = res.data.dates || [];
      const mappedChart = scores.map((score: number, i: number) => ({
        time: dates[i] || `G${i+1}`,
        score: score
      }));
      setChartData(mappedChart);
      
      const totalScore = scores.reduce((a:number, b:number) => a + b, 0);
      const avg = scores.length ? (totalScore / scores.length).toFixed(1) : 0;

      setStats({
        streak: res.data.current_streak || 0,
        totalMinutes: res.data.total_minutes || 0,
        avgScore: Number(avg)
      });
    } catch (e) { console.error(e); }
  };

  const fetchWord = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API_URL}/word`);
      setWordData(res.data);
    } catch (e) { console.error(e); } 
    finally { setIsLoading(false); }
  };

  const submitSentence = async () => {
    if (!inputSentence.trim() || !wordData) return;
    setIsSubmitting(true);
    try {
      const res = await axios.post(`${API_URL}/validate`, { word: wordData.word, sentence: inputSentence });
      setResult(res.data);
      setView('result');
      fetchStats(); 
    } catch (e) { alert("Error connecting to AI"); }
    finally { setIsSubmitting(false); }
  };

  useEffect(() => { fetchStats(); }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleStartGame = () => {
    fetchWord();
    setView('challenge');
    setInputSentence('');
    setResult(null);
  };

  const handleSkip = () => {
    if (skipCount >= SKIP_LIMIT) {
        setCooldown(COOLDOWN_DURATION);
        setSkipCount(0);
        return;
    }
    setSkipCount(prev => prev + 1);
    fetchWord();
  };

  // --- 1. Dashboard View (Modern Light) ---
  if (view === 'dashboard') return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans fade-in-up">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="flex justify-between items-center">
            <div>
                <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">Dashboard</h1>
                <p className="text-slate-500 mt-1">ติดตามพัฒนาการภาษาอังกฤษของคุณ</p>
            </div>
            <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                    {stats.streak > 0 ? '🔥' : 'W'}
                </div>
                <span className="font-semibold text-slate-700">Learner</span>
            </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard icon={<Flame className="text-orange-500" />} label="Streak" value={stats.streak} unit="Days" />
            <StatCard icon={<Timer className="text-blue-500" />} label="Time" value={stats.totalMinutes} unit="Mins" />
            <StatCard icon={<BarChart2 className="text-emerald-500" />} label="Avg Score" value={stats.avgScore} unit="/ 10" />
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Sparkles size={20} className="text-indigo-500"/> Performance History
            </h2>
            <div className="h-64 w-full">
                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} domain={[0, 10]} />
                            <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                            <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
                        <p>เริ่มเล่นเกมเพื่อดูสถิติของคุณ!</p>
                    </div>
                )}
            </div>
        </div>

        <div className="flex justify-center pt-4">
            <button onClick={handleStartGame} className="group relative px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-200 transition-all hover:-translate-y-1 active:translate-y-0 overflow-hidden">
                <span className="relative z-10 flex items-center gap-2">
                    Start Challenge <Play size={20} fill="currentColor" />
                </span>
            </button>
        </div>
      </div>
    </div>
  );

  // --- 2. Challenge View (Design like Image) ---
  if (view === 'challenge') return (
    <div className="min-h-screen bg-slate-50 p-4 flex items-center justify-center font-sans">
        <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-8 fade-in-up">
            
            {/* Left: Word Card (Image Top, Content Bottom) */}
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100 flex flex-col h-[600px] relative">
                {isLoading || !wordData ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-white z-20">
                        <Loader2 className="animate-spin text-indigo-600" size={48} />
                    </div>
                ) : (
                    <>
                        {/* Image Section */}
                        <div className="relative h-1/2 w-full bg-slate-100">
                             {wordData.image ? (
                                <img src={wordData.image} alt={wordData.word} className="w-full h-full object-cover" />
                             ) : (
                                <div className="flex items-center justify-center h-full text-slate-300"><ImageIcon size={64}/></div>
                             )}
                             <div className="absolute top-5 left-5">
                                <span className="bg-black/70 backdrop-blur-sm text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-sm">
                                    {wordData.type}
                                </span>
                             </div>
                        </div>

                        {/* Content Section */}
                        <div className="p-8 flex flex-col flex-grow">
                            <div className="flex items-end gap-4 mb-4">
                                <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight leading-none">{wordData.word}</h1>
                                <span className="text-xl text-slate-500 font-medium mb-1">/{wordData.pronunciation}/</span>
                            </div>

                            <div className="mt-2 pl-4 border-l-[5px] border-blue-500">
                                <p className="text-lg text-slate-800 leading-relaxed font-medium">{wordData.meaning}</p>
                            </div>

                            <p className="text-slate-500 italic mt-6 text-lg">
                                <span className="font-semibold not-italic mr-2">Example:</span>
                                {wordData.example}
                            </p>
                        </div>
                    </>
                )}
            </div>

            {/* Right: Input Card */}
            <div className="flex flex-col gap-6">
                <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                    <button onClick={() => setView('dashboard')} className="text-slate-400 hover:text-slate-600 text-sm font-medium flex items-center gap-1">
                        &larr; Exit
                    </button>
                    <div className="flex gap-1">
                        {[...Array(SKIP_LIMIT)].map((_, i) => (
                            <div key={i} className={`h-2 w-8 rounded-full ${i < (SKIP_LIMIT - skipCount) ? 'bg-indigo-500' : 'bg-slate-200'}`} />
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100 flex-1 flex flex-col">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-md">1</div>
                        <h2 className="text-2xl font-bold text-slate-800">Compose a sentence</h2>
                    </div>
                    
                    <textarea 
                        value={inputSentence}
                        onChange={(e) => setInputSentence(e.target.value)}
                        className="w-full flex-1 p-5 text-lg border-2 border-slate-200 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 focus:outline-none transition resize-none placeholder:text-slate-300"
                        placeholder={`Try using "${wordData?.word || '...'}" in a sentence...`}
                    />
                    
                    <div className="flex gap-4 mt-6">
                        <button 
                            onClick={handleSkip}
                            disabled={cooldown > 0}
                            className={`px-6 py-4 rounded-xl font-bold text-lg transition-all flex items-center gap-2 ${
                                cooldown > 0 ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white border-2 border-slate-200 text-slate-600 hover:border-indigo-200 hover:text-indigo-600'
                            }`}
                        >
                            {cooldown > 0 ? `${cooldown}s` : <><RotateCcw size={20}/> Skip</>}
                        </button>
                        <button 
                            onClick={submitSentence}
                            disabled={isSubmitting || !inputSentence}
                            className="flex-1 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xl rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" size={24} /> : <><Send size={24} /> Submit</>}
                        </button>
                    </div>
                </div>
            </div>

        </div>
    </div>
  );

  // --- 3. Result View (Modern Light) ---
  if (view === 'result' && result) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans fade-in-up">
        <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl shadow-indigo-100 max-w-2xl w-full border border-slate-100 relative overflow-hidden">
             {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-purple-500"></div>

            <div className="flex items-center justify-between mb-8">
                <div>
                   <h2 className="text-3xl font-extrabold text-slate-800 flex items-center gap-3">
                    <CheckCircle className="text-emerald-500 fill-emerald-100" size={32} /> Result
                   </h2>
                </div>
                <div className="text-right">
                    <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Level</span>
                    <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">
                        {result.level}
                    </span>
                </div>
            </div>

            <div className="flex items-start gap-8 mb-8">
                <div className="shrink-0 relative w-32 h-32 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                        <path className="text-slate-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                        <path 
                            className={`${result.score >= 8 ? 'text-emerald-500' : result.score >= 5 ? 'text-amber-500' : 'text-rose-500'} transition-all duration-1000 ease-out`}
                            strokeDasharray={`${result.score * 10}, 100`}
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                            fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-4xl font-black text-slate-800">{result.score}</span>
                        <span className="text-xs uppercase font-bold text-slate-400">Score</span>
                    </div>
                </div>

                <div className="flex-1 space-y-4">
                    <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                        <div className="flex items-start gap-3">
                            <Lightbulb className="text-amber-500 shrink-0 mt-1" size={20} />
                            <div>
                                <p className="text-xs font-bold text-amber-600 uppercase mb-1">Feedback</p>
                                <p className="text-slate-700 leading-relaxed text-sm">{result.suggestion}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                         <div className="flex items-start gap-3">
                            <Sparkles className="text-emerald-500 shrink-0 mt-1" size={20} />
                            <div>
                                <p className="text-xs font-bold text-emerald-600 uppercase mb-1">Correction</p>
                                <p className="text-slate-700 italic font-medium text-sm">"{result.corrected_sentence}"</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex gap-4 pt-6 border-t border-slate-100">
                <button onClick={() => setView('dashboard')} className="flex-1 py-4 px-6 rounded-xl border-2 border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition text-lg">
                    Dashboard
                </button>
                <button onClick={handleStartGame} className="flex-1 py-4 px-6 rounded-xl bg-slate-900 text-white font-bold hover:bg-black shadow-lg hover:shadow-xl transition text-lg flex items-center justify-center gap-2 group">
                    Next Word <span className="group-hover:translate-x-1 transition">&rarr;</span>
                </button>
            </div>
        </div>
    </div>
  );
  return null;
}

function StatCard({ icon, label, value, unit }: any) {
    return (
        <div className="bg-white p-6 rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-100 flex items-center gap-4 transition-transform hover:-translate-y-1">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-2xl border border-slate-100">{icon}</div>
            <div>
                <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider">{label}</p>
                <div className="flex items-baseline gap-1">
                    <h3 className="text-3xl font-extrabold text-slate-800">{value}</h3>
                    <span className="text-xs text-slate-500 font-medium">{unit}</span>
                </div>
            </div>
        </div>
    );
}