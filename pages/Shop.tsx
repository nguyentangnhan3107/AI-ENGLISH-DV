import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserStats } from '../types';
import { Heart, Shield, Zap, Sparkles, Check, Gem, Infinity as InfinityIcon, Flame, X, ArrowRight } from 'lucide-react';
import { playChestSound, playClickSound } from '../services/soundEffects';

interface ShopProps {
  stats: UserStats;
  onUpdateProfile: (d: Partial<UserStats>) => void;
}

export default function Shop({ stats, onUpdateProfile }: ShopProps) {
  const navigate = useNavigate();
  const currentGems = stats.gems ?? 150;
  const currentHearts = stats.hearts ?? 5;
  const isPro = !!stats.isPro;
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleRefillHearts = () => {
    if (currentGems < 50 || currentHearts >= 5) return;
    playChestSound();
    onUpdateProfile({
      gems: currentGems - 50,
      hearts: 5
    });
    showToast("Đã hồi phục đầy 5 Tim! Hãy tiếp tục học tập nhé.");
  };

  const handleBuyStreakFreeze = () => {
    if (currentGems < 100) return;
    playChestSound();
    onUpdateProfile({
      gems: currentGems - 100
    });
    showToast("Đã trang bị Đóng Băng Streak! Chuỗi ngày của bạn được bảo vệ 1 ngày nếu lỡ quên.");
  };

  const handleBuyDoubleXP = () => {
    if (currentGems < 75) return;
    playChestSound();
    onUpdateProfile({
      gems: currentGems - 75
    });
    showToast("Đã kích hoạt Thần Dược 2X EXP! Nhận gấp đôi EXP trong bài học tiếp theo.");
  };

  const handleBuyStreakWager = () => {
    if (currentGems < 50) return;
    playChestSound();
    onUpdateProfile({
      gems: currentGems - 50
    });
    showToast("Đã đặt cược Streak 7 ngày! Duy trì chuỗi để nhận lại 100 Gems (+100%).");
  };

  const handleTogglePro = () => {
    playChestSound();
    onUpdateProfile({
      isPro: !isPro,
      hearts: 5
    });
    showToast(isPro ? "Đã chuyển về gói tiêu chuẩn." : "Chúc mừng bạn đã kích hoạt Super PRO vô hạn Tim!");
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-8 py-4 md:py-8 space-y-5 sm:space-y-8 pb-28 md:pb-32 relative overflow-x-hidden">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 sm:top-24 left-1/2 -translate-x-1/2 z-[250] bg-[#4b4b4b] text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl shadow-2xl font-[900] text-xs sm:text-sm flex items-center gap-2.5 max-w-[90vw] animate-in fade-in slide-in-from-top-4">
          <Sparkles size={16} className="text-[#ffc800] shrink-0" />
          <span className="truncate">{toastMessage}</span>
          <button 
            type="button" 
            onClick={() => setToastMessage(null)}
            className="text-white/60 hover:text-white ml-1 cursor-pointer shrink-0"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Banner phong cách Từ điển Táo */}
      <div className="bg-[#1cb0f6] shadow-[0_6px_0_0_#1899d6] sm:shadow-[0_8px_0_0_#1899d6] rounded-[24px] sm:rounded-[30px] md:rounded-[40px] p-5 sm:p-6 md:p-12 text-white relative overflow-hidden transition-all">
        <div className="relative z-10 space-y-3 sm:space-y-4">
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-[900] leading-tight">Cửa Hàng Vật Phẩm</h1>
          <p className="text-xs sm:text-base md:text-lg font-bold opacity-90 max-w-xl">
            Trang bị các vật phẩm hỗ trợ học tập, bảo vệ chuỗi Streak và nâng cấp sức mạnh cùng Eng AI.
          </p>
          <div className="flex flex-wrap gap-2 sm:gap-3 mt-3 sm:mt-8">
            <div className="bg-white/20 px-3.5 py-1.5 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl backdrop-blur-md font-black text-[10px] md:text-xs uppercase tracking-wider flex items-center gap-1.5 sm:gap-2">
              <Gem size={14} fill="currentColor" /> Số dư: {currentGems} Gems
            </div>
            <div className="bg-white/30 px-3.5 py-1.5 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl backdrop-blur-md font-black text-[10px] md:text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Heart size={14} fill="currentColor" /> {isPro ? 'Không giới hạn Tim (PRO)' : `${currentHearts} / 5 Tim`}
            </div>
          </div>
        </div>
        <Gem className="absolute right-[-20px] top-[-20px] text-white/10 w-40 h-40 sm:w-48 sm:h-48 md:w-64 md:h-64 pointer-events-none select-none" />
      </div>

      {/* Eng AI PRO Lifetime Card */}
      <div className="p-6 md:p-8 rounded-[36px] bg-gradient-to-br from-[#1cb0f6] via-[#ce82ff] to-[#ff4b4b] text-white shadow-2xl space-y-5 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="px-4 py-1.5 bg-white/20 rounded-full font-black text-xs uppercase tracking-widest flex items-center gap-1.5">
            <Sparkles size={14} /> Gói Trọn Đời (Lifetime)
          </span>
          <span className="px-3.5 py-1 bg-white text-[#58cc02] rounded-full font-black text-xs uppercase tracking-wider flex items-center gap-1 shadow-sm">
            <Check size={14} strokeWidth={3} /> Đã kích hoạt vĩnh viễn
          </span>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl md:text-3xl font-[900] tracking-tight">
            Eng AI PRO Trọn Đời (Lifetime Edition)
          </h2>
          <p className="text-sm font-bold opacity-90 leading-relaxed max-w-md">
            Gói PRO đang hoạt động trọn đời! Bạn được hưởng vô hạn số Tim, sửa lỗi sai bằng AI Alex và mở khóa toàn bộ đề thi AI vĩnh viễn.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={() => {
              playClickSound();
              navigate('/pro');
            }}
            className="w-full py-4 bg-white hover:bg-gray-100 text-[#1cb0f6] font-[900] text-sm md:text-base rounded-2xl shadow-xl uppercase tracking-widest cursor-pointer transition-all active:translate-y-0.5 border-b-4 border-gray-300 flex items-center justify-center gap-2"
          >
            <Sparkles size={18} />
            XEM CHI TIẾT ĐẶC QUYỀN PRO TRỌN ĐỜI
          </button>
        </div>
      </div>

      {/* Items Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-[900] text-[#4b4b4b] uppercase tracking-wider ml-1">
          Vật phẩm hỗ trợ
        </h3>

        <div className="grid gap-4">
          {/* Refill Hearts */}
          <div className="bg-white rounded-[24px] sm:rounded-[28px] p-4 sm:p-5 md:p-6 border-2 sm:border-4 border-[#f0f0f0] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#fff0f0] text-[#ff4b4b] flex items-center justify-center shrink-0 border-2 border-[#ff4b4b]/20">
                <Heart size={26} fill="currentColor" className="sm:w-[30px] sm:h-[30px]" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-black text-sm sm:text-base md:text-lg text-[#4b4b4b] leading-tight">
                  Hồi phục toàn bộ Tim
                </h4>
                <p className="text-xs font-bold text-[#afafaf] mt-0.5 line-clamp-2 sm:line-clamp-none">
                  Đầy lại 5 Tim ngay lập tức để tiếp tục học không giới hạn.
                </p>
                <div className="text-xs font-bold text-[#ff4b4b] mt-1">
                  Hiện có: {isPro ? 'Không giới hạn (PRO)' : `${currentHearts} / 5 Tim`}
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={isPro || currentHearts >= 5 || currentGems < 50}
              onClick={handleRefillHearts}
              className={`w-full sm:w-auto px-5 py-3 rounded-2xl font-[900] text-xs uppercase tracking-wider shrink-0 transition-all text-center flex items-center justify-center ${
                isPro || currentHearts >= 5
                  ? 'bg-[#f0fff0] text-[#58cc02] border border-[#58cc02]/20 cursor-default'
                  : currentGems >= 50
                    ? 'bg-[#ff4b4b] text-white hover:bg-[#d33030] shadow-md border-b-4 border-[#b92b2b] cursor-pointer active:translate-y-0.5'
                    : 'bg-[#f0f0f0] text-[#afafaf] cursor-not-allowed'
              }`}
            >
              {isPro ? (
                <span className="flex items-center gap-1"><InfinityIcon size={16} /> Vô hạn</span>
              ) : currentHearts >= 5 ? (
                "Đã đầy"
              ) : (
                "50 GEMS"
              )}
            </button>
          </div>

          {/* Streak Freeze */}
          <div className="bg-white rounded-[24px] sm:rounded-[28px] p-4 sm:p-5 md:p-6 border-2 sm:border-4 border-[#f0f0f0] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#f0f9ff] text-[#1cb0f6] flex items-center justify-center shrink-0 border-2 border-[#1cb0f6]/20">
                <Shield size={26} fill="currentColor" className="sm:w-[30px] sm:h-[30px]" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-black text-sm sm:text-base md:text-lg text-[#4b4b4b] leading-tight">
                  Đóng băng Streak
                </h4>
                <p className="text-xs font-bold text-[#afafaf] mt-0.5 line-clamp-2 sm:line-clamp-none">
                  Bảo vệ chuỗi học tập (Streak) của bạn an toàn nếu bạn bỏ lỡ 1 ngày.
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={currentGems < 100}
              onClick={handleBuyStreakFreeze}
              className={`w-full sm:w-auto px-5 py-3 rounded-2xl font-[900] text-xs uppercase tracking-wider shrink-0 transition-all text-center flex items-center justify-center ${
                currentGems >= 100
                  ? 'bg-[#1cb0f6] text-white hover:bg-[#0d95d6] shadow-md border-b-4 border-[#0b78ad] cursor-pointer active:translate-y-0.5'
                  : 'bg-[#f0f0f0] text-[#afafaf] cursor-not-allowed'
              }`}
            >
              100 GEMS
            </button>
          </div>

          {/* Double XP Boost */}
          <div className="bg-white rounded-[24px] sm:rounded-[28px] p-4 sm:p-5 md:p-6 border-2 sm:border-4 border-[#f0f0f0] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#fffbf0] text-[#ffc800] flex items-center justify-center shrink-0 border-2 border-[#ffc800]/20">
                <Zap size={26} fill="currentColor" className="sm:w-[30px] sm:h-[30px]" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-black text-sm sm:text-base md:text-lg text-[#4b4b4b] leading-tight">
                  Thần dược Nhân đôi EXP (2X)
                </h4>
                <p className="text-xs font-bold text-[#afafaf] mt-0.5 line-clamp-2 sm:line-clamp-none">
                  Nhận gấp đôi điểm kinh nghiệm (EXP) trong bài học tiếp theo để đua top nhanh chóng!
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={currentGems < 75}
              onClick={handleBuyDoubleXP}
              className={`w-full sm:w-auto px-5 py-3 rounded-2xl font-[900] text-xs uppercase tracking-wider shrink-0 transition-all text-center flex items-center justify-center ${
                currentGems >= 75
                  ? 'bg-[#ffc800] text-white hover:bg-[#e5a500] shadow-md border-b-4 border-[#c79100] cursor-pointer active:translate-y-0.5'
                  : 'bg-[#f0f0f0] text-[#afafaf] cursor-not-allowed'
              }`}
            >
              75 GEMS
            </button>
          </div>

          {/* 7-Day Streak Wager */}
          <div className="bg-white rounded-[24px] sm:rounded-[28px] p-4 sm:p-5 md:p-6 border-2 sm:border-4 border-[#f0f0f0] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#fff7ed] text-[#ff9600] flex items-center justify-center shrink-0 border-2 border-[#ff9600]/20">
                <Flame size={26} fill="currentColor" className="sm:w-[30px] sm:h-[30px]" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-black text-sm sm:text-base md:text-lg text-[#4b4b4b] leading-tight">
                  Cược Streak 7 ngày
                </h4>
                <p className="text-xs font-bold text-[#afafaf] mt-0.5 line-clamp-2 sm:line-clamp-none">
                  Đặt cược 50 Gems và nhận lại 100 Gems nếu bạn duy trì chuỗi Streak liên tục 7 ngày.
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={currentGems < 50}
              onClick={handleBuyStreakWager}
              className={`w-full sm:w-auto px-5 py-3 rounded-2xl font-[900] text-xs uppercase tracking-wider shrink-0 transition-all text-center flex items-center justify-center ${
                currentGems >= 50
                  ? 'bg-[#ff9600] text-white hover:bg-[#ea580c] shadow-md border-b-4 border-[#c2410c] cursor-pointer active:translate-y-0.5'
                  : 'bg-[#f0f0f0] text-[#afafaf] cursor-not-allowed'
              }`}
            >
              50 GEMS
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
