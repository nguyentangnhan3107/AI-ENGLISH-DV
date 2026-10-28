import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserStats } from '../types';
import { Check, Users, Sparkles, Globe, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { playClickSound, playChestSound } from '../services/soundEffects';

interface CourseOption {
  id: string;
  title: string;
  flag: string;
  learners: string;
  description: string;
  tag: string;
  accentColor: string;
  borderColor: string;
}

const COURSES_DATA: CourseOption[] = [
  {
    id: 'en-sgk',
    title: 'Tiếng Anh (Phổ thông SGK)',
    flag: '🇬🇧',
    learners: '1.8 triệu người học',
    description: 'Chương trình chuẩn bám sát sách giáo khoa Bộ GD&ĐT từ Lớp 6 đến Lớp 12.',
    tag: 'Phổ biến nhất',
    accentColor: '#58cc02',
    borderColor: 'border-[#58cc02]',
  },
  {
    id: 'en-ielts',
    title: 'Tiếng Anh (IELTS Master)',
    flag: '🎯',
    learners: '890.000 người học',
    description: 'Chiến thuật giải đề, bứt phá từ vựng học thuật & phát âm cho mục tiêu Band 6.5 - 8.0+.',
    tag: 'Học thuật cao',
    accentColor: '#1cb0f6',
    borderColor: 'border-[#1cb0f6]',
  },
  {
    id: 'en-comm',
    title: 'Tiếng Anh (Giao tiếp Quốc tế)',
    flag: '💬',
    learners: '1.2 triệu người học',
    description: 'Hội thoại phản xạ nhanh trong đời sống thực tế: du lịch, mua sắm, kết bạn.',
    tag: 'Thực hành',
    accentColor: '#ff9600',
    borderColor: 'border-[#ff9600]',
  },
  {
    id: 'es',
    title: 'Tiếng Tây Ban Nha (Español)',
    flag: '🇪🇸',
    learners: '620.000 người học',
    description: 'Học ngôn ngữ sôi động với ngữ điệu đặc trưng cùng Eng AI.',
    tag: 'Thế giới',
    accentColor: '#ff4b4b',
    borderColor: 'border-[#ff4b4b]',
  },
  {
    id: 'fr',
    title: 'Tiếng Pháp (Français)',
    flag: '🇫🇷',
    learners: '450.000 người học',
    description: 'Ngôn ngữ lãng mạn châu Âu, phát âm mũi và cấu trúc câu thanh lịch.',
    tag: 'Châu Âu',
    accentColor: '#ce82ff',
    borderColor: 'border-[#ce82ff]',
  },
  {
    id: 'ja',
    title: 'Tiếng Nhật (Nihongo)',
    flag: '🇯🇵',
    learners: '810.000 người học',
    description: 'Làm quen bảng chữ Hiragana, Katakana và đàm thoại đời thường phong cách Anime.',
    tag: 'Châu Á',
    accentColor: '#ff7b7b',
    borderColor: 'border-[#ff7b7b]',
  },
  {
    id: 'ko',
    title: 'Tiếng Hàn (Hangugeo)',
    flag: '🇰🇷',
    learners: '740.000 người học',
    description: 'Bảng chữ Hangul trực quan, luyện giao tiếp qua phim ảnh và âm nhạc K-Pop.',
    tag: 'Văn hóa K-Pop',
    accentColor: '#00cd9c',
    borderColor: 'border-[#00cd9c]',
  },
  {
    id: 'de',
    title: 'Tiếng Đức (Deutsch)',
    flag: '🇩🇪',
    learners: '310.000 người học',
    description: 'Ngữ pháp chặt chẽ, từ ghép độc đáo phục vụ du học và công việc tại Đức.',
    tag: 'Học thuật',
    accentColor: '#ffc800',
    borderColor: 'border-[#ffc800]',
  },
  {
    id: 'zh',
    title: 'Tiếng Trung (Hànyǔ)',
    flag: '🇨🇳',
    learners: '680.000 người học',
    description: 'Luyện 4 thanh điệu Pinyin và nhận diện các bộ thủ chữ Hán thông dụng.',
    tag: 'Giao thương',
    accentColor: '#ea580c',
    borderColor: 'border-[#ea580c]',
  },
];

export default function Courses({ 
  stats, 
  onUpdateProfile 
}: { 
  stats: UserStats; 
  onUpdateProfile: (d: Partial<UserStats>) => void; 
}) {
  const navigate = useNavigate();
  const currentCourseId = stats.activeCourseId || 'en-sgk';
  const [selectedId, setSelectedId] = useState(currentCourseId);

  const handleSelectCourse = (course: CourseOption) => {
    setSelectedId(course.id);
    playChestSound();
    onUpdateProfile({
      activeCourseId: course.id,
      activeCourseTitle: course.title,
      activeCourseFlag: course.flag,
    });
    setTimeout(() => {
      navigate('/');
    }, 350);
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-8 py-4 md:py-8 space-y-5 sm:space-y-8 pb-28 md:pb-32 overflow-x-hidden">
      {/* Banner phong cách Từ điển Táo */}
      <div className="bg-[#ce82ff] shadow-[0_6px_0_0_#a855f7] sm:shadow-[0_8px_0_0_#a855f7] rounded-[24px] sm:rounded-[30px] md:rounded-[40px] p-5 sm:p-6 md:p-12 text-white relative overflow-hidden transition-all">
        <div className="relative z-10 space-y-3 sm:space-y-4">
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-[900] leading-tight">Các Khóa Học Ngôn Ngữ</h1>
          <p className="text-xs sm:text-base md:text-lg font-bold opacity-90 max-w-xl">
            Chọn ngôn ngữ hoặc chương trình bạn muốn rèn luyện cùng Eng AI. Tiến độ của từng khóa được lưu riêng biệt!
          </p>
          <div className="flex flex-wrap gap-2 sm:gap-3 mt-3 sm:mt-8">
            <div className="bg-white/20 px-3.5 py-1.5 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl backdrop-blur-md font-black text-[10px] md:text-xs uppercase tracking-wider flex items-center gap-1.5 sm:gap-2">
              <Globe size={14} /> Tổng: {COURSES_DATA.length} Khóa học
            </div>
            <div className="bg-white/30 px-3.5 py-1.5 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl backdrop-blur-md font-black text-[10px] md:text-xs uppercase tracking-wider flex items-center gap-1.5">
              <span>Đang chọn: {COURSES_DATA.find(c => c.id === selectedId)?.title || 'Tiếng Anh'}</span>
            </div>
          </div>
        </div>
        <Globe className="absolute right-[-20px] top-[-20px] text-white/10 w-40 h-40 sm:w-48 sm:h-48 md:w-64 md:h-64 pointer-events-none select-none" />
      </div>

      {/* Grid of Courses */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {COURSES_DATA.map((course) => {
          const isActive = course.id === selectedId;

          return (
            <div
              key={course.id}
              onClick={() => handleSelectCourse(course)}
              className={`p-4 sm:p-6 rounded-[24px] sm:rounded-[32px] border-2 sm:border-4 transition-all cursor-pointer relative flex flex-col justify-between group shadow-sm hover:shadow-xl ${
                isActive
                  ? 'bg-[#f0fff0] border-[#58cc02] shadow-[0_6px_0_0_#46a302] sm:shadow-[0_8px_0_0_#46a302] -translate-y-1'
                  : 'bg-white border-[#f0f0f0] hover:border-[#e5e5e5] shadow-[0_4px_0_0_#e5e5e5] sm:shadow-[0_6px_0_0_#e5e5e5] hover:-translate-y-1'
              }`}
            >
              {/* Badge Tag */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-[#f7f7f7] text-[#777] border border-[#e5e5e5]">
                  {course.tag}
                </span>
                {isActive && (
                  <span className="flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-[#58cc02] bg-white px-2.5 py-1 rounded-full border-2 border-[#58cc02] shadow-xs">
                    <Check size={14} strokeWidth={3} /> Đang học
                  </span>
                )}
              </div>

              {/* Flag & Title */}
              <div className="space-y-3">
                <div className="text-5xl drop-shadow-md select-none pointer-events-none inline-block">
                  {course.flag}
                </div>
                <h3 className="font-[900] text-lg text-[#4b4b4b] leading-snug">
                  {course.title}
                </h3>
                <p className="text-xs font-bold text-[#afafaf] leading-relaxed line-clamp-3">
                  {course.description}
                </p>
              </div>

              {/* Learners Count & Action */}
              <div className="pt-6 mt-4 border-t-2 border-[#f0f0f0] flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-bold text-[#afafaf]">
                  <Users size={14} /> {course.learners}
                </span>

                <button
                  type="button"
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                    isActive
                      ? 'bg-[#58cc02] text-white shadow-md'
                      : 'bg-[#f7f7f7] text-[#afafaf] group-hover:bg-[#58cc02] group-hover:text-white'
                  }`}
                >
                  <ArrowRight size={18} strokeWidth={3} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
