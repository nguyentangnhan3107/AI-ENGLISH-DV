
import React, { useState } from 'react';
import { gradeWriting, generateWritingTopic } from '../services/geminiService';
import { WritingGrade, UserStats } from '../types';
import { PenTool, Send, Loader2, CheckCircle2, AlertCircle, RefreshCcw, Sparkles, Award, Star } from 'lucide-react';

export default function Writing({ stats, onComplete }: { stats: UserStats, onComplete: (exp: number) => void }) {
  const [topic, setTopic] = useState('');
  const [category, setCategory] = useState(stats.studyMode === 'ielts' ? 'Global Issues' : 'Daily Life');
  const [content, setContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGrading, setIsGrading] = useState(false);
  const [grade, setGrade] = useState<WritingGrade | null>(null);

  const isIeltsMode = stats.studyMode === 'ielts';

  const fetchTopic = async () => {
    setIsGenerating(true);
    try {
      const newTopic = await generateWritingTopic(category, isIeltsMode, stats.targetBand);
      setTopic(newTopic);
    } catch (e) {
      setTopic(isIeltsMode ? "Some people think that the best way to reduce crime is to give longer prison sentences. Others, however, believe there are better alternative ways of reducing crime. Discuss both views and give your opinion." : "Write a short story about your best friend.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() || content.split(' ').length < 10) return;
    setIsGrading(true);
    try {
      const result = await gradeWriting(topic, content, isIeltsMode);
      setGrade(result);
      onComplete(isIeltsMode ? 200 : 150);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGrading(false);
    }
  };

  if (grade) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-12 text-gray-900 px-4 md:px-0">
        <div className="bg-white p-6 md:p-16 rounded-[40px] border border-gray-100 shadow-xl text-center relative overflow-hidden">
          <div className="md:absolute top-0 right-0 p-6 md:p-10 mb-6 md:mb-0">
             <div className={`${isIeltsMode ? 'bg-[#ce82ff]' : 'bg-indigo-600'} text-white rounded-[32px] w-full md:w-24 h-24 flex flex-col items-center justify-center font-black shadow-2xl`}>
               <span className="text-3xl">{grade.score}</span>
               <span className="text-[10px] uppercase opacity-70">{isIeltsMode ? 'Band Score' : 'Points'}</span>
             </div>
          </div>
          <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-4xl font-black mb-2">Alex Evaluation</h2>
          <p className="text-gray-500 mb-8 md:mb-12">{isIeltsMode ? 'IELTS Criteria Analysis' : 'CEFR Level: ' + grade.cefrLevel}</p>
          
          {isIeltsMode && grade.ieltsCriteria && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 text-left">
               {[
                 { label: 'Task Response', val: grade.ieltsCriteria.taskResponse },
                 { label: 'Coherence', val: grade.ieltsCriteria.coherence },
                 { label: 'Vocabulary', val: grade.ieltsCriteria.lexicalResource },
                 { label: 'Grammar', val: grade.ieltsCriteria.grammarRange },
               ].map(item => (
                 <div key={item.label} className="p-4 bg-gray-50 rounded-2xl border-2 border-transparent">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.label}</p>
                   <p className="text-2xl font-black text-[#ce82ff]">{item.val}</p>
                 </div>
               ))}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left mb-16">
            <div className="bg-emerald-50/50 p-6 md:p-8 rounded-[32px] border border-emerald-100">
              <h4 className="font-black text-emerald-900 mb-6 flex items-center gap-3">
                <Sparkles size={20} /> Strengths
              </h4>
              <ul className="space-y-3">
                {grade.strengths.map((s, i) => (
                  <li key={i} className="text-sm text-emerald-800 flex gap-3">
                    <span className="text-emerald-400 mt-1">●</span> {s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-rose-50/50 p-6 md:p-8 rounded-[32px] border border-rose-100">
              <h4 className="font-black text-rose-900 mb-6 flex items-center gap-3">
                <AlertCircle size={20} /> Areas to improve
              </h4>
              <ul className="space-y-3">
                {grade.weaknesses.map((w, i) => (
                  <li key={i} className="text-sm text-rose-800 flex gap-3">
                    <span className="text-rose-400 mt-1">●</span> {w}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="text-left space-y-10">
             <div>
               <h3 className="font-black text-2xl mb-6">Alex's Improved Version</h3>
               <div className="bg-gray-50 p-6 md:p-10 rounded-[40px] border border-gray-100 text-gray-700 text-lg leading-relaxed italic">
                 {grade.correctedText}
               </div>
             </div>
             
             <div>
               <h3 className="font-black text-2xl mb-4">Detailed Feedback</h3>
               <p className="text-gray-600 leading-relaxed text-lg">{grade.overallFeedback}</p>
             </div>
          </div>

          <button 
            onClick={() => { setGrade(null); setContent(''); setTopic(''); }}
            className={`mt-16 px-16 py-5 ${isIeltsMode ? 'bg-[#ce82ff]' : 'bg-indigo-600'} text-white font-black rounded-3xl transition-all shadow-2xl`}
          >
            Start New Task
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-12 px-4 md:px-0">
      <div className="text-center space-y-4 pt-6 md:pt-0">
        <div className={`inline-flex items-center gap-2 px-4 py-1.5 ${isIeltsMode ? 'bg-[#f3e8ff] text-[#ce82ff]' : 'bg-indigo-50 text-indigo-600'} rounded-full font-black text-xs uppercase tracking-widest`}>
           <PenTool size={16} /> {isIeltsMode ? 'IELTS Writing Lab' : 'Writing Studio'}
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-gray-900">Luyện viết cùng Alex</h1>
        <p className="text-gray-500 max-w-xl mx-auto text-lg font-medium">
          {isIeltsMode ? `Luyện tập kỹ năng Academic Writing để chinh phục Band ${stats.targetBand}.` : "Viết tự do hoặc theo chủ đề để Alex sửa lỗi cho bạn."}
        </p>
      </div>

      {!topic ? (
        <div className="bg-white p-8 md:p-20 rounded-[50px] border border-gray-100 shadow-sm text-center">
          <div className={`w-24 h-24 ${isIeltsMode ? 'bg-[#f3e8ff] text-[#ce82ff]' : 'bg-indigo-50 text-indigo-600'} rounded-3xl flex items-center justify-center mx-auto mb-10 shadow-lg`}>
            {isIeltsMode ? <Award size={48} /> : <PenTool size={48} />}
          </div>
          <h3 className="text-2xl md:text-3xl font-black mb-10 text-gray-900">Chọn chủ đề muốn viết</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {(isIeltsMode ? ['Global Issues', 'Education', 'Technology', 'Culture'] : ['Daily Life', 'School', 'Technology', 'Hobbies']).map(cat => (
              <button 
                key={cat}
                onClick={() => setCategory(cat)}
                className={`py-5 rounded-3xl font-black text-sm transition-all border-4 ${category === cat ? (isIeltsMode ? 'bg-[#ce82ff] border-[#ce82ff]' : 'bg-indigo-600 border-indigo-600') + ' text-white shadow-xl' : 'bg-gray-50 text-gray-500 border-transparent hover:border-gray-200'}`}
              >
                {cat}
              </button>
            ))}
          </div>

          <button 
            onClick={fetchTopic}
            disabled={isGenerating}
            className={`px-12 md:px-16 py-5 ${isIeltsMode ? 'bg-[#ce82ff]' : 'bg-gray-900'} text-white font-black rounded-3xl hover:brightness-110 transition-all flex items-center justify-center gap-3 mx-auto disabled:opacity-50 text-lg shadow-2xl`}
          >
            {isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles size={24} />}
            {isIeltsMode ? 'LẤY ĐỀ IELTS' : 'TẠO CHỦ ĐỀ'}
          </button>
        </div>
      ) : (
        <div className="space-y-8 animate-in slide-in-from-right-12 duration-500">
          <div className="bg-white p-6 md:p-10 rounded-[40px] border border-gray-100 shadow-sm relative overflow-hidden group">
            <div className={`absolute top-0 left-0 w-2 h-full ${isIeltsMode ? 'bg-[#ce82ff]' : 'bg-indigo-600'}`}></div>
            <div className="flex items-start justify-between mb-4">
               <div className="flex-1">
                 <span className={`text-[10px] font-black ${isIeltsMode ? 'text-[#ce82ff] bg-purple-50' : 'text-indigo-600 bg-indigo-50'} px-4 py-1.5 rounded-full mb-4 inline-block uppercase tracking-widest`}>
                   {isIeltsMode ? `IELTS Writing Task (Target Band ${stats.targetBand})` : `Writing Task for Lớp ${stats.grade}`}
                 </span>
                 <h2 className="text-xl md:text-2xl font-black text-gray-900 leading-snug">{topic}</h2>
               </div>
               <button onClick={fetchTopic} className="p-3 text-gray-400 hover:text-[#ce82ff] transition-colors bg-gray-50 rounded-2xl ml-4">
                 <RefreshCcw size={24} />
               </button>
            </div>
          </div>

          <div className="relative">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={isIeltsMode ? "Start writing your essay here (min 150-250 words suggested)..." : "Bắt đầu viết đoạn văn của bạn tại đây..."}
              className="w-full min-h-[400px] md:min-h-[500px] p-6 md:p-10 rounded-[40px] md:rounded-[50px] border-4 border-gray-100 focus:border-[#ce82ff] focus:ring-0 text-xl leading-relaxed shadow-sm transition-all outline-none text-gray-800"
            />
            <div className="md:absolute bottom-10 right-10 flex flex-col md:flex-row items-center gap-4 md:gap-8 mt-6 md:mt-0 p-4 md:p-0">
              <span className="text-sm font-black text-gray-300 uppercase tracking-widest">{content.split(/\s+/).filter(x => x).length} words</span>
              <button 
                onClick={handleSubmit}
                disabled={isGrading || content.split(/\s+/).filter(x => x).length < 5}
                className={`w-full md:w-auto px-12 py-5 ${isIeltsMode ? 'bg-[#ce82ff]' : 'bg-indigo-600'} text-white font-black rounded-3xl transition-all flex items-center justify-center gap-3 shadow-2xl disabled:opacity-50`}
              >
                {isGrading ? <Loader2 className="animate-spin" /> : <Send size={24} />}
                GỬI BÀI CHẤM
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
