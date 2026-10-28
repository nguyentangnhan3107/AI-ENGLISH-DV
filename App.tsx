import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { 
  Home, 
  Zap, 
  Star, 
  BookOpen, 
  ShieldCheck, 
  Target, 
  Settings as SettingsIcon, 
  MessageSquareText, 
  Brain,
  Gem,
  Heart,
  Flame,
  Infinity as InfinityIcon,
  Compass,
  Volume2,
  VolumeX,
  Mic
} from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Practice from './pages/Practice';
import PronunciationPractice from './pages/PronunciationPractice';
import Vocabulary from './pages/Vocabulary';
import Copyright from './pages/Copyright';
import SettingsPage from './pages/Settings';
import Shop from './pages/Shop';
import Quests from './pages/Quests';
import ProPurchase from './pages/ProPurchase';
import { UserStats } from './types';
import AccessibilityLayer from './components/AccessibilityLayer';
import { playClickSound } from './services/soundEffects';
import { 
  setAccessibilityMode, 
  isAccessibilityMode, 
  announceAccessibility,
  toggleAccessibilityMode 
} from './services/ttsService';

export const APP_LOGO_URL = "https://lh3.googleusercontent.com/d/19mMFEfd-G60JuqIJ56143WOfl1FYgzVT";

const DEFAULT_LEARNING_STATS: UserStats = {
  id: 'learner-guest',
  name: 'Học viên',
  email: '',
  level: 1,
  exp: 120,
  streak: 3,
  hearts: 999,
  gems: 500,
  isPro: true,
  accessibilityMode: false,
  accessibilityVoiceSpeed: 1.0,
  grade: '10',
  studyMode: 'regular',
  targetBand: '6.5',
  activeCourseId: 'en',
  activeCourseTitle: 'Tiếng Anh',
  activeCourseFlag: '🇬🇧',
  lastActive: new Date().toISOString(),
  learnedWords: [],
  completedLessons: [],
  isAdmin: false
};

const SidebarLeft = ({ isAdmin }: { isAdmin?: boolean }) => {
  const location = useLocation();
  const navItems = [
    { name: 'Học', icon: Home, path: '/', color: 'text-[#58cc02]', activeBg: 'bg-[#f0fff0] border-[#58cc02]/30 text-[#58cc02]' },
    { name: 'Nhiệm vụ', icon: Target, path: '/quests', color: 'text-[#ff9600]', activeBg: 'bg-[#fff7ed] border-[#ff9600]/30 text-[#ff9600]' },
    { name: 'Cửa hàng', icon: Gem, path: '/shop', color: 'text-[#1cb0f6]', activeBg: 'bg-[#f0f9ff] border-[#1cb0f6]/30 text-[#1cb0f6]' },
    { name: 'Từ điển Táo', icon: BookOpen, path: '/vocabulary', color: 'text-[#ff4b4b]', activeBg: 'bg-[#fff0f0] border-[#ff4b4b]/30 text-[#ff4b4b]' },
    { name: 'Trò chuyện', icon: MessageSquareText, path: '/practice', color: 'text-[#00cd9c]', activeBg: 'bg-[#ecfdf5] border-[#00cd9c]/30 text-[#00cd9c]' },
    { name: 'Luyện phát âm', icon: Mic, path: '/pronunciation', color: 'text-[#ce82ff]', activeBg: 'bg-[#fbf0ff] border-[#ce82ff]/30 text-[#ce82ff]' },
  ];

  if (isAdmin) {
    navItems.push({ name: 'Quản trị', icon: ShieldCheck, path: '/copyright', color: 'text-[#ff4b4b]', activeBg: 'bg-[#fff0f0] border-[#ff4b4b]/30 text-[#ff4b4b]' });
  }

  return (
    <div className="hidden lg:flex flex-col w-64 h-screen fixed left-0 top-0 border-r-4 border-[#f0f0f0] bg-white p-5 pt-8 z-[101]">
      {/* Brand Logo & Name */}
      <div className="mb-8 px-3">
        <Link to="/" onClick={playClickSound} className="flex items-center gap-3 group select-none">
          <div className="w-12 h-12 shrink-0 flex items-center justify-center">
            <img 
              src={APP_LOGO_URL} 
              className="w-full h-full object-contain pointer-events-none select-none" 
              draggable={false}
              alt="Eng AI Logo" 
            />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-[900] text-[#58cc02] tracking-tight leading-none">
              Eng AI
            </span>
            <span className="text-[11px] font-black uppercase text-[#1cb0f6] tracking-wider mt-1">
              For Learn
            </span>
          </div>
        </Link>
      </div>
      
      {/* Navigation Items */}
      <nav className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              onClick={playClickSound}
              className={`flex items-center gap-4 px-4 py-3.5 rounded-[22px] transition-all font-[900] uppercase text-xs tracking-wider border-2 ${
                isActive 
                  ? `${item.activeBg} shadow-sm` 
                  : 'text-[#777] border-transparent hover:bg-[#f7f7f7] hover:border-[#e5e5e5]'
              }`}
            >
              <item.icon size={24} strokeWidth={isActive ? 3 : 2.5} className={isActive ? 'scale-105' : ''} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Settings Link at bottom */}
      <div className="pt-4 border-t-2 border-[#f0f0f0]">
        <Link 
          to="/settings"
          onClick={playClickSound}
          className={`w-full flex items-center gap-3.5 px-4 py-3 font-[900] text-xs uppercase tracking-wider transition-all rounded-[20px] border-2 ${
            location.pathname === '/settings' 
              ? 'bg-[#f7f7f7] border-[#e5e5e5] text-[#4b4b4b]' 
              : 'text-[#afafaf] border-transparent hover:text-[#4b4b4b] hover:bg-[#f7f7f7]'
          }`}
        >
          <SettingsIcon size={20} /> Cài đặt
        </Link>
      </div>
    </div>
  );
};

const BottomNav = ({ isAdmin }: { isAdmin?: boolean }) => {
  const location = useLocation();
  const navItems = [
    { name: 'Học', icon: Home, path: '/', color: 'text-[#58cc02]' },
    { name: 'Trò chuyện', icon: MessageSquareText, path: '/practice', color: 'text-[#00cd9c]' },
    { name: 'Phát âm', icon: Mic, path: '/pronunciation', color: 'text-[#ce82ff]' },
    { name: 'Nhiệm vụ', icon: Target, path: '/quests', color: 'text-[#ff9600]' },
    { name: 'Từ điển', icon: BookOpen, path: '/vocabulary', color: 'text-[#ff4b4b]' },
    { name: 'Cửa hàng', icon: Gem, path: '/shop', color: 'text-[#1cb0f6]' },
  ];

  if (isAdmin) {
    navItems.splice(4, 0, { name: 'Admin', icon: ShieldCheck, path: '/copyright', color: 'text-[#ff4b4b]' });
  }

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t-2 border-[#e5e5e5] h-16 px-1 flex items-center justify-around z-[101] pb-[max(4px,env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.name}
            to={item.path}
            onClick={playClickSound}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all relative select-none ${
              isActive ? `${item.color} font-[900]` : 'text-[#8e8e93] hover:text-[#4b4b4b]'
            }`}
          >
            {isActive && <div className="absolute -top-[5px] w-6 h-1 bg-current rounded-full"></div>}
            <item.icon size={20} strokeWidth={isActive ? 3 : 2.2} />
            <span className={`text-[9px] font-black uppercase tracking-tight mt-0.5 ${isActive ? 'opacity-100' : 'opacity-70'}`}>
              {item.name}
            </span>
          </Link>
        );
      })}
    </nav>
  );
};

const Header = ({ 
  stats, 
  onUpdateProfile 
}: { 
  stats: UserStats; 
  onUpdateProfile: (d: Partial<UserStats>) => void; 
}) => {
  return (
    <header className="h-14 sm:h-16 md:h-20 flex items-center justify-between px-2 sm:px-4 md:px-8 bg-white border-b-2 sm:border-b-4 border-[#f0f0f0] sticky top-0 z-[102] w-full max-w-full overflow-hidden">
      {/* Course Flag Selector */}
      <div className="flex items-center gap-1 sm:gap-2.5 shrink-0 min-w-0">
        <div className="w-7 h-7 sm:w-9 sm:h-9 shrink-0 lg:hidden flex items-center justify-center">
          <img 
            src={APP_LOGO_URL} 
            className="w-full h-full object-contain pointer-events-none select-none" 
            draggable={false} 
            alt="Logo" 
          />
        </div>

      </div>
      
      {/* Right Stats Bar: Streak Flame, Gems, Hearts, Settings */}
      <div className="flex items-center gap-1 sm:gap-2 md:gap-3 shrink-0">
        {/* Streak Flame */}
        <Link 
          to="/quests" 
          onClick={playClickSound}
          className="flex items-center gap-0.5 sm:gap-1 text-[#ff9600] font-[900] text-[11px] sm:text-sm px-1.5 py-1 sm:px-2.5 sm:py-1.5 bg-[#fffbf0] hover:bg-[#fff7e6] rounded-xl border border-[#ff9600]/25 shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
          title="Chuỗi ngày Streak"
        >
          <Flame size={14} fill="currentColor" className="shrink-0 sm:w-4 sm:h-4" />
          <span>{stats.streak || 3}</span>
        </Link>

        {/* Gems / Lingots */}
        <Link 
          to="/shop" 
          onClick={playClickSound}
          className="flex items-center gap-0.5 sm:gap-1 text-[#1cb0f6] font-[900] text-[11px] sm:text-sm px-1.5 py-1 sm:px-2.5 sm:py-1.5 bg-[#f0f9ff] hover:bg-[#e6f4fc] rounded-xl border border-[#1cb0f6]/25 shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
          title="Đá Quý (Gems)"
        >
          <Gem size={14} fill="currentColor" className="shrink-0 sm:w-4 sm:h-4" />
          <span>{stats.gems ?? 150}</span>
        </Link>

        {/* Hearts - Eng AI PRO Lifetime */}
        <Link 
          to="/pro" 
          onClick={playClickSound}
          className="flex items-center gap-0.5 sm:gap-1 text-[#ff4b4b] font-[900] text-[11px] sm:text-sm px-1.5 py-1 sm:px-2.5 sm:py-1.5 bg-[#fff0f0] hover:bg-[#ffe6e6] rounded-xl border border-[#ff4b4b]/25 shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
          title="Eng AI PRO Trọn Đời - Vô hạn Tim"
        >
          <Heart size={14} fill="currentColor" className="shrink-0 sm:w-4 sm:h-4" />
          <InfinityIcon size={14} strokeWidth={3} className="shrink-0 sm:w-4 sm:h-4" />
        </Link>

        {/* Visually Impaired Accessibility Voice Toggle */}
        <button
          type="button"
          onClick={() => {
            playClickSound();
            const nextMode = !stats.accessibilityMode;
            onUpdateProfile({ accessibilityMode: nextMode });
            setAccessibilityMode(nextMode);
          }}
          className={`p-1 sm:p-1.5 rounded-xl transition-all cursor-pointer shrink-0 flex items-center gap-1 border-2 ${
            stats.accessibilityMode
              ? 'bg-[#1cb0f6] text-white border-[#1899d6] shadow-sm animate-pulse'
              : 'text-[#777] hover:text-[#4b4b4b] hover:bg-[#f7f7f7] border-transparent'
          }`}
          title={stats.accessibilityMode ? "Trợ năng khiếm thị ĐANG BẬT (Nhấn để tắt hoặc bấm Alt+V)" : "Bật Trợ năng khiếm thị (Tự động đọc giọng nói tức thì 0ms - Alt+V)"}
          aria-label={stats.accessibilityMode ? "Tắt trợ năng khiếm thị" : "Bật trợ năng khiếm thị"}
        >
          {stats.accessibilityMode ? <Volume2 size={16} className="text-white" /> : <Volume2 size={16} />}
        </button>

        {/* Quick Settings Link */}
        <Link
          to="/settings"
          onClick={playClickSound}
          className="p-1 sm:p-2 text-[#777] hover:text-[#4b4b4b] hover:bg-[#f7f7f7] rounded-xl transition-all cursor-pointer shrink-0"
          title="Cài đặt học tập"
        >
          <SettingsIcon size={17} />
        </Link>
      </div>
    </header>
  );
};

interface AppContentProps {
  user: UserStats;
  setUser: React.Dispatch<React.SetStateAction<UserStats>>;
  updateProfile: (d: Partial<UserStats>) => void;
  isLessonMode: boolean;
  setIsLessonMode: React.Dispatch<React.SetStateAction<boolean>>;
}

const AppContent: React.FC<AppContentProps> = ({
  user,
  setUser,
  updateProfile,
  isLessonMode,
  setIsLessonMode
}) => {
  const location = useLocation();
  const isProPage = location.pathname === '/pro';
  const isChatPage = location.pathname === '/practice' || location.pathname === '/chat';
  const hideChrome = isLessonMode || isProPage;

  // Sync custom event if changed from settings or service
  useEffect(() => {
    const handleModeChange = (e: any) => {
      if (e.detail && e.detail.enabled !== user.accessibilityMode) {
        updateProfile({ accessibilityMode: e.detail.enabled });
      }
    };
    window.addEventListener('accessibility_mode_change', handleModeChange);
    return () => window.removeEventListener('accessibility_mode_change', handleModeChange);
  }, [user.accessibilityMode, updateProfile]);

  // Voice announcement on page navigation for visually impaired users (zero delay)
  useEffect(() => {
    if (!user.accessibilityMode) return;
    const pathDescriptions: Record<string, string> = {
      '/': 'Trang Bài học chính. Lộ trình chinh phục ngôn ngữ.',
      '/quests': 'Trang Nhiệm vụ hàng ngày.',
      '/shop': 'Trang Cửa hàng vật phẩm và bảo vệ chuỗi ngày.',
      '/pro': 'Trang Đặc quyền Eng AI PRO Trọn Đời.',
      '/practice': 'Trang Trò chuyện luyện nói cùng Alex AI.',
      '/pronunciation': 'Trang luyện phát âm tiếng Anh theo trình độ.',
      '/vocabulary': 'Trang Sổ tay từ vựng và từ điển Táo.',
      '/settings': 'Trang Cài đặt hệ thống.',
    };
    const desc = pathDescriptions[location.pathname] || 'Chuyển trang thành công.';
    announceAccessibility(desc);
  }, [location.pathname, user.accessibilityMode]);

  return (
    <div className={`flex ${isProPage ? 'bg-[#0d1629]' : 'bg-[#fffdfa]'} h-screen w-full max-w-full overflow-hidden`}>
      {!hideChrome && <SidebarLeft isAdmin={user.isAdmin} />}
      <div className={`flex-1 flex flex-col h-screen w-full max-w-full overflow-hidden ${hideChrome ? 'ml-0' : 'lg:ml-64'} ${isProPage ? 'bg-[#0d1629]' : 'bg-white'} shadow-2xl relative z-10 transition-all duration-500`}>
        {!hideChrome && <Header stats={user} onUpdateProfile={updateProfile} />}
        <main id="main-content" tabIndex={-1} aria-label="Nội dung chính" className={`flex-1 w-full max-w-full ${isChatPage ? 'overflow-hidden pb-16 lg:pb-0' : 'overflow-y-auto ' + (hideChrome ? 'pb-0' : 'pb-20 lg:pb-10')} ${isProPage ? 'bg-[#0d1629]' : 'bg-[#fffdfa]/50'}`}>
          <div className={`${hideChrome || isChatPage ? 'max-w-none' : 'max-w-6xl'} mx-auto h-full w-full max-w-full`}>
            <Routes>
              <Route path="/" element={<Dashboard stats={user} onUpdateProfile={updateProfile} setIsLessonMode={setIsLessonMode} />} />
              <Route path="/leaderboard" element={<Navigate to="/" replace />} />
              <Route path="/quests" element={<Quests stats={user} onUpdateProfile={updateProfile} />} />
              <Route path="/shop" element={<Shop stats={user} onUpdateProfile={updateProfile} />} />
              <Route path="/pro" element={<ProPurchase stats={user} onUpdateProfile={updateProfile} />} />
              <Route path="/practice" element={<Practice stats={user} onUpdateProfile={updateProfile} onComplete={(exp) => setUser(s => ({...s, exp: s.exp + exp, gems: (s.gems || 150) + 20}))} />} />
              <Route path="/pronunciation" element={<PronunciationPractice />} />
              <Route path="/chat" element={<Navigate to="/practice" replace />} />
              <Route path="/vocabulary" element={<Vocabulary stats={user} onUpdateProfile={updateProfile} />} />
              <Route path="/settings" element={<SettingsPage stats={user} onUpdateProfile={updateProfile} />} />
              <Route path="/copyright" element={user.isAdmin ? <Copyright stats={user} /> : <Navigate to="/" />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
        {!hideChrome && <BottomNav isAdmin={user.isAdmin} />}
      </div>

      <AccessibilityLayer
        enabled={!!user.accessibilityMode}
        onToggle={(next) => updateProfile({ accessibilityMode: next })}
      />
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<UserStats>(() => {
    try {
      const saved = localStorage.getItem('linguist_ai_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_LEARNING_STATS,
          ...parsed,
          isPro: true,
          hearts: 999,
          activeCourseId: parsed.activeCourseId || 'en',
          activeCourseTitle: parsed.activeCourseTitle || 'Tiếng Anh',
          activeCourseFlag: parsed.activeCourseFlag || '🇬🇧',
          gems: parsed.gems !== undefined ? parsed.gems : 500
        };
      }
      return DEFAULT_LEARNING_STATS;
    } catch (e) {
      return DEFAULT_LEARNING_STATS;
    }
  });

  const [isLessonMode, setIsLessonMode] = useState(false);

  useEffect(() => {
    localStorage.setItem('linguist_ai_user', JSON.stringify(user));
  }, [user]);

  const updateProfile = (d: Partial<UserStats>) => {
    setUser(s => ({...s, ...d}));
  };

  return (
    <HashRouter>
      <AppContent
        user={user}
        setUser={setUser}
        updateProfile={updateProfile}
        isLessonMode={isLessonMode}
        setIsLessonMode={setIsLessonMode}
      />
    </HashRouter>
  );
}
