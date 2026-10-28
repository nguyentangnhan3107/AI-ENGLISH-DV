import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserStats } from '../types';
import { APP_LOGO_URL } from '../App';
import { 
  X, 
  Sparkles, 
  Check, 
  Heart, 
  Zap, 
  ShieldCheck, 
  Award, 
  ArrowRight, 
  Infinity as InfinityIcon, 
  CheckCircle2,
  Lock,
  Flame,
  Star,
  BookOpen,
  HelpCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { playClickSound } from '../services/soundEffects';

interface ProPurchaseProps {
  stats: UserStats;
  onUpdateProfile: (d: Partial<UserStats>) => void;
  onClose?: () => void;
}

const LIFETIME_PERKS = [
  {
    icon: Heart,
    color: 'text-[#ff4b4b]',
    bgColor: 'bg-[#fff0f0]',
    title: 'Trái Tim Vô Hạn (Infinite Hearts)',
    desc: 'Học tập không lo ngắt quãng. Thoải mái làm bài tập và luyện nói phát âm mà không sợ bị hết tim.'
  },
  {
    icon: Sparkles,
    color: 'text-[#1cb0f6]',
    bgColor: 'bg-[#f0f9ff]',
    title: 'Gia Sư AI Alex Cá Nhân Hóa',
    desc: 'Phân tích chi tiết mọi lỗi sai, giải thích ngữ pháp cặn kẽ và hướng dẫn mẹo làm bài chuẩn xác.'
  },
  {
    icon: Award,
    color: 'text-[#ce82ff]',
    bgColor: 'bg-[#faf5ff]',
    title: 'Mở Khóa Toàn Bộ Đề Thi AI (IELTS & THPTQG)',
    desc: 'Làm không giới hạn các đề thi AI chuẩn đề mẫu với chấm chữa và dự đoán band điểm tức thì.'
  },
  {
    icon: Zap,
    color: 'text-[#ffc800]',
    bgColor: 'bg-[#fffdf0]',
    title: 'Trung Tâm Luyện Lỗi Sai Độc Quyền',
    desc: 'Tự động tổng hợp những câu bạn từng làm sai thành bộ bài tập củng cố riêng biệt.'
  },
  {
    icon: Flame,
    color: 'text-[#ff9600]',
    bgColor: 'bg-[#fff7ed]',
    title: 'Tự Động Bảo Vệ Chuỗi Streak',
    desc: 'Tự động đóng băng streak khi bận và tham gia mọi vòng Thử Thách Huyền Thoại 0 Gems.'
  },
  {
    icon: ShieldCheck,
    color: 'text-[#58cc02]',
    bgColor: 'bg-[#f2fcf0]',
    title: '100% Không Quảng Cáo',
    desc: 'Tập trung tuyệt đối vào quá trình tiếp thu ngôn ngữ mà không bị làm phiền.'
  }
];

const FAQS = [
  {
    q: 'Gói Eng AI PRO Trọn Đời (Lifetime) hoạt động như thế nào?',
    a: 'Gói PRO Trọn Đời đã được kích hoạt vĩnh viễn trên thiết bị của bạn. Bạn được quyền sử dụng 100% các tính năng cao cấp nhất mà không cần trả phí hay gia hạn định kỳ.'
  },
  {
    q: 'Thời hạn sử dụng của gói này kéo dài bao lâu?',
    a: 'Thời hạn sử dụng là vĩnh viễn (Lifetime - Không giới hạn thời gian kết thúc). Mọi bản cập nhật bài học và tính năng AI mới đều sẽ tự động khả dụng.'
  },
  {
    q: 'Tôi có bị trừ tim khi làm bài sai không?',
    a: 'Không! Với đặc quyền Trái Tim Vô Hạn của gói PRO Trọn Đời, bạn có thể thoải mái thử sức, mắc lỗi và học hỏi từ các lời giải thích chi tiết của AI Alex mà không bao giờ mất lượt.'
  },
  {
    q: 'Dữ liệu học tập có được an toàn khi sử dụng không?',
    a: 'Toàn bộ tiến độ học tập, điểm EXP, chuỗi ngày Streak và từ vựng trong Sổ tay cá nhân được lưu trữ an toàn và bảo mật trên trình duyệt của bạn.'
  }
];

export default function ProPurchase({ stats, onUpdateProfile, onClose }: ProPurchaseProps) {
  const navigate = useNavigate();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const handleClose = () => {
    playClickSound();
    if (onClose) {
      onClose();
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1629] text-white selection:bg-[#1cb0f6] selection:text-white pb-36 relative overflow-x-hidden">
      {/* Cosmic Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-gradient-to-b from-[#1cb0f6]/20 via-[#ce82ff]/15 to-transparent blur-3xl pointer-events-none select-none" />
      <div className="absolute top-40 right-10 w-96 h-96 bg-[#ffc800]/10 rounded-full blur-3xl pointer-events-none select-none" />
      <div className="absolute top-80 left-10 w-96 h-96 bg-[#58cc02]/10 rounded-full blur-3xl pointer-events-none select-none" />

      {/* Top Bar */}
      <header className="sticky top-0 z-50 bg-[#0d1629]/80 backdrop-blur-xl border-b border-white/10 px-4 md:px-8 h-20 flex items-center justify-between">
        <button
          type="button"
          onClick={handleClose}
          className="w-11 h-11 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer border border-white/10 active:scale-95"
          title="Đóng trang đặc quyền"
        >
          <X size={24} />
        </button>

        {/* Center Brand Badge */}
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md">
          <Sparkles size={16} className="text-[#ffc800] animate-pulse" />
          <span className="font-[900] text-xs md:text-sm tracking-widest uppercase bg-gradient-to-r from-[#1cb0f6] via-[#ce82ff] to-[#ff4b4b] bg-clip-text text-transparent">
            Eng AI PRO Lifetime
          </span>
        </div>

        {/* Pro status */}
        <div className="text-right">
          <span className="px-3.5 py-1.5 bg-[#58cc02]/20 border border-[#58cc02]/40 text-[#58cc02] rounded-full font-black text-xs uppercase tracking-wider inline-flex items-center gap-1.5">
            <Check size={14} strokeWidth={3} /> Đã kích hoạt trọn đời
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 md:px-6 pt-8 md:pt-12 space-y-12 relative z-10">
        
        {/* HERO SECTION */}
        <div className="text-center space-y-6">
          {/* Mascot in Cosmic Badge */}
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#1cb0f6] via-[#ce82ff] to-[#ff4b4b] rounded-full blur-2xl opacity-70 animate-pulse pointer-events-none select-none" />
            <div className="w-28 h-28 md:w-36 md:h-36 mx-auto rounded-[36px] bg-gradient-to-b from-white/15 to-white/5 border-2 border-white/20 p-4 md:p-5 relative shadow-[0_20px_50px_rgba(28,176,246,0.3)] backdrop-blur-md flex items-center justify-center">
              <img
                src={APP_LOGO_URL}
                alt="Eng AI Pro Mascot"
                className="w-full h-full object-contain pointer-events-none select-none drop-shadow-[0_10px_20px_rgba(0,0,0,0.4)]"
                draggable={false}
              />
              <div className="absolute -top-2 -right-2 px-3 py-1 bg-gradient-to-r from-[#ffc800] to-[#ff9600] text-black font-black text-[10px] rounded-full shadow-lg uppercase tracking-wider border-2 border-white flex items-center gap-1">
                <Sparkles size={12} fill="currentColor" /> LIFETIME
              </div>
            </div>
          </div>

          <div className="space-y-3 max-w-2xl mx-auto">
            <h1 className="text-3xl md:text-5xl font-[900] tracking-tight leading-tight bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent">
              Gói Eng AI PRO Trọn Đời (Lifetime)
            </h1>
            <p className="text-sm md:text-base text-white/70 font-bold leading-relaxed">
              Bạn đang sở hữu phiên bản cao cấp nhất với đầy đủ đặc quyền: Vô hạn Trái Tim, gia sư AI Alex hướng dẫn chuyên sâu và học không ngắt quãng trọn đời!
            </p>
          </div>

          {/* Status Badges */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <div className="px-4 py-2 rounded-2xl bg-white/10 border border-white/15 text-xs font-black text-[#58cc02] flex items-center gap-2">
              <CheckCircle2 size={16} /> KÍCH HOẠT VĨNH VIỄN (LIFETIME)
            </div>
            <div className="px-4 py-2 rounded-2xl bg-white/10 border border-white/15 text-xs font-black text-[#ff4b4b] flex items-center gap-2">
              <Heart size={16} fill="currentColor" /> TRÁI TIM VÔ HẠN
            </div>
            <div className="px-4 py-2 rounded-2xl bg-white/10 border border-white/15 text-xs font-black text-[#1cb0f6] flex items-center gap-2">
              <Sparkles size={16} /> AI ALEX CHUYÊN SÂU
            </div>
          </div>
        </div>

        {/* LIFETIME MEMBERSHIP BANNER */}
        <div className="p-8 md:p-10 rounded-[36px] bg-gradient-to-br from-[#1cb0f6]/20 via-[#ce82ff]/20 to-[#ff4b4b]/20 border-2 border-white/20 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            <div className="space-y-3 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-black text-[#ffc800] uppercase tracking-wider">
                <Sparkles size={14} fill="currentColor" /> ĐẶC QUYỀN CAO CẤP NHẤT
              </div>
              <h2 className="text-2xl md:text-3xl font-[900]">
                Tất cả tính năng PRO đã sẵn sàng
              </h2>
              <p className="text-xs md:text-sm text-white/80 font-bold max-w-lg">
                Không cần đăng ký thẻ, không mất phí hàng tháng. Bạn có thể tập trung 100% vào việc rèn luyện tiếng Anh phản xạ mỗi ngày.
              </p>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-[#58cc02] to-[#46a302] hover:brightness-110 text-white font-[900] text-sm uppercase tracking-wider rounded-2xl shadow-xl border-b-4 border-[#337a01] active:translate-y-1 cursor-pointer transition-all flex items-center justify-center gap-2 shrink-0"
            >
              <span>VÀO HỌC NGAY BÂY GIỜ</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>

        {/* PERKS GRID (6 PERKS) */}
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-[900] tracking-tight">
              Toàn Bộ Quyền Lợi Của Bạn
            </h2>
            <p className="text-xs md:text-sm text-white/60 font-bold">
              Được thiết kế để tối ưu hóa tốc độ tiếp thu và khả năng ghi nhớ dài hạn
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {LIFETIME_PERKS.map((perk, index) => {
              const Icon = perk.icon;
              return (
                <div
                  key={index}
                  className="p-6 rounded-[28px] bg-white/5 border border-white/10 hover:border-white/20 transition-all flex items-start gap-4 backdrop-blur-sm shadow-md"
                >
                  <div className={`w-14 h-14 rounded-2xl ${perk.bgColor} ${perk.color} flex items-center justify-center shrink-0 border border-white/10 shadow-sm`}>
                    <Icon size={28} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-[900] text-base text-white">
                      {perk.title}
                    </h3>
                    <p className="text-xs font-bold text-white/70 leading-relaxed">
                      {perk.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* FREQUENTLY ASKED QUESTIONS */}
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-[900] tracking-tight">
              Câu Hỏi Thường Gặp
            </h2>
            <p className="text-xs md:text-sm text-white/60 font-bold">
              Thông tin chi tiết về gói Eng AI PRO Trọn Đời
            </p>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="rounded-[24px] bg-white/5 border border-white/10 overflow-hidden transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => {
                      playClickSound();
                      setOpenFaqIndex(isOpen ? null : idx);
                    }}
                    className="w-full p-5 text-left font-[900] text-sm md:text-base flex items-center justify-between gap-4 cursor-pointer hover:bg-white/5"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp size={20} className="text-[#1cb0f6]" /> : <ChevronDown size={20} className="text-white/40" />}
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs md:text-sm text-white/70 font-bold leading-relaxed border-t border-white/5 animate-in fade-in">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* BOTTOM ACTION */}
        <div className="pt-6 text-center">
          <button
            type="button"
            onClick={handleClose}
            className="w-full max-w-md mx-auto py-5 bg-[#58cc02] hover:bg-[#46a302] text-white font-[900] text-base uppercase tracking-wider rounded-[24px] shadow-2xl border-b-[6px] border-[#337a01] active:translate-y-1 cursor-pointer transition-all flex items-center justify-center gap-2"
          >
            <Sparkles size={20} />
            <span>BẮT ĐẦU BÀI HỌC VỚI PRO TRỌN ĐỜI</span>
          </button>
        </div>

      </main>
    </div>
  );
}
