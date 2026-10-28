import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, CheckCircle2, Languages, Mic, MicOff, RotateCw, Shuffle, Volume2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import sentenceBank from '../data/pronunciationSentences.json';
import { isAccessibilityMode, playTTS, stopTTS } from '../services/ttsService';
import { transcribeAudioWithGemini } from '../services/geminiService';

type Sentence = { id: number; level: string; topic: string; cau_mau: string; meaning: string };
const BANK = sentenceBank as Sentence[];
const LEVELS = ['Tất cả', 'A1', 'A2', 'B1', 'B2'];

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-zA-Z'\s]/g, '').replace(/\s+/g, ' ').trim();
}

type PronunciationAnalysis = {
  score: number;
  correctWords: string[];
  wrongWords: string[];
  tip: string;
};

function analyzeWords(targetText: string, spokenText: string): PronunciationAnalysis {
  const target = normalize(targetText).split(' ').filter(Boolean);
  const spoken = normalize(spokenText).split(' ').filter(Boolean);

  // Longest-common-subsequence aligns words in the same order, like a simple
  // SequenceMatcher comparison, instead of counting a word correct anywhere.
  const dp: number[][] = Array.from({ length: target.length + 1 }, () =>
    Array(spoken.length + 1).fill(0)
  );
  for (let i = target.length - 1; i >= 0; i--) {
    for (let j = spoken.length - 1; j >= 0; j--) {
      dp[i][j] = target[i] === spoken[j]
        ? 1 + dp[i + 1][j + 1]
        : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const correctWords: string[] = [];
  const wrongWords: string[] = [];
  let i = 0;
  let j = 0;
  while (i < target.length && j < spoken.length) {
    if (target[i] === spoken[j]) {
      correctWords.push(target[i]);
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      wrongWords.push(target[i]);
      i++;
    } else {
      j++;
    }
  }
  while (i < target.length) wrongWords.push(target[i++]);

  const denominator = target.length + spoken.length;
  const score = denominator
    ? Math.round((2 * correctWords.length / denominator) * 100)
    : 0;
  let tip = '';
  if (score >= 90) tip = 'Phát âm rất tốt! Hãy tiếp tục chú ý âm cuối và ngữ điệu.';
  else if (score >= 75) tip = 'Khá tốt. Hãy nghe lại câu mẫu và chú ý những từ chưa khớp.';
  else if (score >= 60) tip = 'Bạn hãy nói chậm hơn, phát âm từng từ rõ ràng rồi nối thành câu.';
  else tip = 'Hãy nghe câu mẫu một lần nữa, sau đó đọc chậm và rõ từng từ.';

  return { score, correctWords, wrongWords, tip };
}

export default function PronunciationPractice() {
  const [level, setLevel] = useState('A1');
  const [deck, setDeck] = useState<Sentence[]>([]);
  const [index, setIndex] = useState(0);
  const [showMeaning, setShowMeaning] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState('');
  const [analysis, setAnalysis] = useState<PronunciationAnalysis | null>(null);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [completed, setCompleted] = useState<number[]>([]);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const audioProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const pcmChunksRef = useRef<Float32Array[]>([]);
  const sampleRateRef = useRef(48000);
  const recordingStartedAtRef = useRef(0);
  const autoFinishStartedRef = useRef(false);
  const MAX_RECORDING_MS = 10000;

  const makeDeck = useCallback((nextLevel: string) => {
    const filtered = BANK.filter(item => nextLevel === 'Tất cả' || item.level === nextLevel);
    setDeck(shuffle(filtered));
    setIndex(0);
    setShowMeaning(false);
    setTranscript('');
    setFeedback('');
    setAnalysis(null);
    setCompleted([]);
  }, []);

  useEffect(() => { makeDeck(level); }, [level, makeDeck]);
  useEffect(() => () => {
    if (audioProcessorRef.current) {
      audioProcessorRef.current.onaudioprocess = null;
      try { audioProcessorRef.current.disconnect(); } catch {}
    }
    try { audioSourceRef.current?.disconnect(); } catch {}
    mediaStreamRef.current?.getTracks().forEach(track => track.stop());
    const context = audioContextRef.current;
    if (context && context.state !== 'closed') void context.close().catch(() => undefined);
    if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
  }, []);

  const current = deck[index];
  const progress = deck.length ? Math.round((completed.length / deck.length) * 100) : 0;

  const speak = () => {
    if (!current || !('speechSynthesis' in window)) {
      setFeedback('Trình duyệt này chưa hỗ trợ đọc văn bản. Hãy dùng Chrome hoặc Edge phiên bản mới.');
      return;
    }
    // Dùng chung bộ TTS của ứng dụng để chọn giọng tiếng Anh phù hợp,
    // dọn nội dung trước khi đọc và tránh nhiều lượt đọc chồng lên nhau.
    stopTTS();
    playTTS(current.cau_mau, { lang: 'en-US', rate: 0.92, pitch: 1, volume: 1 });
  };

  // Convert microphone PCM samples into a small mono 16 kHz WAV for Gemini.
  const createWavFromPcm = (chunks: Float32Array[], sourceRate: number): Blob => {
    const inputLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    if (!inputLength || sourceRate <= 0) throw new Error('Không thu được âm thanh. Hãy thử ghi âm lại.');
    const input = new Float32Array(inputLength);
    let offset = 0;
    for (const chunk of chunks) { input.set(chunk, offset); offset += chunk.length; }
    const targetRate = 16000;
    const outputLength = Math.max(1, Math.floor(input.length * targetRate / sourceRate));
    const dataBytes = outputLength * 2;
    const buffer = new ArrayBuffer(44 + dataBytes);
    const view = new DataView(buffer);
    const writeAscii = (at: number, value: string) => { for (let i = 0; i < value.length; i++) view.setUint8(at + i, value.charCodeAt(i)); };
    writeAscii(0, 'RIFF'); view.setUint32(4, 36 + dataBytes, true); writeAscii(8, 'WAVE');
    writeAscii(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true);
    view.setUint16(22, 1, true); view.setUint32(24, targetRate, true); view.setUint32(28, targetRate * 2, true);
    view.setUint16(32, 2, true); view.setUint16(34, 16, true); writeAscii(36, 'data'); view.setUint32(40, dataBytes, true);
    for (let i = 0; i < outputLength; i++) {
      const pos = i * sourceRate / targetRate;
      const left = Math.min(Math.floor(pos), input.length - 1);
      const right = Math.min(left + 1, input.length - 1);
      const fraction = pos - left;
      const sample = Math.max(-1, Math.min(1, input[left] * (1 - fraction) + input[right] * fraction));
      view.setInt16(44 + i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    }
    return new Blob([buffer], { type: 'audio/wav' });
  };

  const stopCapture = async () => {
    const chunks = pcmChunksRef.current.slice();
    const sampleRate = sampleRateRef.current;
    pcmChunksRef.current = [];
    if (audioProcessorRef.current) {
      audioProcessorRef.current.onaudioprocess = null;
      try { audioProcessorRef.current.disconnect(); } catch {}
    }
    try { audioSourceRef.current?.disconnect(); } catch {}
    mediaStreamRef.current?.getTracks().forEach(track => track.stop());
    const context = audioContextRef.current;
    audioProcessorRef.current = null; audioSourceRef.current = null; mediaStreamRef.current = null; audioContextRef.current = null;
    if (context && context.state !== 'closed') { try { await context.close(); } catch {} }
    return { chunks, sampleRate };
  };

  const finishRecording = async () => {
    setRecording(false);
    setTranscribing(true);
    setFeedback('Đang chuyển giọng nói thành văn bản...');
    try {
      const { chunks, sampleRate } = await stopCapture();
      const wav = createWavFromPcm(chunks, sampleRate);
      if (wav.size < 1000) throw new Error('Bản ghi quá ngắn hoặc chưa thu được tiếng nói. Hãy đọc câu trong 1–5 giây rồi thử lại.');
      const text = (await transcribeAudioWithGemini(wav)).trim();
      if (!text) throw new Error('AI chưa nghe rõ câu nói. Hãy nói gần micro hơn rồi thử lại.');
      setTranscript(text);
      const result = analyzeWords(current?.cau_mau || '', text);
      setAnalysis(result);
      const spokenFeedback = [
        `Kết quả luyện phát âm. Độ khớp khoảng ${result.score} phần trăm.`,
        `Câu mẫu: ${current?.cau_mau || ''}.`,
        `Hệ thống nghe được: ${text}.`,
        `Các từ khớp: ${result.correctWords.length ? result.correctWords.join(', ') : 'chưa có từ nào khớp rõ ràng'}.`,
        `Các từ cần luyện lại: ${result.wrongWords.length ? result.wrongWords.join(', ') : 'không có từ nào bị thiếu hoặc lệch theo thứ tự'}.`,
        result.tip,
        `Nghĩa tiếng Việt: ${current?.meaning || 'chưa có nghĩa tiếng Việt'}.`
      ].join(' ');
      setFeedback(spokenFeedback);
      // In accessibility mode, announce the full feedback so blind learners
      // hear the score, word-level comparison, tip, and Vietnamese meaning.
      if (isAccessibilityMode()) {
        window.setTimeout(() => playTTS(spokenFeedback, { rate: 0.92 }), 250);
      }
      if (current) setCompleted(prev => prev.includes(current.id) ? prev : [...prev, current.id]);
    } catch (error: unknown) {
      console.error('Pronunciation transcription failed:', error);
      setFeedback(error instanceof Error ? error.message : 'Không nhận diện được giọng nói. Hãy thử lại.');
    } finally {
      setTranscribing(false);
    }
  };

  const startRecording = async () => {
    if (recording) { await finishRecording(); return; }
    if (transcribing) return;
    if (!navigator.mediaDevices?.getUserMedia || typeof window.AudioContext === 'undefined') {
      setFeedback('Trình duyệt chưa hỗ trợ thu âm. Hãy dùng Chrome/Edge mới và mở ứng dụng bằng localhost hoặc HTTPS.');
      return;
    }
    if (!window.isSecureContext) {
      setFeedback('Micro cần trang bảo mật. Hãy mở ứng dụng bằng http://localhost hoặc HTTPS, không dùng địa chỉ IP HTTP thông thường.');
      return;
    }
    setTranscript(''); setFeedback(''); setAnalysis(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      mediaStreamRef.current = stream;
      const context = new window.AudioContext();
      audioContextRef.current = context;
      await context.resume();
      const source = context.createMediaStreamSource(stream);
      audioSourceRef.current = source;
      const processor = context.createScriptProcessor(4096, 1, 1);
      audioProcessorRef.current = processor;
      pcmChunksRef.current = [];
      sampleRateRef.current = context.sampleRate;
      processor.onaudioprocess = (event: AudioProcessingEvent) => {
        // Keep practice clips short: long silence/audio increases upload and transcription latency.
        if (Date.now() - recordingStartedAtRef.current >= MAX_RECORDING_MS) {
          if (!autoFinishStartedRef.current) {
            autoFinishStartedRef.current = true;
            void finishRecording();
          }
          return;
        }
        const channel = event.inputBuffer.getChannelData(0);
        pcmChunksRef.current.push(new Float32Array(channel));
        for (let i = 0; i < event.outputBuffer.numberOfChannels; i++) event.outputBuffer.getChannelData(i).fill(0);
      };
      source.connect(processor); processor.connect(context.destination);
      recordingStartedAtRef.current = Date.now();
      autoFinishStartedRef.current = false;
      setRecording(true);
      setFeedback('Đang nghe bạn đọc (tối đa 10 giây). Đọc xong hãy nhấn nút lần nữa để chấm câu.');
    } catch (error: unknown) {
      console.error('Could not start pronunciation microphone:', error);
      const name = error && typeof error === 'object' && 'name' in error ? String((error as { name?: unknown }).name) : '';
      if (name === 'NotAllowedError' || name === 'SecurityError') setFeedback('Micro bị chặn. Cho phép Micro trong cài đặt trang web rồi tải lại.');
      else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') setFeedback('Không tìm thấy micro. Kiểm tra micro trong Windows.');
      else if (name === 'NotReadableError' || name === 'TrackStartError') setFeedback('Micro đang được ứng dụng khác sử dụng hoặc không thể mở.');
      else setFeedback(error instanceof Error ? error.message : 'Không mở được micro.');
      try { await stopCapture(); } catch {}
      setRecording(false);
    }
  };

  const nextSentence = () => {
    if (!deck.length) return;
    if (index >= deck.length - 1) {
      makeDeck(level);
      return;
    }
    setIndex(index + 1);
    setShowMeaning(false);
    setTranscript('');
    setFeedback('');
    setAnalysis(null);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-5 sm:px-6 sm:py-8">
      <div className="mb-6 flex items-center gap-3">
        <Link to="/" className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-gray-100 bg-white text-gray-600 hover:bg-gray-50" aria-label="Quay lại">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-purple-500">Speaking lab</p>
          <h1 className="text-2xl font-black text-gray-800 sm:text-3xl">Luyện phát âm</h1>
          <p className="mt-1 text-sm font-medium text-gray-500">Nghe mẫu, đọc thành tiếng và luyện câu không theo thứ tự cố định.</p>
        </div>
      </div>

      <div className="mb-5 rounded-2xl border-2 border-purple-100 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <label htmlFor="level-select" className="text-sm font-black text-gray-700">Trình độ luyện tập</label>
          <span className="text-xs font-bold text-gray-400">{deck.length ? `${Math.min(index + 1, deck.length)} / ${deck.length} câu` : 'Đang tải'}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {LEVELS.map(item => (
            <button key={item} onClick={() => setLevel(item)} className={`rounded-xl border-2 px-4 py-2 text-sm font-black transition ${level === item ? 'border-purple-500 bg-purple-500 text-white shadow-sm' : 'border-gray-100 bg-gray-50 text-gray-600 hover:border-purple-200'}`}>
              {item}
            </button>
          ))}
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100">
          <div className="h-full rounded-full bg-purple-500 transition-all" style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs font-bold text-gray-400">
          <span>Đã luyện {completed.length} câu trong lượt này</span>
          <button onClick={() => makeDeck(level)} className="inline-flex items-center gap-1.5 text-purple-600 hover:text-purple-700"><Shuffle size={14} /> Xáo trộn lại</button>
        </div>
      </div>

      {current && (
        <section className="overflow-hidden rounded-3xl border-2 border-gray-100 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-gray-100 bg-gray-50 px-4 py-3 sm:px-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-lg bg-purple-100 px-2.5 py-1 text-xs font-black text-purple-700">{current.level}</span>
              <span className="text-xs font-bold text-gray-500">{current.topic}</span>
            </div>
            <span className="text-xs font-bold text-gray-400">Câu #{current.id}</span>
          </div>
          <div className="px-5 py-8 text-center sm:px-10 sm:py-12">
            <p className="mb-3 text-xs font-black uppercase tracking-widest text-gray-400">Hãy đọc câu tiếng Anh này</p>
            <h2 className="mx-auto max-w-2xl text-2xl font-black leading-relaxed text-gray-800 sm:text-3xl">{current.cau_mau}</h2>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <button onClick={speak} className="inline-flex items-center gap-2 rounded-xl border-2 border-blue-100 bg-blue-50 px-4 py-2.5 text-sm font-black text-blue-700 hover:bg-blue-100"><Volume2 size={18} /> Nghe phát âm mẫu</button>
              <button onClick={() => setShowMeaning(v => !v)} className="inline-flex items-center gap-2 rounded-xl border-2 border-gray-100 bg-gray-50 px-4 py-2.5 text-sm font-black text-gray-600 hover:bg-gray-100"><Languages size={18} /> {showMeaning ? 'Ẩn nghĩa' : 'Xem nghĩa tiếng Việt'}</button>
            </div>
            {showMeaning && <p className="mx-auto mt-4 max-w-xl rounded-xl bg-amber-50 px-4 py-3 font-bold text-amber-800">{current.meaning}</p>}
          </div>

          <div className="border-t border-gray-100 bg-purple-50/50 p-4 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row">
              <button onClick={recording ? finishRecording : startRecording} disabled={transcribing} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-3.5 font-black text-white shadow-md hover:bg-purple-700 disabled:cursor-wait disabled:opacity-70">
                {recording ? <><MicOff size={18} /> Dừng ghi âm và chấm câu</> : transcribing ? <><MicOff size={18} /> Đang nhận diện...</> : <><Mic size={18} /> Bấm để đọc câu</>}
              </button>
              <button onClick={nextSentence} className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-gray-200 bg-white px-5 py-3.5 font-black text-gray-700 hover:bg-gray-50">
                {index >= deck.length - 1 ? <RotateCw size={18} /> : <Shuffle size={18} />} {index >= deck.length - 1 ? 'Lượt mới' : 'Câu tiếp theo'}
              </button>
            </div>
            {transcript && <div className="mt-3 rounded-xl border border-blue-100 bg-white p-3 text-sm" aria-live="polite"><span className="font-black text-blue-700">Hệ thống nghe được: </span><span className="font-medium text-gray-700">{transcript}</span></div>}
            {analysis && (
              <div className="mt-3 space-y-3 rounded-xl border border-purple-100 bg-white p-4 text-sm" aria-live="polite">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-black text-gray-800">Phân tích kết quả phát âm</h3>
                  <span className="rounded-lg bg-purple-100 px-3 py-1 font-black text-purple-800">Độ khớp: {analysis.score}%</span>
                </div>
                <div>
                  <p className="font-black text-green-700">Từ đọc khớp:</p>
                  <p className="mt-1 text-gray-700">{analysis.correctWords.length ? analysis.correctWords.join(', ') : 'Chưa có từ nào khớp rõ ràng.'}</p>
                </div>
                <div>
                  <p className="font-black text-red-700">Từ cần luyện lại:</p>
                  <p className="mt-1 text-gray-700">{analysis.wrongWords.length ? analysis.wrongWords.join(', ') : 'Không có từ nào bị thiếu hoặc lệch theo thứ tự.'}</p>
                </div>
                <div>
                  <p className="font-black text-amber-700">Gợi ý:</p>
                  <p className="mt-1 text-gray-700">{analysis.tip}</p>
                </div>
                <div>
                  <p className="font-black text-blue-700">Nghĩa tiếng Việt:</p>
                  <p className="mt-1 text-gray-700">{current.meaning}</p>
                </div>
                <button
                  onClick={() => playTTS(`Kết quả luyện phát âm. Độ khớp khoảng ${analysis.score} phần trăm. Các từ khớp: ${analysis.correctWords.length ? analysis.correctWords.join(', ') : 'chưa có từ nào khớp rõ ràng'}. Các từ cần luyện lại: ${analysis.wrongWords.length ? analysis.wrongWords.join(', ') : 'không có từ nào bị thiếu hoặc lệch theo thứ tự'}. ${analysis.tip} Nghĩa tiếng Việt: ${current.meaning}`, { rate: 0.92 })}
                  className="inline-flex items-center gap-2 rounded-xl border-2 border-blue-100 bg-blue-50 px-4 py-2.5 font-black text-blue-700 hover:bg-blue-100"
                  aria-label="Nghe đọc kết quả phân tích phát âm"
                >
                  <Volume2 size={18} /> Nghe đọc kết quả
                </button>
                <p className="text-xs font-medium text-gray-400">Điểm này ước lượng độ khớp giữa bản ghi được nhận diện và câu mẫu; không phải phép đo âm vị chuyên sâu.</p>
              </div>
            )}
            {feedback && !analysis && <div className="mt-3 flex gap-2 rounded-xl border border-purple-100 bg-white p-3 text-sm font-bold leading-relaxed text-gray-700"><CheckCircle2 className="mt-0.5 shrink-0 text-purple-600" size={18} /><span>{feedback}</span></div>}
          </div>
        </section>
      )}
      <p className="mt-4 text-center text-xs font-medium leading-relaxed text-gray-400">Mẹo: dùng tai nghe nếu có, nghe mẫu một lần rồi tự đọc. Mỗi lượt sẽ xáo trộn câu và chỉ đi hết danh sách trước khi tạo lượt mới.</p>
    </div>
  );
}
