'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Image from 'next/image';
import { 
  RotateCcw, Send, Lightbulb, CheckCircle, 
  Loader2, Volume2, Image as ImageIcon, Sparkles
} from 'lucide-react';

// Interfaces
interface WordData {
  word: string;
  pronunciation: string;
  type: string;
  meaning: string;
  example: string;
  image: string;
}

interface ValidationResult {
  score: number;
  level: string;
  suggestion: string;
  corrected_sentence: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [wordData, setWordData] = useState<WordData | null>(null);
  const [sentence, setSentence] = useState('');
  const [result, setResult] = useState<ValidationResult | null>(null);

  // Fetch Word
  const fetchWord = async () => {
    setLoading(true);
    setResult(null);
    setSentence('');
    try {
      const res = await axios.get(`${API_URL}/word`);
      setWordData(res.data);
    } catch (error) {
      console.error("Error fetching word:", error);
    } finally {
      setLoading(false);
    }
  };

  // Submit Sentence
  const submitSentence = async () => {
    if (!sentence.trim() || !wordData) return;
    setSubmitting(true);
    try {
      const res = await axios.post(`${API_URL}/validate`, {
        word: wordData.word,
        sentence: sentence
      });
      setResult(res.data);
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อกับ AI");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    fetchWord();
  }, []);

  // --- Loading State ---
  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400 gap-4">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin"></div>
        <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-500" size={24} />
      </div>
      <p className="animate-pulse font-medium">กำลังเตรียมคำศัพท์ใหม่...</p>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 fade-in-up">
      
      {/* --- Left Column: Word Card --- */}
      <div className="lg:col-span-5 flex flex-col gap-6">
        <div className="bg-white rounded-3xl shadow-xl shadow-indigo-100/50 overflow-hidden border border-slate-100 group">
          
          {/* Image Section */}
          <div className="relative h-64 w-full bg-slate-100 overflow-hidden">
            {wordData?.image ? (
              <Image 
                src={wordData.image} 
                alt={wordData.word} 
                fill 
                className="object-cover transition duration-700 group-hover:scale-105"
                unoptimized
              />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-300">
                <ImageIcon size={48} />
              </div>
            )}
            <div className="absolute top-4 left-4">
              <span className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-indigo-600 shadow-sm uppercase tracking-wider">
                {wordData?.type}
              </span>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-8">
            <div className="flex items-baseline justify-between mb-2">
              <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">{wordData?.word}</h1>
              <div className="flex items-center gap-2 text-slate-400">
                <Volume2 size={18} />
                <span className="font-mono text-lg">/{wordData?.pronunciation}/</span>
              </div>
            </div>

            <p className="text-lg text-slate-600 mt-4 leading-relaxed font-light">
              {wordData?.meaning}
            </p>

            <div className="mt-6 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
              <p className="text-sm font-semibold text-indigo-900 uppercase mb-1 opacity-70">Example</p>
              <p className="text-indigo-800 italic font-medium">"{wordData?.example}"</p>
            </div>

            <button 
              onClick={fetchWord}
              className="mt-6 w-full py-3 flex items-center justify-center gap-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded-xl transition border border-transparent hover:border-slate-100"
            >
              <RotateCcw size={18} /> เปลี่ยนคำศัพท์
            </button>
          </div>
        </div>
      </div>

      {/* --- Right Column: Interaction & Result --- */}
      <div className="lg:col-span-7 flex flex-col gap-6">
        
        {/* Input Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-indigo-100/50 p-8 border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
          
          <label className="block text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm">1</span>
            แต่งประโยคของคุณ
          </label>
          
          <textarea 
            value={sentence}
            onChange={(e) => setSentence(e.target.value)}
            rows={4} 
            className="w-full p-4 text-lg border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 focus:outline-none transition resize-none placeholder:text-slate-300 bg-slate-50 focus:bg-white"
            placeholder={`Try using "${wordData?.word}" in a sentence...`}
          />
          
          <div className="mt-4 flex justify-end">
            <button 
              onClick={submitSentence}
              disabled={submitting || !sentence}
              className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting ? <Loader2 className="animate-spin" /> : <><Send size={18} /> ส่งตรวจ</>}
            </button>
          </div>
        </div>

        {/* Result Card (Shows only after submission) */}
        {result && (
          <div className="bg-white rounded-3xl shadow-xl shadow-emerald-100/50 p-8 border border-emerald-100 fade-in-up">
             <div className="flex items-center justify-between mb-8">
                <div>
                   <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <CheckCircle className="text-emerald-500" /> ผลการตรวจ
                   </h2>
                   <p className="text-slate-500">AI ตรวจสอบความถูกต้องและโครงสร้าง</p>
                </div>
                <div className="text-right">
                    <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">CEFR Level</span>
                    <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">
                        {result.level}
                    </span>
                </div>
             </div>

             <div className="flex items-start gap-6">
                {/* Score Circle */}
                <div className="shrink-0 relative w-24 h-24 flex items-center justify-center">
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
                        <span className="text-3xl font-bold text-slate-800">{result.score}</span>
                        <span className="text-[10px] uppercase font-bold text-slate-400">Score</span>
                    </div>
                </div>

                {/* Feedback Text */}
                <div className="flex-1 space-y-4">
                    <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                        <div className="flex items-start gap-3">
                            <Lightbulb className="text-amber-500 shrink-0 mt-0.5" size={20} />
                            <div>
                                <p className="text-xs font-bold text-amber-600 uppercase mb-1">คำแนะนำ (Feedback)</p>
                                <p className="text-slate-700 leading-relaxed">{result.suggestion}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                         <div className="flex items-start gap-3">
                            <Sparkles className="text-emerald-500 shrink-0 mt-0.5" size={20} />
                            <div>
                                <p className="text-xs font-bold text-emerald-600 uppercase mb-1">ประโยคแนะนำ (Correction)</p>
                                <p className="text-slate-700 italic font-medium">"{result.corrected_sentence}"</p>
                            </div>
                        </div>
                    </div>
                </div>
             </div>

             <button 
                onClick={fetchWord} 
                className="w-full mt-8 bg-slate-900 hover:bg-black text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition flex items-center justify-center gap-2 group"
             >
                ไปคำต่อไป <span className="group-hover:translate-x-1 transition">→</span>
             </button>
          </div>
        )}

      </div>
    </div>
  );
}