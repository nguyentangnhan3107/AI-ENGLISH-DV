import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  User, 
  Sparkles, 
  RefreshCw, 
  Volume2, 
  Award, 
  Lightbulb, 
  MessageSquare,
  Mic,
  MicOff,
  Flame,
  Gem,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  VolumeX,
  Languages,
  Check,
  Zap,
  ArrowRight,
  ThumbsUp,
  Smile,
  PlusCircle,
  X,
  MoreVertical,
  ChevronRight,
  Sliders,
  CornerDownRight,
  LogOut
} from 'lucide-react';
import { UserStats, VocabularyWord } from '../types';
import { playTTS, stopTTS, chatWithAlexAI, transcribeAudioWithGemini, AlexChatResponse } from '../services/geminiService';
import { playCorrectSound, playClickSound, playChestSound } from '../services/soundEffects';

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  timestamp: string;
  
  // AI evaluation & response fields
  replyVi?: string;
  score?: number;
  feedbackVi?: string;
  betterSentence?: string;
  vocabularyWords?: { word: string; phonetic?: string; meaning: string; example?: string }[];
  suggestedReplies?: string[];
  
  // Points awarded on this turn
  expEarned?: number;
  gemsEarned?: number;
}

const CONVERSATION_TOPICS = [
  { id: 'daily', name: 'Cuộc sống & Sở thích', icon: '☕', prompt: "Hi there! I'm Alex. How was your day today, or what are your favorite hobbies on weekends?" },
  { id: 'food', name: 'Ẩm thực & Nhà hàng', icon: '🍕', prompt: "Hello foodie! What is your all-time favorite dish, and what makes it special to you?" },
  { id: 'travel', name: 'Du lịch & Kỳ nghỉ', icon: '✈️', prompt: "Greetings traveler! If you could book a flight right now to any place in the world, where would you go?" },
  { id: 'job', name: 'Công việc & Phỏng vấn', icon: '💼', prompt: "Welcome! Let's practice professional English. Could you introduce yourself and your career goals?" },
  { id: 'ielts', name: 'Luyện thi IELTS Speaking', icon: '🎓', prompt: "Hello! Let's simulate an IELTS Speaking test. Do you prefer living in a bustling big city or peaceful countryside?" },
  { id: 'free', name: 'Trò chuyện tự do', icon: '💬', prompt: "Hey friend! I'm here to chat about anything on your mind. What would you like to discuss today?" },
];

const ALEX_AVATAR_URL = "https://lh3.googleusercontent.com/d/1hLheBbw2SsqKXHl1BxI0rzpmNrw_cAYD";


/** Build a standard mono 16-bit PCM WAV directly from raw microphone samples.
 * This avoids depending on whether the browser can decode its MediaRecorder WebM output.
 */
const createWavFromPcmChunks = (chunks: Float32Array[], sourceSampleRate: number): Blob => {
  const inputLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  if (!inputLength || !Number.isFinite(sourceSampleRate) || sourceSampleRate <= 0) {
    throw new Error('Không thu được mẫu âm thanh từ micro. Hãy thử ghi âm lại.');
  }

  const input = new Float32Array(inputLength);
  let inputOffset = 0;
  for (const chunk of chunks) {
    input.set(chunk, inputOffset);
    inputOffset += chunk.length;
  }

  const targetSampleRate = 16000;
  const outputLength = Math.max(1, Math.floor(input.length * targetSampleRate / sourceSampleRate));
  const dataBytes = outputLength * 2;
  const wavBuffer = new ArrayBuffer(44 + dataBytes);
  const view = new DataView(wavBuffer);
  const writeAscii = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i++) view.setUint8(offset + i, value.charCodeAt(i));
  };

  writeAscii(0, 'RIFF');
  view.setUint32(4, 36 + dataBytes, true);
  writeAscii(8, 'WAVE');
  writeAscii(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // Linear PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, targetSampleRate, true);
  view.setUint32(28, targetSampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeAscii(36, 'data');
  view.setUint32(40, dataBytes, true);

  const ratio = sourceSampleRate / targetSampleRate;
  let outputOffset = 44;
  for (let i = 0; i < outputLength; i++) {
    const sourcePosition = i * ratio;
    const leftIndex = Math.min(Math.floor(sourcePosition), input.length - 1);
    const rightIndex = Math.min(leftIndex + 1, input.length - 1);
    const fraction = sourcePosition - leftIndex;
    const value = input[leftIndex] * (1 - fraction) + input[rightIndex] * fraction;
    const clipped = Math.max(-1, Math.min(1, value));
    view.setInt16(outputOffset, clipped < 0 ? clipped * 0x8000 : clipped * 0x7fff, true);
    outputOffset += 2;
  }

  return new Blob([wavBuffer], { type: 'audio/wav' });
};

interface PracticeProps {
  stats: UserStats;
  onUpdateProfile?: (d: Partial<UserStats>) => void;
  onComplete?: (exp: number) => void;
}

export default function Practice({ stats, onUpdateProfile, onComplete }: PracticeProps) {
  const [currentTopic, setCurrentTopic] = useState(CONVERSATION_TOPICS[0]);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-init',
      role: 'ai',
      text: CONVERSATION_TOPICS[0].prompt,
      replyVi: "Chào bạn! Mình là Alex. Hãy chia sẻ xem hôm nay của bạn thế nào, hoặc bạn thích làm gì vào cuối tuần?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedReplies: [
        "Today was quite productive and relaxing!",
        "I love playing badminton and listening to music.",
        "I spent most of my day studying English."
      ]
    }
  ]);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  
  // UI State toggles
  const [showViMap, setShowViMap] = useState<Record<string, boolean>>({});
  const [showFeedbackMap, setShowFeedbackMap] = useState<Record<string, boolean>>({});
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [savedWords, setSavedWords] = useState<string[]>([]);
  const [audioAutoPlay, setAudioAutoPlay] = useState(() => Boolean(stats.accessibilityMode));
  const [isAlexSpeaking, setIsAlexSpeaking] = useState(false);

  // Floating point reward toast
  const [rewardToast, setRewardToast] = useState<{ exp: number; gems: number; text?: string } | null>(null);

  // Session stats
  const [sessionExp, setSessionExp] = useState(0);
  const [sessionGems, setSessionGems] = useState(0);
  const [messageCount, setMessageCount] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const audioProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const pcmChunksRef = useRef<Float32Array[]>([]);
  const micInputSampleRateRef = useRef(48000);
  const micStartPendingRef = useRef(false);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Stop and release all audio resources when leaving the conversation page.
  useEffect(() => {
    return () => {
      if (audioProcessorRef.current) {
        audioProcessorRef.current.onaudioprocess = null;
        try { audioProcessorRef.current.disconnect(); } catch { /* Already disconnected. */ }
      }
      try { audioSourceRef.current?.disconnect(); } catch { /* Already disconnected. */ }
      mediaStreamRef.current?.getTracks().forEach(track => track.stop());
      const context = audioContextRef.current;
      if (context && context.state !== 'closed') void context.close().catch(() => undefined);
      audioProcessorRef.current = null;
      audioSourceRef.current = null;
      mediaStreamRef.current = null;
      audioContextRef.current = null;
      pcmChunksRef.current = [];
      stopTTS();
    };
  }, []);

  const stopMicrophoneCapture = async (keepAudio: boolean) => {
    const chunks = keepAudio ? pcmChunksRef.current.slice() : [];
    const sampleRate = micInputSampleRateRef.current;
    pcmChunksRef.current = [];

    if (audioProcessorRef.current) {
      audioProcessorRef.current.onaudioprocess = null;
      try { audioProcessorRef.current.disconnect(); } catch { /* Already disconnected. */ }
    }
    try { audioSourceRef.current?.disconnect(); } catch { /* Already disconnected. */ }
    mediaStreamRef.current?.getTracks().forEach(track => track.stop());

    const context = audioContextRef.current;
    audioProcessorRef.current = null;
    audioSourceRef.current = null;
    mediaStreamRef.current = null;
    audioContextRef.current = null;
    if (context && context.state !== 'closed') {
      try { await context.close(); } catch { /* Context can already be closed. */ }
    }

    return { chunks, sampleRate };
  };

  const finishRecordingAndTranscribe = async () => {
    setIsListening(false);
    let wavBlob: Blob;
    try {
      const { chunks, sampleRate } = await stopMicrophoneCapture(true);
      wavBlob = createWavFromPcmChunks(chunks, sampleRate);
    } catch (error: unknown) {
      console.error('Could not create WAV from microphone samples:', error);
      setMicError(error instanceof Error ? error.message : 'Không xử lý được bản ghi âm. Hãy thử ghi âm lại.');
      return;
    }

    if (wavBlob.size < 1000) {
      setMicError('Bản ghi quá ngắn hoặc chưa thu được tiếng nói. Nhấn micro, nói một câu rồi nhấn lại để hoàn tất.');
      return;
    }

    setIsTranscribing(true);
    try {
      const transcript = await transcribeAudioWithGemini(wavBlob);
      if (!transcript.trim()) {
        setMicError('Gemini chưa nghe rõ câu nói. Bạn thử nói gần micro hơn rồi ghi âm lại nhé.');
        return;
      }
      setInput(transcript.trim());
    } catch (error: unknown) {
      console.error('Gemini audio transcription error:', error);
      const message = error instanceof Error ? error.message : '';
      setMicError(message || 'Gemini chưa chuyển được âm thanh thành chữ. Hãy kiểm tra API key và kết nối Internet.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const toggleListening = async () => {
    playClickSound();
    setMicError(null);

    if (isTranscribing || micStartPendingRef.current) return;

    if (isListening) {
      await finishRecordingAndTranscribe();
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia || typeof window.AudioContext === 'undefined') {
      setMicError('Trình duyệt này chưa hỗ trợ ghi âm. Hãy dùng Google Chrome hoặc Microsoft Edge phiên bản mới.');
      return;
    }

    const host = window.location.hostname;
    if (!window.isSecureContext && host !== 'localhost' && host !== '127.0.0.1') {
      setMicError('Micro cần trang HTTPS hoặc localhost. Hãy mở app qua https:// hoặc http://localhost.');
      return;
    }

    micStartPendingRef.current = true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });
      mediaStreamRef.current = stream;
      const context = new window.AudioContext();
      audioContextRef.current = context;
      await context.resume();
      const source = context.createMediaStreamSource(stream);
      audioSourceRef.current = source;
      // Capture raw PCM via Web Audio instead of recording a browser-specific WebM/MP4 file.
      const processor = context.createScriptProcessor(4096, 1, 1);
      audioProcessorRef.current = processor;
      pcmChunksRef.current = [];
      micInputSampleRateRef.current = context.sampleRate;

      processor.onaudioprocess = (event: AudioProcessingEvent) => {
        const inputBuffer = event.inputBuffer;
        const samples = new Float32Array(inputBuffer.length);
        const channelCount = Math.max(1, inputBuffer.numberOfChannels);
        for (let channel = 0; channel < channelCount; channel++) {
          const channelData = inputBuffer.getChannelData(channel);
          for (let i = 0; i < inputBuffer.length; i++) {
            samples[i] += channelData[i] / channelCount;
          }
        }
        pcmChunksRef.current.push(samples);
        // Keep the capture node silent; we only need its processing callback.
        for (let channel = 0; channel < event.outputBuffer.numberOfChannels; channel++) {
          event.outputBuffer.getChannelData(channel).fill(0);
        }
      };

      source.connect(processor);
      processor.connect(context.destination);
      setIsListening(true);
    } catch (error: unknown) {
      console.error('Could not start microphone recording:', error);
      const name = error && typeof error === 'object' && 'name' in error ? String((error as { name?: unknown }).name) : '';
      if (name === 'NotAllowedError' || name === 'SecurityError') {
        setMicError('Chrome chưa được cấp quyền micro. Bấm biểu tượng cạnh địa chỉ trang web → Microphone → Allow, rồi tải lại trang.');
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        setMicError('Không tìm thấy micro. Hãy kiểm tra micro được kết nối và được bật trong Windows.');
      } else if (name === 'NotReadableError' || name === 'TrackStartError') {
        setMicError('Micro đang được ứng dụng khác sử dụng hoặc không thể mở. Hãy đóng ứng dụng đó rồi thử lại.');
      } else {
        setMicError('Không mở được micro. Hãy kiểm tra quyền truy cập micro của Chrome và thử lại.');
      }
      await stopMicrophoneCapture(false);
      setIsListening(false);
    } finally {
      micStartPendingRef.current = false;
    }
  };

  // Helper to pronounce using TTS
  const speakAlex = (text: string) => {
    playTTS(text, {
      onStart: () => setIsAlexSpeaking(true),
      onEnd: () => setIsAlexSpeaking(false)
    });
  };

  const handleTopicSelect = (topic: typeof CONVERSATION_TOPICS[0]) => {
    playClickSound();
    setCurrentTopic(topic);
    setShowTopicModal(false);
    const newMsgText = `We are now chatting about: ${topic.name}! ${topic.prompt}`;
    setMessages(prev => [
      ...prev,
      {
        id: `topic-switch-${Date.now()}`,
        role: 'ai',
        text: newMsgText,
        replyVi: `Đã chuyển sang chủ đề: ${topic.name}. Hãy bắt đầu cuộc hội thoại nào!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedReplies: [
          `Let's discuss ${topic.name}!`,
          "Could you ask me an interesting question about this?",
          "I have a great story about this topic."
        ]
      }
    ]);

    if (audioAutoPlay) {
      speakAlex(newMsgText);
    }
  };

  const toggleTranslate = (msgId: string) => {
    playClickSound();
    const wasVisible = Boolean(showViMap[msgId]);
    const message = messages.find(item => item.id === msgId);
    setShowViMap(prev => ({
      ...prev,
      [msgId]: !prev[msgId]
    }));

    // Read the Vietnamese translation only when the user opens it, not when hiding it.
    if (!wasVisible && message?.replyVi?.trim()) {
      playTTS(message.replyVi, { lang: 'vi-VN' });
    }
  };

  const toggleFeedback = (msgId: string) => {
    playClickSound();
    setShowFeedbackMap(prev => ({
      ...prev,
      [msgId]: !prev[msgId]
    }));
  };

  const handleSaveWordToNotebook = (wordObj: { word: string; phonetic?: string; meaning: string; example?: string }) => {
    playClickSound();
    if (savedWords.includes(wordObj.word.toLowerCase())) return;

    const currentWords = stats.learnedWords || [];
    const newWord: VocabularyWord = {
      word: wordObj.word,
      meaning: wordObj.meaning,
      example: wordObj.example || '',
      phonetic: wordObj.phonetic || '',
      mastery: 20,
      topic: currentTopic.name
    };

    if (onUpdateProfile) {
      onUpdateProfile({
        learnedWords: [newWord, ...currentWords.filter(w => w.word.toLowerCase() !== wordObj.word.toLowerCase())]
      });
    }

    setSavedWords(prev => [...prev, wordObj.word.toLowerCase()]);
  };

  const handleSendText = async (textToSend: string) => {
    if (!textToSend.trim() || isTyping) return;

    const userText = textToSend.trim();
    setInput('');
    if (isListening && audioContextRef.current) {
      // A typed message cancels recording and discards its audio.
      await stopMicrophoneCapture(false);
      setIsListening(false);
    }

    const userMsgId = `user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const historySummary = messages.slice(-6).map(m => ({ role: m.role, text: m.text }));
      const aiResponse: AlexChatResponse = await chatWithAlexAI(
        userText,
        historySummary,
        currentTopic.name,
        stats.grade || "10"
      );

      const earnedExp = aiResponse.expEarned || 20;
      const earnedGems = aiResponse.gemsEarned || 2;

      // CỘNG ĐIỂM TRỰC TIẾP VÀO HỒ SƠ NGƯỜI DÙNG
      const updatedExp = (stats.exp || 0) + earnedExp;
      const updatedGems = (stats.gems || 150) + earnedGems;
      const updatedLevel = Math.max(1, Math.floor(updatedExp / 100) + 1);

      if (onUpdateProfile) {
        onUpdateProfile({
          exp: updatedExp,
          gems: updatedGems,
          level: updatedLevel
        });
      }

      playCorrectSound();
      setSessionExp(prev => prev + earnedExp);
      setSessionGems(prev => prev + earnedGems);
      setMessageCount(prev => prev + 1);

      setRewardToast({
        exp: earnedExp,
        gems: earnedGems,
        text: `+${earnedExp} EXP · +${earnedGems} 💎`
      });

      setTimeout(() => {
        setRewardToast(null);
      }, 3500);

      // Cập nhật điểm trên tin nhắn của người dùng
      setMessages(prev => prev.map(m => m.id === userMsgId ? { ...m, expEarned: earnedExp, gemsEarned: earnedGems } : m));

      // Thêm phản hồi của Alex
      const aiMsgId = `ai-${Date.now()}`;
      const aiMsg: ChatMessage = {
        id: aiMsgId,
        role: 'ai',
        text: aiResponse.replyEn,
        replyVi: aiResponse.replyVi,
        score: aiResponse.score,
        feedbackVi: aiResponse.feedbackVi,
        betterSentence: aiResponse.betterSentence,
        vocabularyWords: aiResponse.vocabularyWords,
        suggestedReplies: aiResponse.suggestedReplies,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsg]);

      // Mở feedback cho tin nhắn có nhận xét
      setShowFeedbackMap(prev => ({ ...prev, [aiMsgId]: true }));

      // TỰ ĐỘNG PHÁT ÂM QUA TEXT-TO-SPEECH NẾU BẬT LOA HOẶC BẬT TRỢ NĂNG KHIẾM THỊ
      if (audioAutoPlay || stats.accessibilityMode) {
        speakAlex(aiResponse.replyEn);
      }
    } catch (err) {
      console.error("Chat error:", err);
      const fallbackExp = 15;
      const fallbackGems = 1;

      if (onUpdateProfile) {
        onUpdateProfile({
          exp: (stats.exp || 0) + fallbackExp,
          gems: (stats.gems || 150) + fallbackGems
        });
      }

      playCorrectSound();
      setSessionExp(prev => prev + fallbackExp);
      setSessionGems(prev => prev + fallbackGems);

      const fallbackText = "That sounds very interesting! Could you tell me a little bit more about that?";
      setMessages(prev => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          role: 'ai',
          text: fallbackText,
          replyVi: "Nghe thú vị quá! Bạn có thể chia sẻ thêm một chút về điều đó không?",
          score: 85,
          feedbackVi: "Alex đã ghi nhận câu nói của bạn. Hãy tiếp tục phát huy nhé!",
          suggestedReplies: ["Sure, let me elaborate!", "What else would you like to know?"],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);

      if (audioAutoPlay || stats.accessibilityMode) {
        speakAlex(fallbackText);
      }
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendQuickThumb = () => {
    handleSendText("Sounds great, Alex! 👍");
  };

  const handleFinish = () => {
    playChestSound();
    stopTTS();
    if (sessionExp > 0 && onComplete) {
      onComplete(sessionExp);
    }
    window.location.hash = '#/';
  };

  return (
    <div className="h-full w-full flex bg-[#f0f2f5] overflow-hidden select-none relative">
      
      {/* ==================================================================== */}
      {/* MAIN MESSENGER CHAT AREA (100% FULL-WIDTH, NO DIALOGUE OVERLAYS)     */}
      {/* ==================================================================== */}
      <div className="flex-1 w-full flex flex-col bg-white h-full overflow-hidden relative shadow-sm">
        
        {/* MESSENGER TOP APP BAR */}
        <div className="h-14 sm:h-16 px-2.5 sm:px-6 bg-white border-b border-[#e4e6eb] flex items-center justify-between shrink-0 z-30 shadow-xs gap-1.5 w-full max-w-full">
          
          {/* Left: Contact Info (Messenger Profile Bar) */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="relative shrink-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-full overflow-hidden border border-[#00000015] bg-[#fff0f0] flex items-center justify-center shadow-xs">
                <img 
                  src={ALEX_AVATAR_URL} 
                  alt="Alex AI" 
                  className="w-full h-full object-contain pointer-events-none select-none" 
                />
              </div>
              {/* Online Green Badge */}
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 bg-[#31a24c] border-2 border-white rounded-full"></span>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span className="font-[800] text-xs sm:text-base text-[#050505] leading-tight">
                  Alex AI
                </span>
                <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[#0084ff] text-white flex items-center justify-center text-[8px] sm:text-[9px] font-black" title="Gia sư AI chính thức">
                  ✓
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-[#e7f3ff] text-[#0084ff] font-extrabold text-[10px]">
                  Cấp {stats.level || 1}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-medium text-[#65676b]">
                <span className="text-[#31a24c] font-bold hidden xs:inline">Online</span>
                <span className="hidden xs:inline">·</span>
                <button 
                  type="button" 
                  onClick={() => setShowTopicModal(true)}
                  className="truncate max-w-[100px] sm:max-w-none text-[#0084ff] font-semibold cursor-pointer hover:underline flex items-center gap-0.5"
                >
                  <span className="truncate">{currentTopic.icon} {currentTopic.name}</span>
                  <ChevronDown size={11} className="shrink-0" />
                </button>
              </div>
            </div>
          </div>

          {/* Right: Messenger Actions (Live Session Points, Audio TTS, Topics, Exit) */}
          <div className="flex items-center gap-1 sm:gap-2 md:gap-3 shrink-0">
            
            {/* Live Session Points Pill Badge */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-[#f0f2f5] border border-[#e4e6eb] rounded-full text-xs font-black">
              <span className="text-[#0084ff] flex items-center gap-1">
                <Zap size={14} className="fill-current" />
                +{sessionExp} EXP
              </span>
              <span className="text-[#65676b]">·</span>
              <span className="text-[#00a884] flex items-center gap-1">
                <Gem size={14} className="fill-current text-[#0084ff]" />
                +{sessionGems} 💎
              </span>
            </div>

            {/* Listen to latest Alex reply button */}
            <button
              type="button"
              onClick={() => {
                playClickSound();
                const lastAiMsg = [...messages].reverse().find(m => m.role === 'ai');
                if (lastAiMsg) {
                  speakAlex(lastAiMsg.text);
                }
              }}
              className={`p-1.5 sm:px-3 sm:py-1.5 rounded-full font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                isAlexSpeaking 
                  ? 'bg-[#0084ff] text-white shadow-sm animate-pulse' 
                  : 'bg-[#e7f3ff] text-[#0084ff] hover:bg-[#d8ecff]'
              }`}
              title="Nghe Alex phát âm tiếng Anh qua Text-to-Speech"
            >
              <Volume2 size={16} className={isAlexSpeaking ? "animate-bounce" : ""} />
              <span className="hidden sm:inline">{isAlexSpeaking ? 'Đang đọc...' : 'Phát âm Alex'}</span>
            </button>

            {/* Auto Audio Playback toggle */}
            <button
              type="button"
              onClick={() => {
                playClickSound();
                const nextState = !audioAutoPlay;
                setAudioAutoPlay(nextState);
                if (nextState) {
                  const lastAiMsg = [...messages].reverse().find(m => m.role === 'ai');
                  if (lastAiMsg) speakAlex(lastAiMsg.text);
                } else {
                  stopTTS();
                  setIsAlexSpeaking(false);
                }
              }}
              className={`p-1.5 sm:p-2 rounded-full transition-colors cursor-pointer ${
                audioAutoPlay 
                  ? 'bg-[#e7f3ff] text-[#0084ff]' 
                  : 'text-[#65676b] hover:bg-[#f0f2f5]'
              }`}
              title={audioAutoPlay ? "Đang bật tự động đọc câu trả lời (TTS)" : "Bật tự động phát âm Alex"}
            >
              {audioAutoPlay ? <Volume2 size={17} /> : <VolumeX size={17} />}
            </button>

            {/* Change Topic Dialog */}
            <button
              type="button"
              onClick={() => {
                playClickSound();
                setShowTopicModal(true);
              }}
              className="p-1.5 sm:p-2 rounded-full text-[#65676b] hover:bg-[#f0f2f5] transition-colors cursor-pointer hidden sm:flex"
              title="Đổi chủ đề trò chuyện"
            >
              <Sliders size={17} />
            </button>

            {/* Finish session button */}
            <button
              type="button"
              onClick={handleFinish}
              className="p-1.5 sm:p-2 rounded-full text-[#65676b] hover:text-[#ff3b30] hover:bg-[#fff0f0] transition-colors cursor-pointer"
              title="Rời phòng trò chuyện"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>

        {/* FLOATING POINT REWARD TOAST */}
        {rewardToast && (
          <div className="absolute top-20 right-6 z-40 animate-in slide-in-from-top-3 duration-300 pointer-events-none">
            <div className="bg-[#1c1e21] text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2.5 border border-white/10 backdrop-blur-md">
              <span className="w-6 h-6 rounded-full bg-[#0084ff] text-white flex items-center justify-center text-xs font-bold">
                ⚡
              </span>
              <span className="font-[800] text-xs tracking-tight">
                +{rewardToast.exp} EXP
              </span>
              <span className="text-[#a5f3fc] font-[800] text-xs">
                +{rewardToast.gems} 💎
              </span>
              <span className="text-[10px] text-[#31a24c] font-black uppercase ml-1">
                Đã cộng trực tiếp!
              </span>
            </div>
          </div>
        )}

        {/* CHAT MESSAGES SCROLL VIEW (MESSENGER BUBBLES FULL WIDTH) */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 md:px-8 py-5 space-y-4 scroll-smooth custom-scrollbar w-full max-w-4xl mx-auto"
        >
          {/* Messenger Introductory Profile Header */}
          <div className="flex flex-col items-center justify-center py-6 text-center space-y-2 border-b border-[#f0f2f5] mb-4">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-2 border-[#e4e6eb] bg-[#fff0f0] shadow-sm relative mb-1">
              <img 
                src={ALEX_AVATAR_URL} 
                alt="Alex" 
                className="w-full h-full object-contain pointer-events-none select-none" 
              />
            </div>
            <h2 className="font-[900] text-xl text-[#050505] tracking-tight flex items-center gap-1.5">
              <span>Alex AI</span>
              <span className="w-4 h-4 rounded-full bg-[#0084ff] text-white flex items-center justify-center text-[10px]">✓</span>
            </h2>
            <p className="text-xs text-[#65676b] font-medium max-w-md">
              Gia sư tiếng Anh thông minh Eng AI. Bạn và Alex đang kết nối trực tiếp trong chủ đề: <strong className="text-[#0084ff]">{currentTopic.name}</strong>.
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#f0f2f5] rounded-full text-[11px] font-bold text-[#65676b]">
              <span>⚡ Chấm điểm phản xạ & cộng điểm trực tiếp mỗi tin nhắn</span>
            </div>
          </div>

          {/* Date Separator */}
          <div className="text-center my-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8a8d91] bg-[#f0f2f5] px-3.5 py-1 rounded-full">
              HÔM NAY
            </span>
          </div>

          {/* Messages list */}
          {messages.map((msg, i) => {
            const isUser = msg.role === 'user';
            const isViShown = showViMap[msg.id];
            const isFeedbackShown = showFeedbackMap[msg.id];

            return (
              <div 
                key={msg.id || i}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} group`}
              >
                <div className={`flex items-end gap-2.5 max-w-[88%] md:max-w-[75%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                  
                  {/* Alex Avatar icon (only for AI) */}
                  {!isUser && (
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-[#fff0f0] border border-[#e4e6eb] shrink-0 mb-1">
                      <img 
                        src={ALEX_AVATAR_URL} 
                        alt="Alex" 
                        className="w-full h-full object-contain pointer-events-none select-none" 
                      />
                    </div>
                  )}

                  {/* Bubble Container */}
                  <div className="space-y-1 min-w-0">
                    
                    {/* The Messenger Speech Bubble */}
                    <div 
                      className={`px-4.5 py-3 text-[14.5px] md:text-[15px] leading-relaxed break-words shadow-xs select-text transition-all ${
                        isUser 
                          ? 'bg-gradient-to-r from-[#0084ff] to-[#0073e6] text-white rounded-[22px] rounded-br-[5px]' 
                          : 'bg-[#f0f2f5] text-[#050505] rounded-[22px] rounded-bl-[5px]'
                      }`}
                    >
                      <p>{msg.text}</p>
                    </div>

                    {/* Inline Quick Action Icons below AI bubble */}
                    {!isUser && (
                      <div className="flex flex-wrap items-center gap-2 pt-0.5 px-1 text-[11px] text-[#65676b] font-semibold">
                        
                        {/* Audio TTS button */}
                        <button
                          type="button"
                          onClick={() => speakAlex(msg.text)}
                          className="hover:text-[#0084ff] hover:bg-[#f0f2f5] px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors cursor-pointer"
                          title="Nghe Alex phát âm câu này"
                        >
                          <Volume2 size={13} />
                          <span>Phát âm</span>
                        </button>

                        {/* Translation Toggle */}
                        {msg.replyVi && (
                          <button
                            type="button"
                            onClick={() => toggleTranslate(msg.id)}
                            className="hover:text-[#0084ff] hover:bg-[#f0f2f5] px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Languages size={13} />
                            <span>{isViShown ? 'Ẩn dịch' : 'Dịch nghĩa'}</span>
                          </button>
                        )}

                        {/* Grammar feedback toggle */}
                        {(msg.score !== undefined || msg.feedbackVi) && (
                          <button
                            type="button"
                            onClick={() => toggleFeedback(msg.id)}
                            className={`px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors cursor-pointer ${
                              isFeedbackShown 
                                ? 'text-[#0084ff] bg-[#e7f3ff] font-bold' 
                                : 'text-[#65676b] hover:text-[#0084ff] hover:bg-[#f0f2f5]'
                            }`}
                          >
                            <Lightbulb size={13} className="text-[#f59e0b]" />
                            <span>Nhận xét {msg.score ? `(${msg.score}đ)` : ''}</span>
                          </button>
                        )}

                        <span className="text-[10px] text-[#bcc0c4] ml-auto">{msg.timestamp}</span>
                      </div>
                    )}

                    {/* User timestamp & Delivery status */}
                    {isUser && (
                      <div className="flex items-center justify-end gap-1.5 px-1 text-[10px] text-[#8a8d91] font-medium">
                        {msg.expEarned && (
                          <span className="text-[#0084ff] font-bold">
                            +{msg.expEarned} EXP · +{msg.gemsEarned} 💎
                          </span>
                        )}
                        <span>·</span>
                        <span>{msg.timestamp}</span>
                        <span>·</span>
                        <span>Đã gửi</span>
                      </div>
                    )}

                    {/* Vietnamese Translation Popdown */}
                    {!isUser && msg.replyVi && isViShown && (
                      <div className="mt-1.5 p-3 bg-[#f0f8ff] rounded-2xl text-xs text-[#0066cc] border border-[#d0e7ff] animate-in fade-in">
                        <span className="font-bold text-[10px] uppercase block text-[#0084ff] mb-0.5">Bản dịch tiếng Việt:</span>
                        {msg.replyVi}
                      </div>
                    )}

                    {/* Linguistic Evaluation Card */}
                    {!isUser && isFeedbackShown && (msg.feedbackVi || msg.betterSentence || (msg.vocabularyWords && msg.vocabularyWords.length > 0)) && (
                      <div className="mt-2 p-3.5 bg-white rounded-2xl border border-[#e4e6eb] shadow-sm space-y-2 text-xs animate-in zoom-in-95 duration-200">
                        
                        {/* Header: Score */}
                        <div className="flex items-center justify-between pb-1.5 border-b border-[#f0f2f5]">
                          <span className="font-bold text-[#050505] flex items-center gap-1.5">
                            <Sparkles size={14} className="text-[#0084ff]" />
                            Nhận xét từ Alex:
                          </span>
                          {msg.score && (
                            <span className="px-2.5 py-0.5 bg-[#e7f3ff] text-[#0084ff] font-black rounded-full text-[11px]">
                              {msg.score}/100 Điểm phản xạ
                            </span>
                          )}
                        </div>

                        {/* Feedback text */}
                        {msg.feedbackVi && (
                          <p className="text-[#050505] font-medium leading-relaxed">
                            {msg.feedbackVi}
                          </p>
                        )}

                        {/* Natural alternative phrasing */}
                        {msg.betterSentence && (
                          <div className="p-2.5 bg-[#f7f8fa] rounded-xl border border-[#e4e6eb] text-[11px]">
                            <span className="text-[10px] font-bold text-[#65676b] block uppercase">Cách nói tự nhiên hơn:</span>
                            <span className="text-[#050505] font-semibold italic">"{msg.betterSentence}"</span>
                          </div>
                        )}

                        {/* Vocabulary words highlighted */}
                        {msg.vocabularyWords && msg.vocabularyWords.length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            <span className="text-[10px] font-bold uppercase text-[#8a8d91] block">Từ vựng hay:</span>
                            <div className="space-y-1">
                              {msg.vocabularyWords.map((vWord, vIdx) => {
                                const isSaved = savedWords.includes(vWord.word.toLowerCase());

                                return (
                                  <div key={vIdx} className="flex items-center justify-between p-2 bg-[#f0f2f5] rounded-xl">
                                    <div>
                                      <span className="font-bold text-[#0084ff]">{vWord.word}</span>
                                      {vWord.phonetic && <span className="text-[10px] text-[#65676b] ml-1">({vWord.phonetic})</span>}
                                      <span className="text-[#050505] text-[11px] block">{vWord.meaning}</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleSaveWordToNotebook(vWord)}
                                      disabled={isSaved}
                                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                                        isSaved 
                                          ? 'bg-[#e7f3ff] text-[#0084ff]' 
                                          : 'bg-white hover:bg-[#e7f3ff] text-[#050505] shadow-xs'
                                      }`}
                                    >
                                      {isSaved ? 'Đã lưu ✓' : '+ Lưu từ'}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing Indicator (Messenger three bouncing dots) */}
          {isTyping && (
            <div className="flex items-end gap-2.5">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-[#fff0f0] border border-[#e4e6eb] shrink-0 mb-1">
                <img 
                  src={ALEX_AVATAR_URL} 
                  alt="Alex" 
                  className="w-full h-full object-contain pointer-events-none select-none" 
                />
              </div>
              <div className="bg-[#f0f2f5] px-4 py-3 rounded-[22px] rounded-bl-[5px] flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#8a8d91] animate-bounce"></div>
                <div className="w-2 h-2 rounded-full bg-[#8a8d91] animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-2 h-2 rounded-full bg-[#8a8d91] animate-bounce [animation-delay:0.4s]"></div>
              </div>
            </div>
          )}
        </div>

        {/* QUICK SUGGESTION REPLIES (MESSENGER PILLS SCROLL) */}
        {(() => {
          const lastAiMsg = [...messages].reverse().find(m => m.role === 'ai');
          if (lastAiMsg && lastAiMsg.suggestedReplies && lastAiMsg.suggestedReplies.length > 0 && !isTyping) {
            return (
              <div className="w-full px-4 md:px-8 py-2 border-t border-[#f0f2f5] bg-[#fafafa] flex items-center gap-2 overflow-x-auto custom-scrollbar shrink-0">
                <span className="text-[11px] font-bold text-[#8a8d91] shrink-0 mr-1 hidden sm:inline">Gợi ý trả lời:</span>
                {lastAiMsg.suggestedReplies.map((replyText, rIdx) => (
                  <button
                    key={rIdx}
                    type="button"
                    onClick={() => handleSendText(replyText)}
                    className="px-3.5 py-1.5 bg-white hover:bg-[#e7f3ff] border border-[#ccd0d5] hover:border-[#0084ff] text-[#050505] hover:text-[#0084ff] rounded-full text-xs font-semibold whitespace-nowrap transition-all shadow-xs cursor-pointer active:scale-95 flex items-center gap-1"
                  >
                    <span>"{replyText}"</span>
                    <CornerDownRight size={12} className="text-[#0084ff]" />
                  </button>
                ))}
              </div>
            );
          }
          return null;
        })()}

        {/* ==================================================================== */}
        {/* MESSENGER BOTTOM INPUT COMPOSER BAR                                  */}
        {/* ==================================================================== */}
        <div className="p-2 sm:p-3 md:p-4 bg-white border-t border-[#e4e6eb] shrink-0 z-20 w-full max-w-full">
          
          {/* Active Voice Listening Banner */}
          {isListening && (
            <div role="status" aria-live="polite" className="max-w-4xl mx-auto mb-2 p-2 px-3 bg-[#e7f3ff] border border-[#0084ff]/30 rounded-xl text-xs font-semibold text-[#0084ff] flex items-center justify-between animate-pulse">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2 h-2 rounded-full bg-[#0084ff] animate-ping shrink-0"></span>
                <span className="truncate">Đang ghi âm... Nói tiếng Anh rồi nhấn lại nút micro để gửi cho Gemini chuyển thành chữ.</span>
              </div>
              <button
                type="button"
                onClick={toggleListening}
                className="text-[11px] font-bold text-[#ff3b30] hover:underline cursor-pointer shrink-0 ml-2"
              >
                Dừng & chuyển chữ
              </button>
            </div>
          )}

          {isTranscribing && (
            <div role="status" aria-live="polite" className="max-w-4xl mx-auto mb-2 p-2 px-3 bg-[#eefbf0] border border-[#58cc02]/30 rounded-xl text-xs font-semibold text-[#287b00] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#58cc02] animate-pulse shrink-0"></span>
              <span>Đang gửi âm thanh cho Gemini để chuyển thành văn bản...</span>
            </div>
          )}

          {/* Tell the user why voice input did not start instead of failing silently. */}
          {micError && (
            <div role="alert" aria-live="assertive" className="max-w-4xl mx-auto mb-2 p-2.5 px-3 bg-[#fff4e5] border border-[#f0b429]/50 rounded-xl text-xs font-semibold text-[#7a4a00] flex items-start justify-between gap-3">
              <span>{micError}</span>
              <button type="button" onClick={() => setMicError(null)} className="shrink-0 font-bold hover:underline" aria-label="Đóng thông báo micro">Đóng</button>
            </div>
          )}

          <div className="max-w-4xl mx-auto flex items-center gap-1.5 sm:gap-2 md:gap-3 w-full">
            
            {/* Plus / Change topic button */}
            <button
              type="button"
              onClick={() => {
                playClickSound();
                setShowTopicModal(true);
              }}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full text-[#0084ff] hover:bg-[#f0f2f5] flex items-center justify-center transition-colors cursor-pointer shrink-0"
              title="Chọn chủ đề hội thoại"
            >
              <PlusCircle size={20} className="sm:w-[22px] sm:h-[22px]" />
            </button>

            {/* Microphone button (Voice Speech-to-Text) */}
            <button
              type="button"
              onClick={toggleListening}
              disabled={isTranscribing}
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-wait ${
                isListening 
                  ? 'bg-[#ff3b30] text-white animate-bounce shadow-md' 
                  : 'text-[#0084ff] hover:bg-[#f0f2f5]'
              }`}
              title={isTranscribing ? "Gemini đang chuyển âm thanh thành chữ" : isListening ? "Dừng ghi âm và chuyển thành chữ" : "Ghi âm tin nhắn tiếng Anh"}
              aria-label={isTranscribing ? "Đang chuyển giọng nói thành văn bản" : isListening ? "Dừng ghi âm và chuyển thành văn bản" : "Ghi âm tin nhắn bằng giọng nói tiếng Anh"}
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>

            {/* Messenger Input Pill Field */}
            <div className="flex-1 min-w-0 bg-[#f0f2f5] rounded-full px-3 sm:px-4 py-2 sm:py-2.5 flex items-center gap-2 focus-within:ring-2 focus-within:ring-[#0084ff]/30 focus-within:bg-white transition-all">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSendText(input);
                  }
                }}
                placeholder="Nhắn tin với Alex..."
                className="w-full bg-transparent outline-none font-medium text-xs sm:text-base text-[#050505] placeholder-[#8a8d91]"
              />
            </div>

            {/* Send or Thumbs Up Button (Messenger Signature) */}
            {input.trim() ? (
              <button
                type="button"
                onClick={() => handleSendText(input)}
                disabled={isTyping}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#0084ff] text-white hover:bg-[#0073e6] active:scale-90 flex items-center justify-center transition-all shadow-sm cursor-pointer shrink-0"
                title="Gửi tin nhắn"
              >
                <Send size={16} className="sm:w-[18px] sm:h-[18px]" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSendQuickThumb}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full text-[#0084ff] hover:bg-[#f0f2f5] active:scale-90 flex items-center justify-center transition-all cursor-pointer shrink-0"
                title="Gửi biểu tượng thích 👍"
              >
                <ThumbsUp size={19} className="fill-current sm:w-[22px] sm:h-[22px]" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* TOPIC SELECTOR MODAL (MESSENGER THEME PICKER STYLE)                   */}
      {/* ==================================================================== */}
      {showTopicModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl border border-[#e4e6eb] animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-[#f0f2f5]">
              <h3 className="font-[900] text-base text-[#050505]">Chọn Chủ Đề Hội Thoại</h3>
              <button 
                onClick={() => setShowTopicModal(false)}
                className="p-1 rounded-full text-[#65676b] hover:bg-[#f0f2f5] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            
            <p className="text-xs text-[#65676b]">
              Alex sẽ điều chỉnh ngữ cảnh và phát âm các câu hỏi theo chủ đề bạn chọn:
            </p>

            <div className="space-y-2 max-h-[60vh] overflow-y-auto custom-scrollbar pr-1">
              {CONVERSATION_TOPICS.map((topic) => {
                const isSelected = currentTopic.id === topic.id;
                return (
                  <button
                    key={topic.id}
                    onClick={() => handleTopicSelect(topic)}
                    className={`w-full p-3 rounded-2xl border-2 flex items-center justify-between text-left transition-all cursor-pointer ${
                      isSelected 
                        ? 'border-[#0084ff] bg-[#e7f3ff]' 
                        : 'border-[#f0f2f5] hover:border-[#ccd0d5] bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{topic.icon}</span>
                      <div>
                        <span className="font-bold text-xs md:text-sm text-[#050505] block">{topic.name}</span>
                        <span className="text-[11px] text-[#65676b] line-clamp-1">{topic.prompt}</span>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-[#0084ff] text-white flex items-center justify-center text-xs shrink-0">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
