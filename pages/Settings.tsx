import React, { useState, useEffect } from 'react';
import { UserStats } from '../types';
import { 
  Check, 
  ChevronDown, 
  Sparkles, 
  BookOpen, 
  HelpCircle, 
  Bell, 
  GraduationCap, 
  CreditCard, 
  Volume2,
  VolumeX,
  Sliders,
  Compass,
  Users
} from 'lucide-react';
import { playClickSound, playChestSound } from '../services/soundEffects';
import {
  setAccessibilityMode,
  isAccessibilityMode,
  playTTS,
  stopTTS,
  getAccessibilitySpeechRate,
  setAccessibilitySpeechRate
} from '../services/ttsService';

interface SettingsProps {
  stats: UserStats;
  onUpdateProfile: (d: Partial<UserStats>) => void;
}

type SettingsSection = 
  | 'preferences'
  | 'accessibility'
  | 'academic'
  | 'courses'
  | 'schools'
  | 'notifications'
  | 'subscription'
  | 'support';

export default function SettingsPage({ stats, onUpdateProfile }: SettingsProps) {
  const [activeSection, setActiveSection] = useState<SettingsSection>('preferences');

  // Accessibility state
  const [accessibilityVoice, setAccessibilityVoice] = useState<boolean>(() => {
    return stats.accessibilityMode ?? isAccessibilityMode();
  });
  const [voiceSpeed, setVoiceSpeed] = useState<number>(
    stats.accessibilityVoiceSpeed || getAccessibilitySpeechRate()
  );
  const [autoReadQuestions, setAutoReadQuestions] = useState<boolean>(true);
  const [isPlayingSample, setIsPlayingSample] = useState<boolean>(false);

  // Preferences toggles
  const [soundEffects, setSoundEffects] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('duo_sound_effects');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const [animations, setAnimations] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('duo_animations');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const [motivationalMessages, setMotivationalMessages] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('duo_motivational');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const [listeningExercises, setListeningExercises] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('duo_listening');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const [appearanceMode, setAppearanceMode] = useState<string>('LIGHT');

  // Academic goals
  const [selectedGrade, setSelectedGrade] = useState(stats.grade || '10');
  const [selectedMode, setSelectedMode] = useState<'regular' | 'ielts'>(stats.studyMode || 'regular');
  const [targetBand, setTargetBand] = useState(stats.targetBand || '6.5');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Notifications toggles
  const [notifDaily, setNotifDaily] = useState(true);
  const [notifStreak, setNotifStreak] = useState(true);
  const [notifWeekly, setNotifWeekly] = useState(true);

  // Classroom code
  const [classCode, setClassCode] = useState('');
  const [joinedClass, setJoinedClass] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('duo_sound_effects', JSON.stringify(soundEffects));
  }, [soundEffects]);

  useEffect(() => {
    localStorage.setItem('duo_animations', JSON.stringify(animations));
  }, [animations]);

  useEffect(() => {
    localStorage.setItem('duo_motivational', JSON.stringify(motivationalMessages));
  }, [motivationalMessages]);

  useEffect(() => {
    localStorage.setItem('duo_listening', JSON.stringify(listeningExercises));
  }, [listeningExercises]);

  const handleToggle = (setter: React.Dispatch<React.SetStateAction<boolean>>, current: boolean) => {
    playClickSound();
    setter(!current);
  };

  const handleSaveAcademic = () => {
    playChestSound();
    onUpdateProfile({
      grade: selectedGrade,
      studyMode: selectedMode,
      targetBand,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Toggle Switch Button
  const ToggleSwitch = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 relative cursor-pointer shrink-0 border-2 ${
        checked 
          ? 'bg-[#1cb0f6] border-[#1899d6]' 
          : 'bg-[#e5e5e5] border-[#d4d4d4]'
      }`}
    >
      <div 
        className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-300 ${
          checked ? 'translate-x-6' : 'translate-x-0'
        }`}
      />
    </button>
  );

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 md:px-8 py-4 md:py-8 pb-28 md:pb-32 overflow-x-hidden">
      {/* MOBILE TABS (HORIZONTAL SCROLL ON SMALL SCREENS) */}
      <div className="lg:hidden flex items-center gap-2 overflow-x-auto custom-scrollbar pb-3 mb-4 -mx-1 px-1">
        {[
          { id: 'preferences', label: 'Tùy chọn' },
          { id: 'accessibility', label: 'Trợ năng Khiếm thị' },
          { id: 'academic', label: 'Lộ trình' },
          { id: 'courses', label: 'Khóa học' },
          { id: 'schools', label: 'Lớp học' },
          { id: 'notifications', label: 'Thông báo' },
          { id: 'subscription', label: 'PRO Trọn Đời' },
          { id: 'support', label: 'Trợ giúp' },
        ].map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                playClickSound();
                setActiveSection(item.id as SettingsSection);
              }}
              className={`px-3.5 py-2 rounded-xl font-[900] text-xs uppercase tracking-wider shrink-0 transition-all border ${
                isActive
                  ? 'bg-[#1cb0f6] text-white border-[#1899d6] shadow-xs'
                  : 'bg-white text-[#777] border-[#e5e5e5] hover:border-[#ccc]'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col lg:flex-row gap-6 md:gap-8 items-start">
        
        {/* MAIN SETTINGS CONTENT AREA */}
        <div className="flex-1 w-full bg-white rounded-[24px] sm:rounded-[32px] p-4 sm:p-6 md:p-10 border-2 border-[#e5e5e5] shadow-xs">
          
          {/* 1. TÙY CHỌN HỌC TẬP */}
          {activeSection === 'preferences' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              <div>
                <h1 className="text-2xl md:text-3xl font-[900] text-[#4b4b4b] tracking-tight">
                  Tùy chọn học tập
                </h1>
                <p className="text-xs font-bold text-[#afafaf] mt-1">
                  Tùy chỉnh âm thanh, hình ảnh và trợ lý phản xạ ngôn ngữ.
                </p>
              </div>

              {/* Trải nghiệm bài học */}
              <div className="space-y-6">
                <h2 className="text-lg md:text-xl font-[900] text-[#4b4b4b] tracking-tight">
                  Trải nghiệm bài học
                </h2>

                <div className="space-y-5">
                  {/* Sound effects */}
                  <div className="flex items-center justify-between gap-4 py-1">
                    <div>
                      <span className="font-[900] text-base text-[#4b4b4b] block">
                        Hiệu ứng âm thanh
                      </span>
                      <span className="text-xs font-bold text-[#afafaf]">
                        Phát âm thanh sinh động khi trả lời đúng, sai và hoàn thành bài học
                      </span>
                    </div>
                    <ToggleSwitch 
                      checked={soundEffects} 
                      onChange={() => handleToggle(setSoundEffects, soundEffects)} 
                    />
                  </div>

                  {/* Animations */}
                  <div className="flex items-center justify-between gap-4 py-1">
                    <div>
                      <span className="font-[900] text-base text-[#4b4b4b] block">
                        Hiệu ứng hoạt họa
                      </span>
                      <span className="text-xs font-bold text-[#afafaf]">
                        Chuyển động mượt mà của các thẻ bài tập và giao diện
                      </span>
                    </div>
                    <ToggleSwitch 
                      checked={animations} 
                      onChange={() => handleToggle(setAnimations, animations)} 
                    />
                  </div>

                  {/* Motivational */}
                  <div className="flex items-center justify-between gap-4 py-1">
                    <div>
                      <span className="font-[900] text-base text-[#4b4b4b] block">
                        Tin nhắn động viên
                      </span>
                      <span className="text-xs font-bold text-[#afafaf]">
                        Lời cổ vũ và mẹo ghi nhớ kiến thức bổ ích từ Alex AI trong lúc học
                      </span>
                    </div>
                    <ToggleSwitch 
                      checked={motivationalMessages} 
                      onChange={() => handleToggle(setMotivationalMessages, motivationalMessages)} 
                    />
                  </div>

                  {/* Listening */}
                  <div className="flex items-center justify-between gap-4 py-1">
                    <div>
                      <span className="font-[900] text-base text-[#4b4b4b] block">
                        Bài tập nghe hiểu
                      </span>
                      <span className="text-xs font-bold text-[#afafaf]">
                        Kích hoạt các câu hỏi luyện phát âm và nghe mẫu câu đàm thoại
                      </span>
                    </div>
                    <ToggleSwitch 
                      checked={listeningExercises} 
                      onChange={() => handleToggle(setListeningExercises, listeningExercises)} 
                    />
                  </div>
                </div>
              </div>

              <div className="border-b-2 border-[#f0f0f0] my-8" />

              {/* Giao diện */}
              <div className="space-y-5">
                <h2 className="text-lg md:text-xl font-[900] text-[#4b4b4b] tracking-tight">
                  Giao diện hiển thị
                </h2>

                <div className="space-y-2">
                  <label className="font-[900] text-sm text-[#777] block">
                    Chế độ màu nền
                  </label>
                  <div className="relative max-w-md">
                    <select
                      value={appearanceMode}
                      onChange={(e) => {
                        playClickSound();
                        setAppearanceMode(e.target.value);
                      }}
                      className="w-full bg-[#f7f7f7] border-2 border-[#e5e5e5] rounded-2xl p-4 font-[900] text-xs uppercase tracking-wider text-[#4b4b4b] outline-none cursor-pointer appearance-none pr-10 focus:border-[#1cb0f6]"
                    >
                      <option value="LIGHT">GIAO DIỆN SÁNG (NỀN SÁNG - ĐANG CHỌN)</option>
                      <option value="SYSTEM">MẶC ĐỊNH THEO HỆ THỐNG</option>
                      <option value="DARK">CHẾ ĐỘ TỐI (BAN ĐÊM)</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#777]" size={20} />
                  </div>
                  <p className="text-xs font-bold text-[#58cc02] mt-1">
                    ✓ Ứng dụng đang hiển thị nền sáng rực rỡ và sắc nét.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 1.5. HỖ TRỢ KHIẾM THỊ & TRỢ NĂNG GIỌNG NÓI */}
          {activeSection === 'accessibility' && (
            <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-[#f0f9ff] text-[#1cb0f6] flex items-center justify-center border-2 border-[#1cb0f6]/20">
                    <Volume2 size={22} />
                  </div>
                  <div>
                    <h1 className="text-2xl md:text-3xl font-[900] text-[#4b4b4b] tracking-tight">
                      Trợ năng Khiếm thị (Voice Assistant)
                    </h1>
                    <p className="text-xs font-bold text-[#afafaf] mt-0.5">
                      Phát giọng nói tức thì bằng Text-to-Speech (0ms delay) hỗ trợ người khiếm thị.
                    </p>
                  </div>
                </div>
              </div>

              {/* Status Banner */}
              <div className={`p-5 rounded-[24px] border-2 transition-all ${
                accessibilityVoice 
                  ? 'bg-[#f0fff0] border-[#58cc02]/40 text-[#15803d]' 
                  : 'bg-[#f7f7f7] border-[#e5e5e5] text-[#777]'
              }`}>
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="font-black text-sm uppercase tracking-wider block flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${accessibilityVoice ? 'bg-[#58cc02] animate-ping' : 'bg-gray-400'}`} />
                      Trạng thái: {accessibilityVoice ? 'ĐANG BẬT (HOẠT ĐỘNG)' : 'ĐANG TẮT'}
                    </span>
                    <p className="text-xs font-bold opacity-90">
                      {accessibilityVoice 
                        ? 'Trợ lý giọng nói sẽ tự động đọc câu hỏi, đáp án, và điều hướng màn hình bằng công nghệ Text-to-Speech chạy ngay trên máy, không bị trễ mạng.' 
                        : 'Bật để ứng dụng tự động đọc nội dung học tập và hướng dẫn qua loa / tai nghe.'}
                    </p>
                  </div>
                  <ToggleSwitch
                    checked={accessibilityVoice}
                    onChange={() => {
                      playClickSound();
                      const next = !accessibilityVoice;
                      setAccessibilityVoice(next);
                      setAccessibilityMode(next);
                      onUpdateProfile({ accessibilityMode: next });
                    }}
                  />
                </div>
              </div>

              {/* Quick shortcut info */}
              <div className="p-4 bg-[#fffbf0] rounded-2xl border-2 border-[#ffc800]/30 flex items-start gap-3">
                <Sparkles size={20} className="text-[#ff9600] shrink-0 mt-0.5" />
                <div className="text-xs font-bold text-[#b45309] leading-relaxed">
                  <strong className="font-black uppercase tracking-wider block mb-0.5 text-[#92400e]">
                    Phím tắt nhanh bàn phím: Alt + V
                  </strong>
                  Người khiếm thị có thể nhấn tổ hợp phím <strong>Alt + V</strong> trên bàn phím bất kỳ lúc nào để bật hoặc tắt trợ lý giọng nói mà không cần tìm kiếm nút bấm trên màn hình.
                </div>
              </div>

              {/* Speech Controls */}
              <div className="space-y-5">
                <h2 className="text-lg font-[900] text-[#4b4b4b]">
                  Cài đặt giọng đọc tức thì
                </h2>

                {/* Voice Speed */}
                <div className="space-y-2">
                  <label className="font-[900] text-sm text-[#4b4b4b] block">
                    Tốc độ giọng đọc Text-to-Speech
                  </label>
                  <div className="grid grid-cols-3 gap-2.5 max-w-md">
                    {[
                      { val: 0.8, label: '0.8x Chậm' },
                      { val: 1.0, label: '1.0x Chuẩn' },
                      { val: 1.2, label: '1.2x Nhanh' },
                    ].map((sp) => (
                      <button
                        key={sp.val}
                        type="button"
                        onClick={() => {
                          playClickSound();
                          setVoiceSpeed(sp.val);
                          setAccessibilitySpeechRate(sp.val);
                          onUpdateProfile({ accessibilityVoiceSpeed: sp.val });
                          playTTS(`Tốc độ giọng đọc đã chọn: ${sp.label}`, { rate: sp.val, forceVietnamese: true });
                        }}
                        className={`py-3 px-2 rounded-xl font-black text-xs uppercase tracking-wider transition-all border-2 ${
                          voiceSpeed === sp.val
                            ? 'bg-[#1cb0f6] text-white border-[#1899d6] shadow-sm'
                            : 'bg-white text-[#777] border-[#e5e5e5] hover:border-[#bbb]'
                        }`}
                      >
                        {sp.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Test Speech Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    disabled={isPlayingSample}
                    onClick={() => {
                      playClickSound();
                      setIsPlayingSample(true);
                      playTTS(
                        "Xin chào bạn! Đây là giọng đọc trợ năng tức thì, không có độ trễ mạng. Hello, welcome to Eng AI for Learn!",
                        {
                          rate: voiceSpeed,
                          onEnd: () => setIsPlayingSample(false)
                        }
                      );
                    }}
                    className="px-6 py-3.5 bg-[#58cc02] hover:bg-[#46a302] text-white font-[900] text-xs uppercase tracking-wider rounded-2xl shadow-sm border-b-4 border-[#3a8a01] active:translate-y-0.5 cursor-pointer flex items-center gap-2"
                  >
                    <Volume2 size={18} className={isPlayingSample ? 'animate-bounce' : ''} />
                    <span>{isPlayingSample ? 'Đang phát âm thanh...' : 'Nghe thử giọng nói tức thì (0ms Delay)'}</span>
                  </button>
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-4 pt-2 border-t border-[#f0f0f0]">
                <div className="flex items-center justify-between gap-4 py-1">
                  <div>
                    <span className="font-[900] text-sm sm:text-base text-[#4b4b4b] block">
                      Tự động đọc câu hỏi khi bắt đầu bài học
                    </span>
                    <span className="text-xs font-bold text-[#afafaf]">
                      Ngay khi chuyển câu, ứng dụng sẽ phát âm nội dung câu hỏi và các phương án lựa chọn
                    </span>
                  </div>
                  <ToggleSwitch
                    checked={autoReadQuestions}
                    onChange={() => handleToggle(setAutoReadQuestions, autoReadQuestions)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 2. LỘ TRÌNH & MỤC TIÊU HỌC TẬP */}
          {activeSection === 'academic' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-4 border-b-2 border-[#f0f0f0]">
                <div>
                  <h1 className="text-2xl font-[900] text-[#4b4b4b] tracking-tight">Lộ trình & Mục tiêu</h1>
                  <p className="text-xs font-bold text-[#afafaf]">Điều chỉnh cấp độ học tập phù hợp theo chương trình SGK hoặc IELTS.</p>
                </div>
                {savedSuccess && (
                  <span className="flex items-center gap-1.5 text-xs font-black text-[#58cc02] bg-[#f0fff0] px-3.5 py-1.5 rounded-full border border-[#58cc02]/30 animate-in fade-in">
                    <Check size={14} strokeWidth={3} /> Đã lưu thành công
                  </span>
                )}
              </div>

              {/* Chế độ học tập */}
              <div className="space-y-2">
                <label className="text-xs font-[900] text-[#777] uppercase tracking-wider">Định hướng học tập chính</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      playClickSound();
                      setSelectedMode('regular');
                    }}
                    className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                      selectedMode === 'regular' 
                        ? 'border-[#58cc02] bg-[#f0fff0] text-[#46a302]' 
                        : 'border-[#e5e5e5] bg-[#f7f7f7] text-[#777] hover:border-[#ccc]'
                    }`}
                  >
                    <div className="font-[900] text-sm flex items-center gap-2">
                      <GraduationCap size={18} /> Tiếng Anh Phổ Thông (SGK)
                    </div>
                    <p className="text-xs font-bold mt-1 opacity-80">
                      Bám sát chương trình Giáo dục từ Lớp 1 đến Lớp 12
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playClickSound();
                      setSelectedMode('ielts');
                    }}
                    className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                      selectedMode === 'ielts' 
                        ? 'border-[#1cb0f6] bg-[#f0f9ff] text-[#1cb0f6]' 
                        : 'border-[#e5e5e5] bg-[#f7f7f7] text-[#777] hover:border-[#ccc]'
                    }`}
                  >
                    <div className="font-[900] text-sm flex items-center gap-2">
                      <Sparkles size={18} /> Luyện Thi IELTS Học Thuật
                    </div>
                    <p className="text-xs font-bold mt-1 opacity-80">
                      Tập trung từ vựng học thuật, phản xạ Band mục tiêu
                    </p>
                  </button>
                </div>
              </div>

              {/* Tùy chỉnh chi tiết */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-[900] text-[#777] uppercase tracking-wider">Khối lớp (SGK)</label>
                  <select
                    value={selectedGrade}
                    onChange={(e) => setSelectedGrade(e.target.value)}
                    className="w-full p-4 bg-[#f7f7f7] rounded-2xl border-2 border-[#e5e5e5] font-black text-sm text-[#4b4b4b] outline-none cursor-pointer focus:border-[#1cb0f6]"
                  >
                    {Array.from({ length: 12 }, (_, i) => (i + 1).toString()).map((g) => (
                      <option key={g} value={g}>Lớp {g}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-[900] text-[#777] uppercase tracking-wider">Mục tiêu IELTS Band</label>
                  <select
                    value={targetBand}
                    onChange={(e) => setTargetBand(e.target.value)}
                    className="w-full p-4 bg-[#f7f7f7] rounded-2xl border-2 border-[#e5e5e5] font-black text-sm text-[#4b4b4b] outline-none cursor-pointer focus:border-[#1cb0f6]"
                  >
                    {["5.0", "5.5", "6.0", "6.5", "7.0", "7.5", "8.0", "8.5+"].map((b) => (
                      <option key={b} value={b}>Band {b}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={handleSaveAcademic}
                  className="w-full py-4 bg-[#58cc02] hover:bg-[#46a302] text-white font-[900] text-sm uppercase tracking-wider rounded-2xl shadow-md border-b-4 border-[#3b8a01] active:translate-y-0.5 cursor-pointer transition-all"
                >
                  LƯU THAY ĐỔI
                </button>
              </div>
            </div>
          )}

          {/* 3. KHÓA HỌC */}
          {activeSection === 'courses' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <h1 className="text-2xl font-[900] text-[#4b4b4b] tracking-tight">Khóa học</h1>
              <p className="text-xs font-bold text-[#afafaf]">Khóa học ngôn ngữ bạn đang theo học.</p>

              <div className="p-5 rounded-2xl bg-[#f0fff0] border-2 border-[#58cc02]/30 flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <span className="text-3xl drop-shadow-xs">{stats.activeCourseFlag || '🇬🇧'}</span>
                  <div>
                    <h3 className="font-[900] text-base text-[#4b4b4b]">{stats.activeCourseTitle || 'Tiếng Anh Phổ Thông'}</h3>
                    <span className="text-xs font-black text-[#58cc02] uppercase tracking-wider">Đang theo học</span>
                  </div>
                </div>
                <a
                  href="#/courses"
                  onClick={playClickSound}
                  className="px-4 py-2.5 bg-[#58cc02] hover:bg-[#46a302] text-white font-[900] text-xs uppercase tracking-wider rounded-xl shadow-xs border-b-2 border-[#3b8a01] active:translate-y-0.5"
                >
                  Đổi khóa học
                </a>
              </div>
            </div>
          )}

          {/* 4. HỌC ĐƯỜNG & LỚP HỌC */}
          {activeSection === 'schools' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <h1 className="text-2xl font-[900] text-[#4b4b4b] tracking-tight">Học đường & Lớp học</h1>
              <p className="text-xs font-bold text-[#afafaf]">Tham gia lớp học của giáo viên bằng mã lớp để làm bài tập riêng.</p>

              <div className="p-6 bg-[#f7f7f7] rounded-[24px] border-2 border-[#e5e5e5] space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-[900] text-[#777] uppercase tracking-wider">Mã lớp học (Classroom Code)</label>
                  <input
                    type="text"
                    value={classCode}
                    onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                    placeholder="VD: ENG-10A1"
                    className="w-full p-4 bg-white rounded-2xl border-2 border-[#e5e5e5] font-black text-sm uppercase text-[#4b4b4b] outline-none focus:border-[#1cb0f6]"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (classCode.trim()) {
                      playChestSound();
                      setJoinedClass(classCode.trim());
                      setClassCode('');
                    }
                  }}
                  className="w-full py-3.5 bg-[#1cb0f6] hover:bg-[#1899d6] text-white font-[900] text-xs uppercase tracking-wider rounded-xl shadow-xs border-b-4 border-[#0b78ad] active:translate-y-0.5 cursor-pointer"
                >
                  THAM GIA LỚP HỌC
                </button>

                {joinedClass && (
                  <p className="text-xs font-black text-[#58cc02] flex items-center gap-1.5 pt-1">
                    <Check size={16} /> Đã tham gia lớp: <strong>{joinedClass}</strong>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 5. THÔNG BÁO */}
          {activeSection === 'notifications' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <h1 className="text-2xl font-[900] text-[#4b4b4b] tracking-tight">Thông báo</h1>
              <p className="text-xs font-bold text-[#afafaf]">Quản lý các thông báo nhắc nhở rèn luyện mỗi ngày.</p>

              <div className="space-y-5 pt-2">
                <div className="flex items-center justify-between gap-4 py-2 border-b border-[#f0f0f0]">
                  <div>
                    <span className="font-[900] text-base text-[#4b4b4b] block">Nhắc nhở học tập hàng ngày</span>
                    <span className="text-xs font-bold text-[#afafaf]">Gửi thông báo khi chưa hoàn thành bài học trong ngày</span>
                  </div>
                  <ToggleSwitch checked={notifDaily} onChange={() => handleToggle(setNotifDaily, notifDaily)} />
                </div>

                <div className="flex items-center justify-between gap-4 py-2 border-b border-[#f0f0f0]">
                  <div>
                    <span className="font-[900] text-base text-[#4b4b4b] block">Cảnh báo đóng băng chuỗi Streak</span>
                    <span className="text-xs font-bold text-[#afafaf]">Nhắc nhở kịp thời trước 23:59 để giữ chuỗi ngày</span>
                  </div>
                  <ToggleSwitch checked={notifStreak} onChange={() => handleToggle(setNotifStreak, notifStreak)} />
                </div>

                <div className="flex items-center justify-between gap-4 py-2 border-b border-[#f0f0f0]">
                  <div>
                    <span className="font-[900] text-base text-[#4b4b4b] block">Báo cáo tổng kết tuần</span>
                    <span className="text-xs font-bold text-[#afafaf]">Gửi thống kê số từ vựng mới và điểm EXP đã đạt được trong tuần</span>
                  </div>
                  <ToggleSwitch checked={notifWeekly} onChange={() => handleToggle(setNotifWeekly, notifWeekly)} />
                </div>
              </div>
            </div>
          )}

          {/* 6. GÓI ĐĂNG KÝ */}
          {activeSection === 'subscription' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <h1 className="text-2xl font-[900] text-[#4b4b4b] tracking-tight">Gói Eng AI PRO Trọn Đời</h1>
              <p className="text-xs font-bold text-[#afafaf]">Đặc quyền học tập cao cấp không giới hạn thời gian.</p>

              <div className="p-6 rounded-[28px] bg-gradient-to-br from-[#1cb0f6] to-[#ce82ff] text-white space-y-4 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="px-3.5 py-1 bg-white/20 rounded-full font-black text-xs uppercase tracking-wider">Eng AI PRO Lifetime</span>
                  <span className="px-3 py-1 bg-white text-[#58cc02] rounded-full font-black text-xs">Đã kích hoạt vĩnh viễn</span>
                </div>
                <div>
                  <h3 className="text-2xl font-[900]">Gói Trọn Đời Đang Hoạt Động</h3>
                  <p className="text-xs font-bold opacity-90 mt-1">Vô hạn Trái Tim, sửa lỗi ngữ pháp nâng cao và phân tích phát âm cùng AI Alex vĩnh viễn không thời hạn.</p>
                </div>
                <a
                  href="#/pro"
                  onClick={playClickSound}
                  className="block w-full py-3.5 bg-white hover:bg-gray-100 text-[#1cb0f6] text-center font-[900] text-xs uppercase tracking-wider rounded-xl shadow-xs transition-colors"
                >
                  Xem chi tiết đặc quyền Trọn Đời
                </a>
              </div>
            </div>
          )}

          {/* 7. HỖ TRỢ / TRUNG TÂM TRỢ GIÚP */}
          {activeSection === 'support' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <h1 className="text-2xl font-[900] text-[#4b4b4b] tracking-tight">Trung tâm trợ giúp</h1>
              <p className="text-xs font-bold text-[#afafaf]">Giải đáp các thắc mắc thường gặp khi học tập.</p>

              <div className="space-y-3">
                <div className="p-4 bg-[#f7f7f7] rounded-2xl border-2 border-[#e5e5e5] space-y-1">
                  <h4 className="font-[900] text-sm text-[#4b4b4b]">Làm sao để duy trì chuỗi Streak?</h4>
                  <p className="text-xs font-bold text-[#777]">Hãy hoàn thành ít nhất 1 bài học mỗi ngày trước 23:59. Bạn cũng có thể dùng Đóng Băng Streak tại Cửa Hàng để bảo vệ chuỗi ngày.</p>
                </div>
                <div className="p-4 bg-[#f7f7f7] rounded-2xl border-2 border-[#e5e5e5] space-y-1">
                  <h4 className="font-[900] text-sm text-[#4b4b4b]">Hồi phục Tim như thế nào?</h4>
                  <p className="text-xs font-bold text-[#777]">Tim sẽ được hồi phục khi bạn hoàn thành bài học ôn luyện hoặc dùng 50 Đá Quý (Gems) tại Cửa Hàng.</p>
                </div>
                <div className="p-4 bg-[#f7f7f7] rounded-2xl border-2 border-[#e5e5e5] space-y-1">
                  <h4 className="font-[900] text-sm text-[#4b4b4b]">Dữ liệu học tập có được lưu không?</h4>
                  <p className="text-xs font-bold text-[#777]">Tiến độ học tập, bài học đã hoàn thành và từ vựng trong sổ tay được lưu tự động trên thiết bị của bạn.</p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* RIGHT NAVIGATION MENU (DESKTOP ONLY) */}
        <div className="hidden lg:block w-72 shrink-0 space-y-4">
          
          <div className="bg-white rounded-[24px] border-2 border-[#e5e5e5] p-5 shadow-xs">
            <h3 className="font-[900] text-base text-[#4b4b4b] mb-3">
              Cài đặt học tập
            </h3>
            <div className="space-y-1">
              {[
                { id: 'preferences', label: 'Tùy chọn học tập' },
                { id: 'accessibility', label: 'Trợ năng Khiếm thị (0ms TTS)' },
                { id: 'academic', label: 'Lộ trình & Mục tiêu' },
                { id: 'courses', label: 'Khóa học ngôn ngữ' },
                { id: 'schools', label: 'Học đường & Lớp học' },
                { id: 'notifications', label: 'Thông báo nhắc nhở' },
              ].map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      playClickSound();
                      setActiveSection(item.id as SettingsSection);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl font-[900] text-sm transition-all cursor-pointer block ${
                      isActive
                        ? 'bg-[#f0f9ff] text-[#1cb0f6]'
                        : 'text-[#777] hover:text-[#4b4b4b] hover:bg-[#f7f7f7]'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-[24px] border-2 border-[#e5e5e5] p-5 shadow-xs">
            <h3 className="font-[900] text-base text-[#4b4b4b] mb-3">
              Gói dịch vụ
            </h3>
            <button
              type="button"
              onClick={() => {
                playClickSound();
                setActiveSection('subscription');
              }}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl font-[900] text-sm transition-all cursor-pointer block ${
                activeSection === 'subscription'
                  ? 'bg-[#f0f9ff] text-[#1cb0f6]'
                  : 'text-[#777] hover:text-[#4b4b4b] hover:bg-[#f7f7f7]'
              }`}
            >
              Nâng cấp Eng AI PRO
            </button>
          </div>

          <div className="bg-white rounded-[24px] border-2 border-[#e5e5e5] p-5 shadow-xs">
            <h3 className="font-[900] text-base text-[#4b4b4b] mb-3">
              Trợ giúp
            </h3>
            <button
              type="button"
              onClick={() => {
                playClickSound();
                setActiveSection('support');
              }}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl font-[900] text-sm transition-all cursor-pointer block ${
                activeSection === 'support'
                  ? 'bg-[#f0f9ff] text-[#1cb0f6]'
                  : 'text-[#777] hover:text-[#4b4b4b] hover:bg-[#f7f7f7]'
              }`}
            >
              Trung tâm trợ giúp
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
