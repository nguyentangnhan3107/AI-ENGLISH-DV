
import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { UserStats, VocabularyWord } from '../types';
import { Search, BookOpen, Volume2, Trophy, GraduationCap, Plus, Trash2, Edit3, X, Save, Sparkles, AlertCircle, Loader2, Wand2, Info, Mic, Send, CheckCircle2, ArrowRight } from 'lucide-react';
import { playTTS, stopTTS, suggestVocabulary, checkVocabularyUsage } from '../services/geminiService';

export default function Vocabulary({ stats, onUpdateProfile }: { stats: UserStats, onUpdateProfile?: (d: Partial<UserStats>) => void }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPracticeModal, setShowPracticeModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingWord, setEditingWord] = useState<VocabularyWord | null>(null);
  
  const [wordForm, setWordForm] = useState({ word: '', meaning: '', example: '' });
  const [aiInput, setAiInput] = useState('');

  const [practiceWord, setPracticeWord] = useState<VocabularyWord | null>(null);
  const [practiceStep, setPracticeStep] = useState(0); 
  const [isRecording, setIsRecording] = useState(false);
  const [pronunciationResult, setPronunciationResult] = useState('');
  const [recordingMessage, setRecordingMessage] = useState('');
  const [userSentence, setUserSentence] = useState('');
  const [isAnalyzingSentence, setIsAnalyzingSentence] = useState(false);
  const [sentenceFeedback, setSentenceFeedback] = useState<{ isCorrect: boolean, feedback: string, correctedSentence: string } | null>(null);

  const isIeltsMode = stats.studyMode === 'ielts';

  // Preferences for learners with low vision are saved locally on this device.
  const [vocabFontScale, setVocabFontScale] = useState<number>(() => {
    try {
      const saved = Number(localStorage.getItem('eng_ai_vocab_font_scale'));
      return [1, 1.15, 1.3, 1.5].find(size => Math.abs(size - saved) < 0.001) ?? 1;
    } catch { return 1; }
  });
  const [highContrast, setHighContrast] = useState<boolean>(() => {
    try { return localStorage.getItem('eng_ai_vocab_high_contrast') === 'true'; }
    catch { return false; }
  });
  const [showVisionHelp, setShowVisionHelp] = useState<boolean>(() => {
    try { return localStorage.getItem('eng_ai_vocab_vision_help') !== 'false'; }
    catch { return true; }
  });

  useEffect(() => {
    try {
      localStorage.setItem('eng_ai_vocab_font_scale', String(vocabFontScale));
      localStorage.setItem('eng_ai_vocab_high_contrast', String(highContrast));
      localStorage.setItem('eng_ai_vocab_vision_help', String(showVisionHelp));
    } catch (error) {
      console.warn('Không thể lưu cài đặt hiển thị Sổ tay:', error);
    }
  }, [vocabFontScale, highContrast, showVisionHelp]);

  const readVocabularyEntry = (word: VocabularyWord, onComplete?: () => void) => {
    // Force the right voice per field to avoid English words being spoken with a Vietnamese voice.
    playTTS(word.word, {
      lang: 'en-US', rate: 0.92,
      onEnd: () => playTTS(word.meaning, {
        lang: 'vi-VN', rate: 0.92,
        onEnd: () => {
          if (word.example?.trim()) {
            playTTS(word.example, { lang: 'en-US', rate: 0.92, onEnd: onComplete });
          } else {
            onComplete?.();
          }
        }
      })
    });
  };

  const readVisibleVocabulary = (index = 0, list = filteredWords.slice(0, 20)) => {
    if (index >= list.length) return;
    readVocabularyEntry(list[index], () => readVisibleVocabulary(index + 1, list));
  };

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const RecognitionConstructor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (RecognitionConstructor) {
      const recognition = new RecognitionConstructor();
      recognition.continuous = false;
      recognition.lang = 'en-US';
      recognition.onresult = (e: any) => {
        const text = e.results?.[0]?.[0]?.transcript || '';
        setPronunciationResult(text);
        setRecordingMessage(text ? 'Đã nhận dạng giọng nói. Hãy kiểm tra lại nội dung bên dưới.' : 'Chưa nhận ra lời nói. Bạn thử nói rõ và gần micro hơn nhé.');
        setIsRecording(false);
      };
      recognition.onerror = (e: any) => {
        setIsRecording(false);
        const messages: Record<string, string> = {
          'not-allowed': 'Trình duyệt chưa được cấp quyền micro. Hãy cho phép Microphone trong cài đặt trang web.',
          'service-not-allowed': 'Dịch vụ nhận dạng giọng nói của trình duyệt bị chặn. Bạn vẫn có thể luyện bằng nút nghe và nhập câu bên dưới.',
          'network': 'Nhận dạng giọng nói cần kết nối mạng. Hãy thử lại hoặc dùng phần nhập câu.',
          'no-speech': 'Chưa nghe thấy giọng nói. Bạn thử lại nhé.',
          'audio-capture': 'Không tìm thấy micro. Hãy kiểm tra thiết bị đầu vào âm thanh.'
        };
        setRecordingMessage(messages[e?.error] || 'Không thể nhận dạng giọng nói. Bạn có thể tiếp tục luyện bằng cách nghe mẫu và nhập câu.');
      };
      recognitionRef.current = recognition;
    }
  }, []);

  const [selectedTopicFilter, setSelectedTopicFilter] = useState<string>('all');
  const words = stats.learnedWords || [];

  const availableTopics = Array.from(new Set(words.map(w => w.topic).filter(Boolean))) as string[];
  
  const filteredWords = words.filter(w => {
    const matchesSearch = w.word.toLowerCase().includes(searchTerm.toLowerCase()) || 
      w.meaning.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (w.topic && w.topic.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesTopic = selectedTopicFilter === 'all' || w.topic === selectedTopicFilter;
    return matchesSearch && matchesTopic;
  });

  // Tự động đồng bộ từ vựng các chủ đề Gieo Mầm AI vào Sổ tay để người dùng luôn có sẵn
  useEffect(() => {
    try {
      const aiUnits = JSON.parse(localStorage.getItem('linguist_ai_units_complex') || '[]');
      const newWordsList: VocabularyWord[] = [];
      const currentWordSet = new Set(words.map(w => w.word.toLowerCase()));

      aiUnits.forEach((u: any) => {
        const topic = u.topic || u.title?.replace(/^chủ đề:\s*/i, '');
        const highlights = u.lessons?.[0]?.readingContent?.highlights || [];
        highlights.forEach((h: any) => {
          if (h.word && !currentWordSet.has(h.word.toLowerCase())) {
            newWordsList.push({
              word: h.word,
              meaning: h.meaning,
              example: h.example || '',
              phonetic: h.phonetic || '',
              mastery: 20,
              topic: topic
            });
            currentWordSet.add(h.word.toLowerCase());
          }
        });
      });

      if (newWordsList.length > 0 && onUpdateProfile) {
        onUpdateProfile({ learnedWords: [...words, ...newWordsList] });
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleSyncFromAiUnits = () => {
    try {
      const aiUnits = JSON.parse(localStorage.getItem('linguist_ai_units_complex') || '[]');
      const newWordsList: VocabularyWord[] = [];
      const currentWordSet = new Set(words.map(w => w.word.toLowerCase()));

      aiUnits.forEach((u: any) => {
        const topic = u.topic || u.title?.replace('Chủ đề: ', '');
        const highlights = u.lessons?.[0]?.readingContent?.highlights || [];
        highlights.forEach((h: any) => {
          if (h.word && !currentWordSet.has(h.word.toLowerCase())) {
            newWordsList.push({
              word: h.word,
              meaning: h.meaning,
              example: h.example || '',
              phonetic: h.phonetic || '',
              mastery: 20,
              topic: topic
            });
            currentWordSet.add(h.word.toLowerCase());
          }
        });
      });

      if (newWordsList.length > 0) {
        onUpdateProfile?.({ learnedWords: [...words, ...newWordsList] });
        alert(`Đã đồng bộ thành công ${newWordsList.length} từ vựng từ các chủ đề Gieo Mầm AI vào Sổ tay!`);
      } else {
        alert("Tất cả từ vựng từ các bài học AI đã có trong Sổ tay của bạn rồi!");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAiGenerate = async () => {
    if (!aiInput.trim()) return;
    setIsGenerating(true);
    try {
      const result = await suggestVocabulary(aiInput, isIeltsMode);
      setWordForm({
        word: result.word || '',
        meaning: result.meaning || '',
        example: result.example || ''
      });
    } catch (error) {
      console.error("AI Error", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wordForm.word || !wordForm.meaning) return;

    let updatedWords: VocabularyWord[];
    if (editingWord) {
      updatedWords = words.map(w => w.word === editingWord.word ? { ...wordForm, mastery: w.mastery } : w);
    } else {
      updatedWords = [...words, { ...wordForm, mastery: 10 }];
    }

    onUpdateProfile?.({ learnedWords: updatedWords });
    closeModal();
  };

  const handleDeleteWord = (wordToDelete: string) => {
    if (window.confirm(`Bạn có chắc muốn xóa từ "${wordToDelete}" khỏi sổ tay?`)) {
      const updatedWords = words.filter(w => w.word !== wordToDelete);
      onUpdateProfile?.({ learnedWords: updatedWords });
    }
  };

  const openEditModal = (w: VocabularyWord) => {
    setEditingWord(w);
    setWordForm({ word: w.word, meaning: w.meaning, example: w.example });
    setShowAddModal(true);
  };

  const openPracticeModal = (w: VocabularyWord) => {
    setPracticeWord(w);
    setPracticeStep(0);
    setPronunciationResult('');
    setRecordingMessage('');
    setUserSentence('');
    setSentenceFeedback(null);
    setShowPracticeModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingWord(null);
    setWordForm({ word: '', meaning: '', example: '' });
    setAiInput('');
  };

  useEffect(() => {
    if (!showAddModal && !showPracticeModal) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showAddModal) closeModal();
        if (showPracticeModal) {
          try { recognitionRef.current?.abort?.(); } catch { /* recognition may already be stopped */ }
          stopTTS();
          setShowPracticeModal(false);
          setIsRecording(false);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showAddModal, showPracticeModal]);

  const startRecording = () => {
    setPronunciationResult('');
    setRecordingMessage('');
    if (!recognitionRef.current) {
      setRecordingMessage('Trình duyệt này chưa hỗ trợ nhận dạng giọng nói tại chỗ. Hãy nghe mẫu và nhập câu bằng bàn phím để tiếp tục luyện tập.');
      return;
    }
    try {
      setIsRecording(true);
      recognitionRef.current.start();
    } catch (error) {
      console.warn('Không thể bắt đầu nhận dạng giọng nói:', error);
      setIsRecording(false);
      setRecordingMessage('Micro đang bận hoặc chưa sẵn sàng. Hãy thử lại sau vài giây.');
    }
  };

  const handleCheckSentence = async () => {
    if (!userSentence.trim() || !practiceWord) return;
    setIsAnalyzingSentence(true);
    try {
      const result = await checkVocabularyUsage(practiceWord.word, userSentence);
      setSentenceFeedback(result);
      
      if (result.isCorrect) {
        const updatedWords = words.map(w => 
          w.word === practiceWord.word ? { ...w, mastery: Math.min(100, (w.mastery || 0) + 15) } : w
        );
        onUpdateProfile?.({ learnedWords: updatedWords });
      }
    } catch (error) {
      console.error("Sentence Check Error", error);
    } finally {
      setIsAnalyzingSentence(false);
    }
  };

  return (
    <div
      className={`vocab-page max-w-6xl mx-auto p-3 sm:p-4 md:p-8 space-y-5 sm:space-y-8 md:space-y-12 pb-28 md:pb-32 w-full max-w-full overflow-x-hidden ${highContrast ? 'vocab-high-contrast' : ''}`}
      style={{ '--vocab-font-scale': vocabFontScale } as React.CSSProperties}
    >
      <style>{`
        .vocab-page { color: #303030; }
        .vocab-page button, .vocab-page input, .vocab-page textarea, .vocab-page a { touch-action: manipulation; }
        .vocab-page button, .vocab-page input, .vocab-page textarea, .vocab-page a, .vocab-page select {
          min-height: 44px;
        }
        .vocab-page button:focus-visible, .vocab-page input:focus-visible, .vocab-page textarea:focus-visible,
        .vocab-page a:focus-visible, .vocab-page select:focus-visible {
          outline: 4px solid #ffbf00 !important; outline-offset: 3px !important; box-shadow: 0 0 0 2px #111 !important;
        }
        .vocab-page [class*="text-xs"] { font-size: calc(.75rem * var(--vocab-font-scale)) !important; }
        .vocab-page [class*="text-sm"] { font-size: calc(.875rem * var(--vocab-font-scale)) !important; }
        .vocab-page [class*="text-base"] { font-size: calc(1rem * var(--vocab-font-scale)) !important; }
        .vocab-page [class*="text-lg"] { font-size: calc(1.125rem * var(--vocab-font-scale)) !important; }
        .vocab-page [class*="text-xl"] { font-size: calc(1.25rem * var(--vocab-font-scale)) !important; }
        .vocab-page [class*="text-2xl"] { font-size: calc(1.5rem * var(--vocab-font-scale)) !important; }
        .vocab-page [class*="text-3xl"] { font-size: calc(1.875rem * var(--vocab-font-scale)) !important; }
        .vocab-page [class*="text-4xl"] { font-size: calc(2.25rem * var(--vocab-font-scale)) !important; }
        .vocab-page [class*="text-5xl"] { font-size: calc(3rem * var(--vocab-font-scale)) !important; }
        .vocab-page [class*="text-[9px]"], .vocab-page [class*="text-[10px]"] {
          font-size: calc(.78rem * var(--vocab-font-scale)) !important; line-height: 1.45 !important;
        }
        .vocab-page .vocab-readable { line-height: 1.55 !important; }
        .vocab-high-contrast { background: #000 !important; color: #fff !important; }
        .vocab-high-contrast [class*="bg-"], .vocab-high-contrast .duo-card,
        .vocab-high-contrast input, .vocab-high-contrast textarea, .vocab-high-contrast select {
          background: #000 !important; color: #fff !important; border-color: #fff !important; box-shadow: none !important;
        }
        .vocab-high-contrast h1, .vocab-high-contrast h2, .vocab-high-contrast h3,
        .vocab-high-contrast p, .vocab-high-contrast span, .vocab-high-contrast label,
        .vocab-high-contrast input, .vocab-high-contrast textarea, .vocab-high-contrast div,
        .vocab-high-contrast small, .vocab-high-contrast strong { color: #fff !important; }
        .vocab-high-contrast input::placeholder, .vocab-high-contrast textarea::placeholder { color: #dedede !important; opacity: 1 !important; }
        .vocab-high-contrast a { color: #ffff00 !important; text-decoration: underline !important; }
        .vocab-high-contrast button:not([class*="bg-[#1cb0f6]"]):not([class*="bg-[#58cc02]"]):not([class*="bg-[#ce82ff]"]) {
          background: #000 !important; color: #ffff00 !important; border: 2px solid #ffff00 !important; box-shadow: none !important;
        }
        .vocab-high-contrast .vocab-accessibility-toolbar { background: #000 !important; color: #fff !important; border-color: #ffff00 !important; }
        .vocab-high-contrast .vocab-hero { background: #000 !important; border: 3px solid #ffff00 !important; box-shadow: none !important; }
        .vocab-high-contrast .vocab-hero * { color: #fff !important; }
        @media (prefers-reduced-motion: reduce) { .vocab-page *, .vocab-page *::before, .vocab-page *::after { animation-duration: .01ms !important; transition-duration: .01ms !important; scroll-behavior: auto !important; } }
      `}</style>
      <div className={`vocab-hero ${isIeltsMode ? 'bg-[#ce82ff] shadow-[0_6px_0_0_#a855f7]' : 'bg-[#1cb0f6] shadow-[0_6px_0_0_#1899d6]'} rounded-[20px] sm:rounded-[30px] md:rounded-[40px] p-4 sm:p-6 md:p-12 text-white relative overflow-hidden transition-all`}>
        <div className="relative z-10 space-y-2.5 sm:space-y-4">
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-[900] leading-tight">{isIeltsMode ? 'Academic Vocabulary' : 'Sổ Tay Thông Minh'}</h1>
          <p className="text-xs sm:text-base md:text-lg font-bold opacity-90 max-w-xl">{isIeltsMode ? `Luyện tập từ vựng học thuật cho mục tiêu Band ${stats.targetBand}.` : 'Lưu trữ từ vựng cá nhân, luyện phát âm cùng Alex.'}</p>
          <div className="flex flex-wrap gap-2 sm:gap-3 mt-3 sm:mt-8">
            <div className="bg-white/20 px-3 py-1.5 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl backdrop-blur-md font-black text-[10px] md:text-xs uppercase tracking-wider">
               Tổng: {words.length} từ
            </div>
            {isIeltsMode && (
              <div className="bg-white/40 px-3 py-1.5 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl backdrop-blur-md font-black text-[10px] md:text-xs uppercase tracking-wider flex items-center gap-1.5">
                 <Sparkles size={14} /> Academic Mode
              </div>
            )}
          </div>
        </div>
        <BookOpen className="absolute right-[-20px] top-[-20px] text-white/10 w-36 h-36 sm:w-48 sm:h-48 md:w-64 md:h-64 pointer-events-none" />
      </div>

      <section className="vocab-accessibility-toolbar bg-white border-2 border-[#d7eaf5] rounded-2xl p-3 sm:p-4 shadow-sm space-y-3" aria-label="Cài đặt hiển thị cho người thị lực kém">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-black text-sm sm:text-base text-[#303030]">Tùy chỉnh hiển thị</span>
            <span className="text-sm font-bold text-[#555]" aria-live="polite">Chữ {Math.round(vocabFontScale * 100)}%</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setVocabFontScale(v => ([1, 1.15, 1.3, 1.5].filter(size => size < v - 0.001).pop() ?? 1))}
              disabled={vocabFontScale <= 1} aria-label="Giảm cỡ chữ" title="Giảm cỡ chữ"
              className="min-w-12 px-4 py-2 border-2 border-[#777] bg-white text-[#222] font-black rounded-xl disabled:opacity-40 focus-visible:outline-4 focus-visible:outline-yellow-400">A−</button>
            <button type="button" onClick={() => setVocabFontScale(1)} aria-label="Đặt cỡ chữ về mặc định" title="Cỡ chữ mặc định"
              className="min-w-12 px-4 py-2 border-2 border-[#777] bg-white text-[#222] font-black rounded-xl">A</button>
            <button type="button" onClick={() => setVocabFontScale(v => ([1, 1.15, 1.3, 1.5].find(size => size > v + 0.001) ?? 1.5))}
              disabled={vocabFontScale >= 1.5} aria-label="Tăng cỡ chữ" title="Tăng cỡ chữ"
              className="min-w-12 px-4 py-2 border-2 border-[#777] bg-white text-[#222] font-black rounded-xl">A+</button>
            <button type="button" onClick={() => setHighContrast(v => !v)} aria-pressed={highContrast}
              className={`px-4 py-2 border-2 font-black rounded-xl ${highContrast ? 'bg-black text-yellow-300 border-yellow-300' : 'bg-white text-[#303030] border-[#777]'}`}>
              {highContrast ? '✓ Tương phản cao' : 'Tương phản cao'}
            </button>
            <button type="button" onClick={() => setShowVisionHelp(v => !v)} aria-expanded={showVisionHelp}
              className="px-4 py-2 border-2 border-[#777] bg-white text-[#303030] font-black rounded-xl">
              {showVisionHelp ? 'Ẩn hướng dẫn' : 'Hiện hướng dẫn'}
            </button>
          </div>
        </div>
        {showVisionHelp && (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-t border-[#d7d7d7] pt-3">
            <p className="text-sm sm:text-base font-semibold vocab-readable text-[#444]">Mẹo: dùng A+ để phóng to chữ, bật tương phản cao để dễ phân biệt chữ với nền. Các tùy chọn được lưu trên máy này.</p>
            <div className="flex flex-wrap gap-2 shrink-0">
              <button type="button" onClick={() => { if (filteredWords.length) readVisibleVocabulary(); else playTTS('Sổ tay đang trống.', { lang: 'vi-VN' }); }}
                disabled={filteredWords.length === 0} aria-label="Đọc tối đa 20 từ đang hiển thị, gồm từ tiếng Anh và nghĩa tiếng Việt"
                className="px-4 py-2 bg-[#1cb0f6] text-white font-black rounded-xl disabled:opacity-40 flex items-center justify-center gap-2">
                <Volume2 size={18} /> Đọc danh sách
              </button>
              <button type="button" onClick={() => stopTTS()} aria-label="Dừng đọc giọng nói"
                className="px-4 py-2 border-2 border-[#777] bg-white text-[#222] font-black rounded-xl">Dừng đọc</button>
            </div>
          </div>
        )}
      </section>

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch w-full">
        <div className="bg-white duo-card px-3.5 sm:px-6 py-2.5 sm:py-4 flex items-center gap-3 flex-1 w-full focus-within:border-[#1cb0f6] transition-all rounded-xl sm:rounded-2xl border-2">
           <Search size={20} className="text-[#afafaf] shrink-0" />
           <label htmlFor="vocab-search" className="sr-only">Tìm kiếm từ vựng hoặc chủ đề</label>
           <input
            id="vocab-search"
            type="search"
            aria-label="Tìm kiếm từ vựng hoặc chủ đề"
            placeholder="Tìm kiếm từ vựng hoặc chủ đề..."
            className="bg-transparent outline-none font-bold text-sm sm:text-lg w-full text-[#4b4b4b] vocab-readable"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
           />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            type="button"
            aria-label="Đồng bộ từ vựng từ các bài học Gieo Mầm AI"
            onClick={handleSyncFromAiUnits}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 sm:px-5 py-2.5 sm:py-4 bg-white border-2 border-[#58cc02] text-[#58cc02] hover:bg-[#f0fff0] font-black rounded-xl sm:rounded-2xl text-xs sm:text-sm active:translate-y-0.5 transition-all cursor-pointer shadow-xs shrink-0"
            title="Đồng bộ từ vựng từ các chủ đề đã Gieo mầm"
          >
            <Sparkles size={16} /> <span className="truncate">Đồng bộ AI</span>
          </button>
          <button
            type="button"
            aria-label="Thêm từ vựng mới vào sổ tay"
            onClick={() => setShowAddModal(true)}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 sm:px-8 py-2.5 sm:py-4 ${isIeltsMode ? 'bg-[#ce82ff] shadow-[0_4px_0_0_#a855f7]' : 'bg-[#1cb0f6] shadow-[0_4px_0_0_#1899d6]'} text-white font-black rounded-xl sm:rounded-2xl text-xs sm:text-base active:translate-y-0.5 active:shadow-none transition-all shrink-0 cursor-pointer`}
          >
            <Plus size={18} strokeWidth={3} /> <span className="truncate">THÊM TỪ</span>
          </button>
        </div>
      </div>

      {/* Topic Filter Pills */}
      {availableTopics.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
          <span className="text-xs font-black uppercase text-[#afafaf] shrink-0 mr-1">Chủ đề:</span>
          <button
            type="button"
            onClick={() => setSelectedTopicFilter('all')}
            className={`px-4 py-1.5 rounded-full font-[900] text-xs transition-all shrink-0 cursor-pointer ${
              selectedTopicFilter === 'all'
                ? 'bg-[#4b4b4b] text-white shadow-xs'
                : 'bg-white border-2 border-[#e5e5e5] text-[#777] hover:border-[#4b4b4b]'
            }`}
          >
            Tất cả ({words.length})
          </button>
          {availableTopics.map(topic => {
            const count = words.filter(w => w.topic === topic).length;
            const isSelected = selectedTopicFilter === topic;
            return (
              <button
                key={topic}
                type="button"
                onClick={() => setSelectedTopicFilter(topic)}
                className={`px-4 py-1.5 rounded-full font-[900] text-xs transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#58cc02] text-white shadow-xs'
                    : 'bg-white border-2 border-[#e5e5e5] text-[#777] hover:border-[#58cc02] hover:text-[#58cc02]'
                }`}
              >
                <span>🌱 {topic}</span>
                <span className="opacity-70 text-[10px]">({count})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Active AI Topic Action Banner */}
      {selectedTopicFilter !== 'all' && (
        <div className="p-4 md:p-5 bg-[#f0fff0] rounded-[24px] border-2 border-[#58cc02]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🌱</span>
            <div>
              <h3 className="font-[900] text-sm md:text-base text-[#4b4b4b]">
                Chủ đề đang chọn: <span className="text-[#58cc02]">{selectedTopicFilter}</span>
              </h3>
              <p className="text-xs font-bold text-[#777]">
                Có {filteredWords.length} từ vựng chuyên sâu trong sổ tay. Bạn có thể luyện phát âm qua micro hoặc vào học bài tập tương tác.
              </p>
            </div>
          </div>
          <Link
            to="/"
            className="px-5 py-3 bg-[#58cc02] hover:bg-[#46a302] text-white font-[900] text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center gap-2 shrink-0 active:scale-95"
          >
            <span>Vào học trên Cây học tập</span>
            <ArrowRight size={15} />
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
        {filteredWords.length > 0 ? filteredWords.map((w, i) => (
          <div key={i} className={`duo-card p-5 md:p-8 bg-white flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-${isIeltsMode ? '[#ce82ff]' : '[#1cb0f6]'} transition-all group relative overflow-hidden`}>
             <div className="absolute left-0 bottom-0 top-0 bg-[#58cc02]/5 transition-all" style={{ width: `${w.mastery}%` }} />
             
             <div className="flex items-start gap-4 md:gap-6 relative z-10">
                <button
                  type="button"
                  onClick={() => playTTS(w.word, { lang: 'en-US', rate: 0.92 })}
                  aria-label={`Nghe phát âm tiếng Anh của từ ${w.word}`}
                  title={`Nghe phát âm ${w.word}`}
                  className={`w-12 h-12 md:w-16 md:h-16 min-w-12 min-h-12 rounded-2xl ${isIeltsMode ? 'bg-purple-50 text-purple-500 border-purple-200' : 'bg-[#ddf4ff] text-[#1cb0f6] border-[#84d8ff]'} flex items-center justify-center hover:scale-110 active:scale-95 transition-transform shrink-0 shadow-sm border-2 cursor-pointer`}
                >
                   <Volume2 size={24} className="md:w-8 md:h-8" />
                </button>
                <div className="space-y-1">
                   <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-xl md:text-2xl font-black text-[#4b4b4b] uppercase tracking-tight vocab-readable">{w.word}</h3>
                      {w.phonetic && (
                        <span className="text-xs font-mono font-bold text-[#888] bg-black/5 px-2 py-0.5 rounded-md">
                          {w.phonetic}
                        </span>
                      )}
                      {w.topic && (
                        <span className="text-[10px] font-black uppercase tracking-wider bg-[#58cc02]/15 text-[#58cc02] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <Sparkles size={10} /> {w.topic}
                        </span>
                      )}
                      {w.mastery >= 100 && (
                        <div title="Thành thạo" className="bg-[#e3ffd9] p-1 rounded-full shrink-0">
                          <GraduationCap size={16} className="text-[#58cc02]" />
                        </div>
                      )}
                   </div>
                   <div className={`${isIeltsMode ? 'text-purple-600' : 'text-[#287500]'} font-black text-lg md:text-xl vocab-readable`}>
                      {w.meaning}
                   </div>
                   <p className="text-xs md:text-sm text-[#696969] italic font-medium leading-relaxed line-clamp-2 vocab-readable">"{w.example || 'Chưa có ví dụ'}"</p>
                   <button type="button" onClick={() => readVocabularyEntry(w)} aria-label={`Nghe từ ${w.word}, nghĩa tiếng Việt và ví dụ`}
                     className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-xl border-2 border-[#1cb0f6] bg-white px-3 py-2 text-sm font-black text-[#08699a] hover:bg-[#eefaff]">
                     <Volume2 size={17} /> Nghe từ + nghĩa + ví dụ
                   </button>
                </div>
             </div>

             <div className="flex items-center md:flex-col md:items-end justify-between md:justify-center gap-4 relative z-10 border-t md:border-t-0 pt-4 md:pt-0">
                <div className="flex gap-2">
                   <button
                     type="button"
                     aria-label={`Luyện tập với từ ${w.word}`}
                     onClick={() => openPracticeModal(w)}
                     className={`px-3 py-1.5 md:px-4 md:py-2 ${isIeltsMode ? 'bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-600' : 'bg-[#e3ffd9] text-[#58cc02] border-[#58cc02]/20 hover:bg-[#58cc02]'} font-black rounded-xl border-2 hover:text-white transition-all text-[10px] md:text-xs uppercase tracking-widest cursor-pointer`}
                   >
                     Luyện tập
                   </button>
                   <button
                     type="button"
                     onClick={() => handleDeleteWord(w.word)}
                     className="min-w-11 min-h-11 p-2 text-[#666] hover:text-[#ff4b4b] rounded-lg transition-colors cursor-pointer focus-visible:outline-4"
                     aria-label={`Xóa từ ${w.word}`}
                     title={`Xóa từ ${w.word}`}
                   >
                     <Trash2 size={16} />
                   </button>
                </div>
                <div className="text-right flex flex-col items-end">
                   <div className="h-1.5 w-16 md:w-24 bg-[#e5e5e5] rounded-full overflow-hidden">
                      <div className={`${isIeltsMode ? 'bg-[#ce82ff]' : 'bg-[#58cc02]'} h-full transition-all duration-500`} style={{ width: `${w.mastery}%` }} />
                   </div>
                   <p className="text-[9px] font-black text-[#afafaf] uppercase mt-1">Học: {w.mastery || 0}%</p>
                </div>
             </div>
          </div>
        )) : (
          <div className="col-span-full text-center py-20 md:py-32 duo-card bg-white border-dashed border-4 flex flex-col items-center space-y-6">
             <div className="w-20 h-20 md:w-24 md:h-24 bg-[#f7f7f7] rounded-full flex items-center justify-center text-[#e5e5e5]">
                <BookOpen size={48} />
             </div>
             <p className="text-xl md:text-2xl font-black text-[#afafaf]">Sổ tay đang trống.</p>
             <button type="button" onClick={() => setShowAddModal(true)} className={`${isIeltsMode ? 'bg-[#ce82ff]' : 'bg-[#1cb0f6]'} px-8 py-3 text-white font-black rounded-xl shadow-lg min-h-12`}>THÊM TỪ ĐẦU TIÊN</button>
          </div>
        )}
      </div>

      {/* MODAL: ADD/EDIT WORD */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 z-[300] flex items-end md:items-center justify-center backdrop-blur-md animate-in fade-in duration-300" onMouseDown={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
           <div role="dialog" aria-modal="true" aria-labelledby="vocab-modal-title" className="bg-white w-full md:max-w-xl md:rounded-[40px] rounded-t-[30px] p-6 md:p-10 space-y-6 shadow-2xl relative animate-in slide-in-from-bottom-10 md:zoom-in duration-300 max-h-[90vh] overflow-y-auto">
              <button type="button" onClick={closeModal} aria-label="Đóng cửa sổ thêm hoặc sửa từ" className="absolute top-6 right-6 min-h-11 min-w-11 text-[#555] hover:text-[#222] p-2 hover:bg-[#f7f7f7] rounded-full transition-all"><X size={28} /></button>
              
              <div className="text-center space-y-2 pt-2 md:pt-0">
                 <h2 id="vocab-modal-title" className="text-3xl md:text-4xl font-[900] text-[#4b4b4b]">{editingWord ? 'Sửa từ vựng' : 'Thêm từ mới'}</h2>
                 <p className="font-bold text-[#afafaf] text-sm md:text-base">{isIeltsMode ? 'Alex sẽ ưu tiên từ vựng Academic cho bạn.' : 'Alex có thể giúp bạn tìm từ vựng thông minh.'}</p>
              </div>

              {!editingWord && (
                <div className="space-y-4">
                  <div className="relative">
                    <label htmlFor="ai-vocab-prompt" className="sr-only">Nhập từ hoặc ý tưởng để AI gợi ý từ vựng</label>
                    <input
                      id="ai-vocab-prompt"
                      aria-label="Nhập từ hoặc ý tưởng để AI gợi ý từ vựng"
                      type="text"
                      className={`w-full p-5 md:p-6 duo-card outline-none font-black text-lg md:text-xl focus:border-${isIeltsMode ? '[#ce82ff]' : '[#1cb0f6]'} bg-[#fdf8ff] transition-all vocab-readable`}
                      placeholder={isIeltsMode ? "VD: Innovation, Sustainable..." : "VD: Kiên trì, Hạnh phúc..."}
                      value={aiInput}
                      onChange={(e) => setAiInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAiGenerate()}
                    />
                    <button
                      type="button"
                      aria-label="Gợi ý từ vựng bằng AI"
                      onClick={handleAiGenerate}
                      disabled={!aiInput.trim() || isGenerating}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 md:w-14 md:h-14 ${isIeltsMode ? 'bg-[#ce82ff]' : 'bg-[#1cb0f6]'} text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-all disabled:opacity-50`}
                    >
                      {isGenerating ? <Loader2 className="animate-spin" size={24} /> : <Wand2 size={24} className="md:w-7 md:h-7" />}
                    </button>
                  </div>
                </div>
              )}

              <form onSubmit={handleSaveWord} className="space-y-5 border-t-2 border-[#f7f7f7] pt-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-1">
                      <label htmlFor="vocab-word-input" className="text-[10px] font-black text-[#666] uppercase tracking-widest ml-1">Tiếng Anh</label>
                      <input
                        id="vocab-word-input"
                        aria-label="Từ tiếng Anh"
                        required
                        type="text" 
                        className="w-full p-4 duo-card outline-none font-bold text-base focus:border-[#1cb0f6] transition-all" 
                        value={wordForm.word}
                        onChange={(e) => setWordForm({...wordForm, word: e.target.value})}
                      />
                   </div>
                   <div className="space-y-1">
                      <label htmlFor="vocab-meaning-input" className="text-[10px] font-black text-[#666] uppercase tracking-widest ml-1">Nghĩa Việt</label>
                      <input
                        id="vocab-meaning-input"
                        aria-label="Nghĩa tiếng Việt"
                        required
                        type="text" 
                        className={`w-full p-4 duo-card outline-none font-bold text-base focus:border-${isIeltsMode ? '[#ce82ff]' : '[#1cb0f6]'} transition-all`} 
                        value={wordForm.meaning}
                        onChange={(e) => setWordForm({...wordForm, meaning: e.target.value})}
                      />
                   </div>
                 </div>

                 <div className="space-y-1">
                    <label htmlFor="vocab-example-input" className="text-[10px] font-black text-[#666] uppercase tracking-widest ml-1">Ví dụ minh họa</label>
                    <textarea
                      id="vocab-example-input"
                      aria-label="Câu ví dụ minh họa"
                      rows={2}
                      className="w-full p-4 duo-card outline-none font-bold text-base focus:border-[#58cc02] transition-all" 
                      value={wordForm.example}
                      onChange={(e) => setWordForm({...wordForm, example: e.target.value})}
                    />
                 </div>

                 <div className="flex gap-4 pt-4">
                    <button type="submit" className={`w-full py-4 ${isIeltsMode ? 'bg-[#ce82ff] shadow-[0_6px_0_0_#a855f7]' : 'bg-[#1cb0f6] shadow-[0_6px_0_0_#1899d6]'} text-white font-black rounded-2xl text-lg active:translate-y-1 active:shadow-none transition-all`}>
                       {editingWord ? 'CẬP NHẬT' : 'LƯU LẠI'}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* MODAL: ACCESSIBLE WORD PRACTICE */}
      {showPracticeModal && practiceWord && (
        <div className="fixed inset-0 bg-black/80 z-[310] flex items-end md:items-center justify-center backdrop-blur-sm" onMouseDown={(e) => { if (e.target === e.currentTarget) { try { recognitionRef.current?.abort?.(); } catch { /* already stopped */ } stopTTS(); setShowPracticeModal(false); setIsRecording(false); } }}>
          <div role="dialog" aria-modal="true" aria-labelledby="practice-modal-title" className="w-full md:max-w-2xl bg-white text-[#222] rounded-t-3xl md:rounded-3xl p-5 sm:p-7 space-y-5 max-h-[92vh] overflow-y-auto shadow-2xl border-2 border-[#1cb0f6]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-black uppercase tracking-wide text-[#08699a]">Luyện từ vựng · Bước {practiceStep + 1}/2</p>
                <h2 id="practice-modal-title" className="text-2xl sm:text-3xl font-black mt-1 vocab-readable">{practiceWord.word}</h2>
                <p className="text-lg sm:text-xl font-bold mt-1 vocab-readable">{practiceWord.meaning}</p>
              </div>
              <button type="button" aria-label="Đóng cửa sổ luyện từ" onClick={() => { try { recognitionRef.current?.abort?.(); } catch { /* already stopped */ } stopTTS(); setShowPracticeModal(false); setIsRecording(false); }} className="min-w-12 min-h-12 rounded-xl border-2 border-[#777] bg-white text-[#222] flex items-center justify-center"><X size={24} /></button>
            </div>

            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => playTTS(practiceWord.word, { lang: 'en-US', rate: 0.9 })} className="min-h-12 px-4 py-3 rounded-xl bg-[#1cb0f6] text-white font-black flex items-center gap-2"><Volume2 size={20} /> Nghe từ tiếng Anh</button>
              <button type="button" onClick={() => playTTS(practiceWord.meaning, { lang: 'vi-VN', rate: 0.9 })} className="min-h-12 px-4 py-3 rounded-xl border-2 border-[#555] bg-white text-[#222] font-black flex items-center gap-2"><Volume2 size={20} /> Nghe nghĩa tiếng Việt</button>
              <button type="button" onClick={() => stopTTS()} className="min-h-12 px-4 py-3 rounded-xl border-2 border-[#555] bg-white text-[#222] font-black">Dừng đọc</button>
            </div>

            {practiceStep === 0 ? (
              <section aria-labelledby="pronunciation-step-title" className="space-y-4 border-t-2 border-[#ddd] pt-4">
                <h3 id="pronunciation-step-title" className="text-xl font-black vocab-readable">Bước 1: Nghe và thử phát âm</h3>
                {practiceWord.example && <p className="text-base sm:text-lg font-semibold vocab-readable">Ví dụ: “{practiceWord.example}”</p>}
                <button type="button" onClick={startRecording} aria-pressed={isRecording} className={`min-h-12 w-full sm:w-auto px-5 py-3 rounded-xl font-black border-2 ${isRecording ? 'bg-[#b42318] text-white border-[#b42318]' : 'bg-white text-[#222] border-[#555]'}`}>
                  <Mic size={20} className="inline mr-2" />{isRecording ? 'Đang nghe… hãy nói từ tiếng Anh' : 'Thử nói từ này'}
                </button>
                {recordingMessage && <p role="status" aria-live="polite" className="text-base font-bold rounded-xl p-3 border-2 border-[#777] bg-[#fff8db] text-[#222] vocab-readable">{recordingMessage}</p>}
                {pronunciationResult && <div className="rounded-xl border-2 border-[#1cb0f6] p-4 space-y-1" aria-live="polite"><p className="text-sm font-black text-[#08699a]">Trình duyệt nghe được</p><p className="text-lg font-bold vocab-readable">{pronunciationResult}</p><p className="text-sm vocab-readable">So sánh với từ mẫu: <strong>{practiceWord.word}</strong></p></div>}
                <button type="button" onClick={() => setPracticeStep(1)} className="min-h-12 w-full px-5 py-3 rounded-xl bg-[#1cb0f6] text-white font-black">Tiếp theo: Đặt câu <ArrowRight size={20} className="inline ml-2" /></button>
              </section>
            ) : (
              <section aria-labelledby="sentence-step-title" className="space-y-4 border-t-2 border-[#ddd] pt-4">
                <h3 id="sentence-step-title" className="text-xl font-black vocab-readable">Bước 2: Tự đặt câu với “{practiceWord.word}”</h3>
                <label htmlFor="practice-user-sentence" className="block text-base font-bold vocab-readable">Nhập một câu tiếng Anh có chứa từ trên:</label>
                <textarea id="practice-user-sentence" rows={3} value={userSentence} onChange={e => setUserSentence(e.target.value)} placeholder={`Ví dụ: I use the word ${practiceWord.word} in a sentence.`} className="w-full p-4 border-2 border-[#666] rounded-xl text-lg text-[#222] bg-white focus-visible:outline-4 focus-visible:outline-yellow-400" />
                <button type="button" onClick={handleCheckSentence} disabled={!userSentence.trim() || isAnalyzingSentence} className="min-h-12 w-full px-5 py-3 rounded-xl bg-[#1cb0f6] text-white font-black disabled:opacity-50">
                  {isAnalyzingSentence ? <><Loader2 className="inline animate-spin mr-2" size={20} />Đang kiểm tra câu…</> : <><CheckCircle2 size={20} className="inline mr-2" />Kiểm tra câu với AI</>}
                </button>
                {sentenceFeedback && <div role="status" aria-live="polite" className={`rounded-xl border-2 p-4 space-y-2 ${sentenceFeedback.isCorrect ? 'border-[#287500] bg-[#f0fff0]' : 'border-[#9a6700] bg-[#fff8db]'}`}>
                  <p className="text-lg font-black vocab-readable">{sentenceFeedback.isCorrect ? 'Câu dùng từ phù hợp' : 'Góp ý để cải thiện'}</p>
                  <p className="text-base font-semibold vocab-readable">{sentenceFeedback.feedback}</p>
                  {sentenceFeedback.correctedSentence && <p className="text-base font-bold vocab-readable">Gợi ý: {sentenceFeedback.correctedSentence}</p>}
                </div>}
                <button type="button" onClick={() => setPracticeStep(0)} className="min-h-12 w-full px-5 py-3 rounded-xl border-2 border-[#555] bg-white text-[#222] font-black">Quay lại bước phát âm</button>
              </section>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
