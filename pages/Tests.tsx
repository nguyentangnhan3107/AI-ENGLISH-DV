
import React, { useState, useEffect } from 'react';
import { generateQuiz } from '../services/geminiService';
import { Quiz, QuizQuestion, UserStats } from '../types';
import { Brain, CheckCircle2, XCircle, ChevronRight, Loader2, Award, Apple, Check, X, Sparkles, Volume2 } from 'lucide-react';
import { playTTS, announceAccessibility } from '../services/ttsService';

export default function Tests({ stats, onComplete }: { stats: UserStats, onComplete: (exp: number) => void }) {
  const [topic, setTopic] = useState('Grammar');
  const [level, setLevel] = useState('Intermediate');
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);

  // Auto-read test question for visually impaired users (zero delay)
  useEffect(() => {
    if (!stats.accessibilityMode || !quiz || showResult) return;
    const q = quiz.questions[currentQuestionIndex];
    if (!q) return;

    let text = `Đề thi. Câu hỏi ${currentQuestionIndex + 1} trên ${quiz.questions.length}. ${q.question}. `;
    if (q.options && q.options.length > 0) {
      q.options.forEach((opt, idx) => {
        text += `Lựa chọn ${idx + 1}: ${opt}. `;
      });
    }
    announceAccessibility(text);
  }, [currentQuestionIndex, quiz, showResult, stats.accessibilityMode]);

  const startQuiz = async () => {
    setIsGenerating(true);
    if (stats.accessibilityMode) {
      announceAccessibility("Đang tải đề thi từ hệ thống AI. Vui lòng chờ trong giây lát.");
    }
    try {
      const data = await generateQuiz(topic, level, stats.grade);
      setQuiz(data);
      setCurrentQuestionIndex(0);
      setAnswers([]);
      setShowResult(false);
      setIsAnswered(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectAnswer = (index: number) => {
    if (isAnswered) return;
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = index;
    setAnswers(newAnswers);
    setIsAnswered(true);

    if (stats.accessibilityMode && quiz) {
      const q = quiz.questions[currentQuestionIndex];
      const isCorrect = index === q.correctAnswer;
      const optText = q.options?.[index] || '';
      if (isCorrect) {
        announceAccessibility(`Bạn đã chọn lựa chọn ${index + 1}: ${optText}. Chính xác! Nhấn Tiếp tục.`);
      } else {
        const correctText = q.options?.[q.correctAnswer ?? 0] || '';
        announceAccessibility(`Bạn đã chọn lựa chọn ${index + 1}: ${optText}. Chưa chính xác. Đáp án đúng là: ${correctText}. ${q.explanation || ''}. Nhấn Tiếp tục.`);
      }
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < (quiz?.questions.length || 0) - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setIsAnswered(false);
    } else {
      setShowResult(true);
      onComplete(100);
      if (stats.accessibilityMode && quiz) {
        const correctCount = answers.filter((ans, idx) => ans === quiz.questions[idx]?.correctAnswer).length;
        announceAccessibility(`Hoàn thành đề thi! Bạn trả lời đúng ${correctCount} trên ${quiz.questions.length} câu. Thưởng 100 điểm kinh nghiệm.`);
      }
    }
  };

  if (isGenerating) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-8">
        <div className="relative">
          <Loader2 className="w-16 h-16 text-[#ff4b4b] animate-spin" />
          <Apple className="absolute inset-0 m-auto w-6 h-6 text-[#ff4b4b]/40" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black text-[#4b4b4b]">Đang gieo mầm bài tập...</h2>
          <p className="text-[#afafaf] font-bold">Alex AI đang soạn câu hỏi cho bạn.</p>
        </div>
      </div>
    );
  }

  if (showResult && quiz) {
    const score = answers.reduce((acc, curr, idx) => curr === quiz.questions[idx].correctAnswer ? acc + 1 : acc, 0);
    const percentage = Math.round((score / quiz.questions.length) * 100);

    return (
      <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in zoom-in duration-500 pb-28 md:pb-32 px-3 sm:px-4 w-full max-w-full">
        <div className="bg-white p-5 sm:p-10 md:p-12 rounded-[28px] sm:rounded-[50px] duo-card text-center relative overflow-hidden">
          <div className="w-16 h-16 sm:w-24 sm:h-24 bg-[#fff0f0] text-[#ff4b4b] rounded-2xl sm:rounded-[30px] flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg apple-float">
            <Award size={36} className="sm:w-12 sm:h-12" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-[900] text-[#4b4b4b] mb-1 sm:mb-2">Thu hoạch hoàn tất!</h2>
          <p className="text-xs sm:text-base text-[#afafaf] font-bold mb-6 sm:mb-8">Bạn đã trả lời đúng {score} trên {quiz.questions.length} câu hỏi.</p>
          
          <div className="text-5xl sm:text-7xl font-black text-[#ff4b4b] mb-6 sm:mb-10 tracking-tighter">{percentage}%</div>
          
          <button 
            onClick={() => setQuiz(null)}
            className="w-full max-w-sm py-3.5 sm:py-5 duo-button-primary text-white font-black rounded-xl sm:rounded-[28px] text-base sm:text-xl shadow-xl cursor-pointer"
          >
            LÀM BÀI KHÁC
          </button>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <h3 className="font-black text-lg sm:text-xl text-[#4b4b4b] uppercase tracking-widest ml-2 sm:ml-4">Xem lại chi tiết</h3>
          {quiz.questions.map((q, i) => {
            const isCorrect = answers[i] === q.correctAnswer;
            return (
              <div key={i} className={`p-4 sm:p-8 bg-white rounded-[20px] sm:rounded-[32px] border-2 sm:border-4 ${isCorrect ? 'border-[#58cc02]/20' : 'border-[#ff4b4b]/20'}`}>
                <div className="flex items-start gap-3 sm:gap-4">
                  {isCorrect ? <CheckCircle2 className="text-[#58cc02] mt-0.5 shrink-0" size={24} /> : <XCircle className="text-[#ff4b4b] mt-0.5 shrink-0" size={24} />}
                  <div className="flex-1 space-y-2 sm:space-y-3 min-w-0">
                    <p className="font-black text-sm sm:text-lg text-[#4b4b4b] leading-snug break-words">{q.question}</p>
                    <p className="text-xs sm:text-sm font-bold text-[#afafaf] italic break-words">Đáp án đúng: {q.options && q.correctAnswer !== undefined ? q.options[q.correctAnswer] : (q.targetSentence || '')}</p>
                    <div className="bg-[#f7f7f7] p-3 sm:p-5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold text-[#777] border border-[#f0f0f0]">
                      <strong>Giải thích:</strong> {q.explanation}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (quiz) {
    const q = quiz.questions[currentQuestionIndex];
    return (
      <div className="max-w-2xl mx-auto space-y-5 sm:space-y-8 animate-in slide-in-from-right-8 duration-500 pb-28 md:pb-40 px-3 sm:px-4 w-full max-w-full">
        <div className="flex items-center justify-between px-2 sm:px-4">
          <span className="text-[11px] sm:text-xs font-black text-[#ff4b4b] uppercase tracking-widest">Câu {currentQuestionIndex + 1} / {quiz.questions.length}</span>
          <div className="flex gap-1 sm:gap-1.5">
            {quiz.questions.map((_, i) => (
              <div key={i} className={`h-1.5 sm:h-2 rounded-full transition-all ${i <= currentQuestionIndex ? 'bg-[#ff4b4b] w-4 sm:w-6' : 'bg-[#f0f0f0] w-1.5 sm:w-2'}`} />
            ))}
          </div>
        </div>

        <div className="bg-white p-4 sm:p-8 md:p-10 rounded-[24px] sm:rounded-[44px] duo-card shadow-xl space-y-5 sm:space-y-8 border-2 sm:border-4 border-[#f0f0f0]">
          <h2 className="text-lg sm:text-2xl font-black text-[#4b4b4b] leading-tight tracking-tight break-words">{q.question}</h2>
          <div className="space-y-2.5 sm:space-y-4">
            {(q.options || []).map((option, i) => {
              const isSelected = answers[currentQuestionIndex] === i;
              const isCorrect = i === q.correctAnswer;
              
              let styles = "bg-white border-[#f0f0f0] hover:bg-[#fafafa] text-[#4b4b4b]";
              if (isAnswered) {
                if (isCorrect) styles = "bg-[#f0fff0] border-[#58cc02] text-[#46a302]";
                else if (isSelected) styles = "bg-[#fff0f0] border-[#ff4b4b] text-[#c33d3d]";
                else styles = "bg-white border-[#f0f0f0] opacity-40";
              } else if (isSelected) {
                styles = "bg-[#fff0f0] border-[#ff4b4b] text-[#ff4b4b]";
              }

              return (
                <button
                  key={i}
                  disabled={isAnswered}
                  onClick={() => handleSelectAnswer(i)}
                  className={`w-full p-3 sm:p-5 text-left border-2 sm:border-4 rounded-xl sm:rounded-[24px] transition-all font-black text-sm sm:text-lg flex items-center justify-between group active:scale-[0.98] gap-2 ${styles}`}
                >
                  <span className="flex items-center gap-2.5 sm:gap-4 flex-1 min-w-0">
                    <span className="opacity-30 text-xs sm:text-sm font-black shrink-0">{i + 1}.</span> 
                    <span className="break-words flex-1 leading-snug">{option}</span>
                  </span>
                  {!isAnswered && <ChevronRight size={18} className="text-[#f0f0f0] group-hover:text-[#ff4b4b] transition-all shrink-0" />}
                  {isAnswered && isCorrect && <Check size={20} className="shrink-0" />}
                  {isAnswered && isSelected && !isCorrect && <X size={20} className="shrink-0" />}
                </button>
              );
            })}
          </div>
          {isAnswered && (
             <div className="p-3.5 sm:p-6 bg-[#f7f7f7] rounded-xl sm:rounded-[24px] border border-[#f0f0f0] animate-in slide-in-from-top-2">
                <p className="text-xs sm:text-sm font-bold text-[#777]">
                  <strong>Ghi chú:</strong> {q.explanation}
                </p>
             </div>
          )}
        </div>

        {/* Floating Action Button for Next */}
        <div className="fixed bottom-0 left-0 right-0 h-18 sm:h-24 bg-white border-t-2 sm:border-t-4 border-[#f0f0f0] px-4 sm:px-6 flex items-center justify-center z-[210] pb-[max(8px,env(safe-area-inset-bottom))]">
           <div className="max-w-2xl w-full flex justify-end">
              <button 
                onClick={handleNextQuestion}
                disabled={!isAnswered}
                className={`w-full sm:w-auto px-8 sm:px-16 py-3 sm:py-4 font-black text-sm sm:text-xl rounded-xl sm:rounded-[24px] transition-all shadow-xl active:translate-y-1 ${
                  !isAnswered 
                  ? 'bg-[#e5e5e5] text-[#afafaf] cursor-not-allowed border-b-0' 
                  : 'duo-button-primary text-white'
                }`}
              >
                {currentQuestionIndex < quiz.questions.length - 1 ? 'TIẾP TỤC' : 'HOÀN THÀNH'}
              </button>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-10 pb-28 md:pb-32 px-3 sm:px-4 md:px-8 py-3 sm:py-6 overflow-x-hidden w-full max-w-full">
      {/* Banner phong cách Từ điển Táo */}
      <div className="bg-[#ce82ff] shadow-[0_6px_0_0_#a855f7] sm:shadow-[0_8px_0_0_#a855f7] rounded-[24px] sm:rounded-[30px] md:rounded-[40px] p-4 sm:p-6 md:p-12 text-white relative overflow-hidden transition-all">
        <div className="relative z-10 space-y-2.5 sm:space-y-4">
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-[900] leading-tight">Đề Thi AI Thông Minh</h1>
          <p className="text-xs sm:text-base md:text-lg font-bold opacity-90 max-w-xl">
            Alex AI sẽ tự động biên soạn đề kiểm tra trắc nghiệm chuyên sâu theo chủ đề và trình độ của bạn.
          </p>
          <div className="flex flex-wrap gap-2 sm:gap-3 mt-3 sm:mt-8">
            <div className="bg-white/20 px-3 py-1.5 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl backdrop-blur-md font-black text-[10px] md:text-xs uppercase tracking-wider flex items-center gap-1.5 sm:gap-2">
              <Sparkles size={14} /> Chủ đề: {topic}
            </div>
            <div className="bg-white/30 px-3 py-1.5 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl backdrop-blur-md font-black text-[10px] md:text-xs uppercase tracking-wider flex items-center gap-1 sm:gap-1.5">
              <span>Độ khó: {level}</span>
            </div>
          </div>
        </div>
        <Brain className="absolute right-[-20px] top-[-20px] text-white/10 w-36 h-36 sm:w-48 sm:h-48 md:w-64 md:h-64 pointer-events-none select-none" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-8 items-start">
        <div className="bg-white p-4 sm:p-8 md:p-10 rounded-[24px] sm:rounded-[44px] duo-card space-y-5 sm:space-y-8 shadow-sm border-2 sm:border-4 border-[#f0f0f0]">
          <div className="space-y-2.5 sm:space-y-4">
            <label className="block text-xs font-black text-[#afafaf] uppercase tracking-widest ml-2 sm:ml-4">Chủ đề bài tập</label>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {['Grammar', 'Vocabulary', 'IELTS', 'Business', 'Phrasal Verbs', 'Tenses'].map(t => (
                <button
                  key={t}
                  onClick={() => setTopic(t)}
                  className={`px-3 py-2.5 sm:py-4 rounded-xl sm:rounded-[22px] font-black text-xs sm:text-sm transition-all border-2 sm:border-4 ${topic === t ? 'bg-[#ff4b4b] border-[#ff4b4b] text-white shadow-md' : 'bg-[#f7f7f7] text-[#afafaf] border-transparent hover:bg-[#f0f0f0]'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2.5 sm:space-y-4">
            <label className="block text-xs font-black text-[#afafaf] uppercase tracking-widest ml-2 sm:ml-4">Độ khó</label>
            <div className="flex gap-2 sm:gap-3">
              {['Beginner', 'Intermediate', 'Advanced'].map(l => (
                <button
                  key={l}
                  onClick={() => setLevel(l)}
                  className={`flex-1 py-2.5 sm:py-4 rounded-xl sm:rounded-[22px] font-black text-xs sm:text-sm transition-all border-2 sm:border-4 ${level === l ? 'bg-[#58cc02] border-[#58cc02] text-white shadow-md' : 'bg-[#f7f7f7] text-[#afafaf] border-transparent hover:bg-[#f0f0f0]'}`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={startQuiz}
            className="w-full py-3.5 sm:py-5 duo-button-primary text-white font-[900] rounded-xl sm:rounded-[28px] text-base sm:text-xl flex items-center justify-center gap-2.5 shadow-xl cursor-pointer"
          >
            <Sparkles size={20} /> BẮT ĐẦU NGAY
          </button>
        </div>

        <div className="space-y-8">
          <div className="bg-[#f0fff0] p-8 rounded-[40px] border-4 border-[#58cc02]/10 space-y-4">
             <h4 className="font-black text-[#46a302] text-xl">Tại sao nên làm bài tập?</h4>
             <p className="text-sm text-[#58cc02] font-bold leading-relaxed">Mỗi bài tập AI là duy nhất. Alex sẽ dựa vào kết quả học tập của bạn để đưa ra các câu hỏi đánh đố những phần bạn còn yếu.</p>
          </div>
          
          <div className="space-y-6">
             <h4 className="font-[900] text-[#4b4b4b] uppercase tracking-widest ml-4 text-sm">Thành tích gần đây</h4>
             {[
               { title: 'Grammar Pro', date: '2 ngày trước', score: '95%' },
               { title: 'Vocabulary King', date: '5 ngày trước', score: '100%' }
             ].map((item, i) => (
               <div key={i} className="flex items-center justify-between p-6 bg-white rounded-[32px] duo-card cursor-default">
                 <div className="flex items-center gap-5">
                   <div className="w-14 h-14 bg-[#fff4dd] rounded-[20px] flex items-center justify-center text-[#ff9600] shadow-sm">
                     <Award size={28} />
                   </div>
                   <div>
                     <p className="font-black text-[#4b4b4b]">{item.title}</p>
                     <p className="text-xs font-bold text-[#afafaf] uppercase tracking-tighter">{item.date}</p>
                   </div>
                 </div>
                 <div className="text-[#58cc02] font-[900] text-xl">{item.score}</div>
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
}
