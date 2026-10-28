import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Mic, MicOff, RotateCcw, Volume2, Award, BookOpen } from 'lucide-react';
import { UserStats } from '../types';
import { playTTS, stopTTS } from '../services/geminiService';
import { playCorrectSound, playClickSound } from '../services/soundEffects';

type Level = 'A1' | 'A2' | 'B1' | 'B2';
type Sentence = { text: string; vi: string };

const SENTENCES: Record<Level, Sentence[]> = {
  A1: [
    { text: 'Hello, my name is Anna.', vi: 'Xin chào, tên tôi là Anna.' },
    { text: 'I go to school every day.', vi: 'Tôi đi học mỗi ngày.' },
    { text: 'I like playing football with my friends.', vi: 'Tôi thích chơi bóng đá với bạn bè.' },
    { text: 'My family lives in a small house.', vi: 'Gia đình tôi sống trong một ngôi nhà nhỏ.' },
    { text: 'Could I have a glass of water, please?', vi: 'Làm ơn cho tôi một cốc nước được không?' },
    { text: 'I usually get up at six thirty.', vi: 'Tôi thường thức dậy lúc sáu giờ rưỡi.' },
    { text: 'The weather is sunny and warm today.', vi: 'Hôm nay thời tiết nắng và ấm áp.' },
    { text: 'I am learning English because it is useful.', vi: 'Tôi đang học tiếng Anh vì nó hữu ích.' }
  ],
  A2: [
    { text: 'I enjoy listening to music in my free time.', vi: 'Tôi thích nghe nhạc lúc rảnh.' },
    { text: 'Could you tell me how to get to the bus station?', vi: 'Bạn có thể chỉ tôi đường đến bến xe buýt không?' },
    { text: 'Last weekend, I visited my grandparents.', vi: 'Cuối tuần trước, tôi đã thăm ông bà.' },
    { text: 'I would like to order a chicken sandwich, please.', vi: 'Tôi muốn gọi một chiếc bánh mì gà.' },
    { text: 'We should protect the environment by reducing waste.', vi: 'Chúng ta nên bảo vệ môi trường bằng cách giảm rác thải.' },
    { text: 'My favorite subject is computer science.', vi: 'Môn học yêu thích của tôi là tin học.' },
    { text: 'I was nervous, but my presentation went well.', vi: 'Tôi đã lo lắng nhưng bài thuyết trình diễn ra tốt.' }
  ],
  B1: [
    { text: 'I believe that regular practice is the key to improving a language.', vi: 'Tôi tin rằng luyện tập thường xuyên là chìa khóa để cải thiện một ngôn ngữ.' },
    { text: 'Although the journey was tiring, we enjoyed every moment of it.', vi: 'Mặc dù chuyến đi mệt mỏi, chúng tôi vẫn tận hưởng từng khoảnh khắc.' },
    { text: 'Technology has changed the way people communicate with each other.', vi: 'Công nghệ đã thay đổi cách mọi người giao tiếp với nhau.' },
    { text: 'In my opinion, students should learn how to manage their time effectively.', vi: 'Theo tôi, học sinh nên học cách quản lý thời gian hiệu quả.' },
    { text: 'I felt more confident after I had practiced the speech several times.', vi: 'Tôi cảm thấy tự tin hơn sau khi luyện bài phát biểu nhiều lần.' },
    { text: 'Travelling allows people to experience different cultures and perspectives.', vi: 'Du lịch cho phép mọi người trải nghiệm các nền văn hóa và góc nhìn khác nhau.' }
  ],
  B2: [
    { text: 'One of the most effective ways to build confidence is to learn from mistakes.', vi: 'Một trong những cách hiệu quả nhất để xây dựng sự tự tin là học hỏi từ sai lầm.' },
    { text: 'Despite the challenges, the team managed to achieve its original objective.', vi: 'Bất chấp khó khăn, đội đã đạt được mục tiêu ban đầu.' },
    { text: 'Social media can be beneficial, provided that people use it responsibly.', vi: 'Mạng xã hội có thể có ích, miễn là mọi người sử dụng có trách nhiệm.' },
    { text: 'It is important to distinguish between reliable evidence and personal opinions.', vi: 'Điều quan trọng là phân biệt bằng chứng đáng tin cậy với ý kiến cá nhân.' },
    { text: 'Developing strong communication skills requires patience, consistency, and reflection.', vi: 'Phát triển kỹ năng giao tiếp tốt đòi hỏi sự kiên nhẫn, đều đặn và tự nhìn nhận.' },
    { text: 'Environmental problems cannot be solved without cooperation between communities.', vi: 'Các vấn đề môi trường không thể được giải quyết nếu thiếu sự hợp tác giữa các cộng đồng.' }
  ]
};

const normalize = (text: string) => text.toLowerCase().replace(/[^a-z0-9'\s]/g, ' ').replace(/\s+/g, ' ').trim();
function levenshtein(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diagonal = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const previous = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1));
      diagonal = previous;
    }
  }
  return row[b.length];
}
function scoreSpeech(target: string, spoken: string) {
  const targetWords = normalize(target).split(' ').filter(Boolean);
  const spokenWords = normalize(spoken).split(' ').filter(Boolean);
  if (!spokenWords.length) return { score: 0, correct: [] as string[], missed: targetWords };
  const used = new Set<number>();
  const correct: string[] = [];
  const missed: string[] = [];
  for (const word of targetWords) {
    let bestIndex = -1;
    let bestDistance = Infinity;
    spokenWords.forEach((heard, index) => {
      if (used.has(index)) return;
      const distance = levenshtein(word, heard);
      if (distance < bestDistance) { bestDistance = distance; bestIndex = index; }
    });
    const threshold = word.length <= 4 ? 0 : 1;
    if (bestIndex >= 0 && bestDistance <= threshold) {
      correct.push(word);
      used.add(bestIndex);
    } else missed.push(word);
  }
  const wordScore = Math.round(correct.length / Math.max(1, targetWords.length) * 100);
  const joinedTarget = normalize(target);
  const joinedSpoken = normalize(spoken);
  const charScore = Math.round(Math.max(0, 1 - levenshtein(joinedTarget, joinedSpoken) / Math.max(1, joinedTarget.length, joinedSpoken.length)) * 100);
  return { score: Math.round(wordScore * 0.7 + charScore * 0.3), correct, missed };
}

interface Props { stats: UserStats; onUpdateProfile?: (d: Partial<UserStats>) => void; }
export default function Pronunciation({ stats, onUpdateProfile }: Props) {
  const [level, setLevel] = useState<Level>('A1');
  const [index, setIndex] = useState(0);
  const [spoken, setSpoken] = useState('');
  const [status, setStatus] = useState<'idle' | 'listening' | 'error'>('idle');
  const [error, setError] = useState('');
  const [scoreResult, setScoreResult] = useState<ReturnType<typeof scoreSpeech> | null>(null);
  const [completed, setCompleted] = useState(0);
  const [earnedExp, setEarnedExp] = useState(0);
  const recognitionRef = useRef<any>(null);
  const sentence = SENTENCES[level][index % SENTENCES[level].length];

  useEffect(() => () => {
    try { recognitionRef.current?.stop(); } catch { /* no active recognition */ }
    stopTTS();
  }, []);

  const changeLevel = (next: Level) => {
    playClickSound();
    try { recognitionRef.current?.stop(); } catch { /* no active recognition */ }
    setLevel(next); setIndex(0); setSpoken(''); setScoreResult(null); setError(''); setStatus('idle');
  };

  const startRecognition = () => {
    playClickSound();
    setError(''); setSpoken(''); setScoreResult(null);
    const speechWindow = window as any;
    const Recognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!Recognition) {
      setError('Trình duyệt chưa hỗ trợ nhận dạng giọng nói. Hãy dùng Chrome hoặc Edge bản mới.');
      setStatus('error');
      return;
    }
    try {
      const recognition = new Recognition();
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.onstart = () => setStatus('listening');
      recognition.onerror = (event: any) => {
        setStatus('error');
        const messages: Record<string, string> = {
          'not-allowed': 'Bạn chưa cấp quyền micro cho trình duyệt.',
          'no-speech': 'Chưa nghe thấy tiếng nói. Hãy thử lại và nói gần micro hơn.',
          'audio-capture': 'Không tìm thấy micro hoặc micro đang bị ứng dụng khác sử dụng.',
          'network': 'Nhận dạng giọng nói cần kết nối mạng trên trình duyệt này.'
        };
        setError(messages[event.error] || `Không nhận dạng được giọng nói (${event.error || 'unknown'}).`);
      };
      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript?.trim() || '';
        setSpoken(transcript);
        if (!transcript) { setError('Chưa nhận được câu nói. Hãy thử lại.'); setStatus('error'); return; }
        const result = scoreSpeech(sentence.text, transcript);
        setScoreResult(result);
        setStatus('idle');
        setCompleted(prev => prev + 1);
        const reward = result.score >= 85 ? 10 : result.score >= 65 ? 6 : 3;
        setEarnedExp(prev => prev + reward);
        onUpdateProfile?.({ exp: (stats.exp || 0) + reward, gems: (stats.gems || 0) + (result.score >= 85 ? 1 : 0) });
        if (result.score >= 65) playCorrectSound();
      };
      recognition.onend = () => setStatus(current => current === 'listening' ? 'idle' : current);
      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      setStatus('error');
      setError(e instanceof Error ? e.message : 'Không thể khởi động micro.');
    }
  };

  const nextSentence = () => {
    playClickSound();
    try { recognitionRef.current?.stop(); } catch { /* no active recognition */ }
    setIndex(prev => (prev + 1) % SENTENCES[level].length);
    setSpoken(''); setScoreResult(null); setError(''); setStatus('idle');
  };
  const retry = () => { playClickSound(); startRecognition(); };

  return (
    <div className="min-h-full bg-[#fffdfa] p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#58cc02]">ENG AI · SPEAKING LAB</p>
            <h1 className="text-2xl sm:text-3xl font-black text-[#3c3c3c] mt-1">Luyện phát âm cùng Alex</h1>
            <p className="text-sm text-[#777] mt-2 max-w-2xl">Nghe câu mẫu, nói lại bằng tiếng Anh, nhận điểm tương đồng và xem những từ cần luyện thêm.</p>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border-2 border-[#e5e5e5] bg-white px-4 py-3">
            <Award className="text-[#ff9600]" />
            <div><p className="text-[10px] uppercase font-black text-[#999]">Câu đã luyện</p><p className="text-xl font-black text-[#3c3c3c]">{completed}</p></div>
            <div className="w-px h-8 bg-[#eee] mx-2" />
            <div><p className="text-[10px] uppercase font-black text-[#999]">EXP phiên này</p><p className="text-xl font-black text-[#58cc02]">{earnedExp}</p></div>
          </div>
        </header>

        <section className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(['A1', 'A2', 'B1', 'B2'] as Level[]).map(item => (
            <button key={item} onClick={() => changeLevel(item)} className={`rounded-2xl border-2 p-3 text-left transition-all ${level === item ? 'border-[#58cc02] bg-[#f0fff0]' : 'border-[#e5e5e5] bg-white hover:border-[#b7e99b]'}`}>
              <span className="block text-lg font-black text-[#3c3c3c]">{item}</span>
              <span className="text-[11px] font-semibold text-[#777]">{item === 'A1' ? 'Cơ bản' : item === 'A2' ? 'Sơ cấp' : item === 'B1' ? 'Trung cấp' : 'Khá nâng cao'}</span>
            </button>
          ))}
        </section>

        <section className="bg-white border-2 border-[#e5e5e5] rounded-3xl p-5 sm:p-8 shadow-sm space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs font-black uppercase tracking-wider text-[#999]">Câu {index + 1} · Trình độ {level}</div>
            <button onClick={() => { playClickSound(); setSpoken(''); setScoreResult(null); setError(''); playTTS(sentence.text, { lang: 'en-US' }); }} className="inline-flex items-center gap-2 rounded-xl bg-[#e7f8db] text-[#347d10] px-4 py-2 font-black text-sm hover:bg-[#d8f3c5]">
              <Volume2 size={18} /> Nghe mẫu
            </button>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#3c3c3c] leading-relaxed">{sentence.text}</h2>
          <p className="text-sm text-[#777]">{sentence.vi}</p>
          <div className="flex flex-wrap gap-2">
            {normalize(sentence.text).split(' ').map((word, wordIndex) => {
              const correct = scoreResult?.correct.includes(word);
              const missed = scoreResult?.missed.includes(word);
              return <span key={`${word}-${wordIndex}`} className={`px-2.5 py-1 rounded-lg text-sm font-bold ${correct ? 'bg-[#e7f8db] text-[#347d10]' : missed ? 'bg-[#fff0f0] text-[#d92d20]' : 'bg-[#f4f4f5] text-[#555]'}`}>{word}</span>;
            })}
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={startRecognition} disabled={status === 'listening'} className={`flex-1 inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-4 font-black text-white ${status === 'listening' ? 'bg-[#8fcf63] cursor-wait' : 'bg-[#58cc02] hover:bg-[#46a302]'}`}>
              {status === 'listening' ? <><MicOff size={20} /> Đang nghe bạn nói...</> : <><Mic size={20} /> Bắt đầu đọc câu</>}
            </button>
            <button onClick={retry} className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-[#e5e5e5] px-5 py-4 font-black text-[#555] hover:bg-[#f7f7f7]"><RotateCcw size={18} /> Thử lại</button>
            <button onClick={nextSentence} className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-[#e5e5e5] px-5 py-4 font-black text-[#555] hover:bg-[#f7f7f7]"><ArrowRight size={18} /> Câu tiếp</button>
          </div>
          {error && <p role="alert" className="rounded-xl bg-[#fff0f0] border border-[#ffcccc] text-[#a61b1b] p-3 text-sm font-semibold">{error}</p>}
          {spoken && <div className="rounded-2xl bg-[#f7f9fc] border border-[#e5e7eb] p-4 space-y-2">
            <p className="text-xs uppercase tracking-wider font-black text-[#777]">Alex nghe được</p>
            <p className="text-base font-bold text-[#333]">“{spoken}”</p>
            {scoreResult && <>
              <div className="flex items-end gap-2"><span className="text-4xl font-black text-[#58cc02]">{scoreResult.score}</span><span className="text-sm font-bold text-[#777] mb-1">/ 100 điểm tương đồng</span></div>
              <p className="text-sm text-[#555]">{scoreResult.score >= 90 ? 'Xuất sắc! Câu bạn nói rất gần với câu mẫu.' : scoreResult.score >= 70 ? 'Khá tốt! Hãy luyện lại những từ được tô đỏ.' : 'Cứ bình tĩnh luyện lại. Nghe mẫu một lần rồi nói chậm và rõ từng cụm từ nhé.'}</p>
            </>}
          </div>}
          <p className="text-xs text-[#999] flex items-start gap-2"><BookOpen size={15} className="shrink-0 mt-0.5" /> Điểm là độ tương đồng giữa câu mẫu và bản chép lời nhận dạng giọng nói; đây không phải phép đo âm vị học chuyên nghiệp.</p>
        </section>
      </div>
    </div>
  );
}
