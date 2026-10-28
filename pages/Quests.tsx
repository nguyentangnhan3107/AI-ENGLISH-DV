import React, { useState } from 'react';
import { UserStats } from '../types';
import { Target, Zap, Award, CheckCircle2, Star, Sparkles, Clock } from 'lucide-react';
import { playChestSound } from '../services/soundEffects';

interface QuestsProps {
  stats: UserStats;
  onUpdateProfile: (d: Partial<UserStats>) => void;
}

export default function Quests({ stats, onUpdateProfile }: QuestsProps) {
  const [claimedQuests, setClaimedQuests] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('linguist_claimed_quests') || '[]');
    } catch (e) {
      return [];
    }
  });

  const dailyQuests = [
    {
      id: 'q1',
      title: 'Kiếm 50 EXP hôm nay',
      current: Math.min(stats.exp || 0, 50),
      target: 50,
      reward: 20,
      rewardType: 'Gems',
      desc: 'Hoàn thành bài học hoặc luyện tập để nhận EXP.'
    },
    {
      id: 'q2',
      title: 'Hoàn thành 1 bài học bất kỳ',
      current: Math.min((stats.completedLessons || []).length, 1),
      target: 1,
      reward: 15,
      rewardType: 'Gems',
      desc: 'Học một bài học hội thoại hoặc 20 câu hỏi chuyên sâu.'
    },
    {
      id: 'q3',
      title: 'Đạt chuỗi Streak 3 ngày',
      current: Math.min(stats.streak || 0, 3),
      target: 3,
      reward: 30,
      rewardType: 'Gems',
      desc: 'Duy trì học tiếng Anh đều đặn mỗi ngày.'
    },
    {
      id: 'q4',
      title: 'Ghi nhớ 5 từ vựng mới',
      current: Math.min((stats.learnedWords || []).length, 5),
      target: 5,
      reward: 25,
      rewardType: 'Gems',
      desc: 'Hoàn thành câu hỏi ghép thẻ từ vựng trong bài.'
    }
  ];

  const handleClaim = (qId: string, rewardGems: number) => {
    playChestSound();
    const updated = [...claimedQuests, qId];
    setClaimedQuests(updated);
    localStorage.setItem('linguist_claimed_quests', JSON.stringify(updated));
    onUpdateProfile({
      gems: (stats.gems || 100) + rewardGems
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-8 py-4 md:py-8 space-y-5 sm:space-y-8 pb-28 md:pb-32 overflow-x-hidden">
      {/* Banner phong cách Từ điển Táo */}
      <div className="bg-[#ff9600] shadow-[0_6px_0_0_#d97706] sm:shadow-[0_8px_0_0_#d97706] rounded-[24px] sm:rounded-[30px] md:rounded-[40px] p-5 sm:p-6 md:p-12 text-white relative overflow-hidden transition-all">
        <div className="relative z-10 space-y-3 sm:space-y-4">
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-[900] leading-tight">Nhiệm Vụ Hằng Ngày</h1>
          <p className="text-xs sm:text-base md:text-lg font-bold opacity-90 max-w-xl">
            Hoàn thành các nhiệm vụ mỗi ngày để nhận Đá Quý (Gems) và nâng cấp sức mạnh học tập!
          </p>
          <div className="flex flex-wrap gap-2 sm:gap-3 mt-3 sm:mt-8">
            <div className="bg-white/20 px-3.5 py-1.5 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl backdrop-blur-md font-black text-[10px] md:text-xs uppercase tracking-wider flex items-center gap-1.5 sm:gap-2">
              <CheckCircle2 size={14} /> Hoàn thành: {claimedQuests.length} / {dailyQuests.length} nhiệm vụ
            </div>
            <div className="bg-white/30 px-3.5 py-1.5 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl backdrop-blur-md font-black text-[10px] md:text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={14} /> Thử thách Tháng 10
            </div>
          </div>
        </div>
        <Target className="absolute right-[-20px] top-[-20px] text-white/10 w-40 h-40 sm:w-48 sm:h-48 md:w-64 md:h-64 pointer-events-none select-none" />
      </div>

      {/* Monthly Challenge Banner */}
      <div className="p-5 sm:p-6 md:p-8 bg-gradient-to-r from-[#ce82ff] to-[#a855f7] rounded-[24px] sm:rounded-[32px] text-white shadow-xl space-y-3 sm:space-y-4 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="px-3.5 py-1 bg-white/20 rounded-full font-black text-xs uppercase tracking-wider">
            Thử thách Tháng 10
          </span>
          <span className="flex items-center gap-1.5 text-xs font-black text-white/90">
            <Clock size={15} /> Còn 28 ngày
          </span>
        </div>
        <div>
          <h2 className="text-2xl font-[900] leading-snug">Huy hiệu Siêu Cấp Mùa Thu</h2>
          <p className="text-sm font-bold opacity-90 mt-1">Hoàn thành 15 nhiệm vụ để mở khóa Huy hiệu Táo Đỏ Danh Giá!</p>
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-black">
            <span>Tiến độ thử thách</span>
            <span>{claimedQuests.length} / 15 nhiệm vụ</span>
          </div>
          <div className="h-3.5 bg-black/20 rounded-full overflow-hidden p-0.5">
            <div 
              className="bg-[#58cc02] h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.min((claimedQuests.length / 15) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Quests List */}
      <div className="space-y-4">
        <h3 className="text-lg font-[900] text-[#4b4b4b] uppercase tracking-wider ml-1">
          Nhiệm vụ hôm nay
        </h3>

        <div className="grid gap-4">
          {dailyQuests.map((q) => {
            const isCompleted = q.current >= q.target;
            const isClaimed = claimedQuests.includes(q.id);
            const percent = Math.min((q.current / q.target) * 100, 100);

            return (
              <div 
                key={q.id}
                className="bg-white rounded-[24px] sm:rounded-[28px] p-4 sm:p-5 md:p-6 border-2 sm:border-4 border-[#f0f0f0] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4"
              >
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                      isClaimed 
                        ? 'bg-[#f0fff0] text-[#58cc02]' 
                        : isCompleted 
                          ? 'bg-[#fff0f0] text-[#ff4b4b]' 
                          : 'bg-[#f7f7f7] text-[#afafaf]'
                    }`}>
                      {isClaimed ? <CheckCircle2 size={22} /> : <Award size={22} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-black text-sm sm:text-base text-[#4b4b4b] leading-tight">
                        {q.title}
                      </h4>
                      <p className="text-xs font-bold text-[#afafaf] mt-0.5 line-clamp-1 sm:line-clamp-none">
                        {q.desc}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1 pl-1 sm:pl-13">
                    <div className="flex justify-between text-[11px] font-black text-[#afafaf] uppercase">
                      <span>{q.current} / {q.target}</span>
                      <span>{Math.round(percent)}%</span>
                    </div>
                    <div className="h-3 bg-[#f0f0f0] rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          isCompleted ? 'bg-[#58cc02]' : 'bg-[#1cb0f6]'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="w-full sm:w-auto sm:shrink-0 flex items-center justify-end sm:justify-center pt-1 sm:pt-0 border-t sm:border-t-0 border-[#f0f0f0]">
                  {isClaimed ? (
                    <span className="w-full sm:w-auto px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl sm:rounded-2xl bg-[#f0fff0] text-[#46a302] font-black text-xs uppercase tracking-wider inline-flex items-center justify-center gap-1.5 border border-[#58cc02]/20">
                      <CheckCircle2 size={15} /> Đã nhận
                    </span>
                  ) : isCompleted ? (
                    <button
                      type="button"
                      onClick={() => handleClaim(q.id, q.reward)}
                      className="w-full sm:w-auto px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl bg-[#ffc800] hover:bg-[#e5a500] text-white font-[900] text-xs uppercase tracking-widest shadow-md active:translate-y-0.5 border-b-4 border-[#b8860b] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Sparkles size={16} /> Nhận +{q.reward} Gems
                    </button>
                  ) : (
                    <span className="w-full sm:w-auto px-4 py-2 rounded-xl sm:rounded-2xl bg-[#f7f7f7] text-[#afafaf] font-black text-xs uppercase tracking-wider border border-[#e5e5e5] inline-flex items-center justify-center gap-1.5">
                      +{q.reward} Gems
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
