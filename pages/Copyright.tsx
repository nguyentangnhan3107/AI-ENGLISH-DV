
import React, { useState, useEffect } from 'react';
import { UserStats, Unit, RichLesson } from '../types';
import { Settings, Plus, Trash2, Video, Music, X, BookOpen, Save } from 'lucide-react';

export default function Copyright({ stats }: { stats: UserStats }) {
  const [units, setUnits] = useState<Unit[]>([]);
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [activeUnitId, setActiveUnitId] = useState<string | null>(null);

  const [unitForm, setUnitForm] = useState({ title: '', description: '' });
  const [lessonForm, setLessonForm] = useState({
    title: '',
    type: 'video' as 'video' | 'music',
    script: '',
    audioText: '',
    audioTrans: '',
    passage: '',
    question: '',
    options: ['', '', ''],
    correct: 0
  });

  useEffect(() => {
    const saved = localStorage.getItem('linguist_units');
    if (saved) setUnits(JSON.parse(saved));
  }, []);

  const saveToLocal = (newUnits: Unit[]) => {
    setUnits(newUnits);
    localStorage.setItem('linguist_units', JSON.stringify(newUnits));
  };

  const handleAddUnit = () => {
    if (!unitForm.title) return;
    const newUnit: Unit = { id: 'u-' + Date.now(), title: unitForm.title, description: unitForm.description, lessons: [] };
    saveToLocal([...units, newUnit]);
    setShowUnitModal(false);
    setUnitForm({ title: '', description: '' });
  };

  const handleAddLesson = () => {
    if (!lessonForm.title || !activeUnitId) return;
    // Fixed: Added trueFalseQuestion and grammarPoint which were required by RichLesson interface.
    const newLesson: RichLesson = {
      id: 'l-' + Date.now(),
      title: lessonForm.title,
      type: lessonForm.type,
      videoContext: lessonForm.type === 'video' ? {
        description: 'Bài học video mới',
        script: lessonForm.script,
        situationalQuestion: {
          question: lessonForm.question,
          options: lessonForm.options,
          correctAnswer: lessonForm.correct,
          explanation: 'Chính xác!'
        }
      } : undefined,
      musicContext: lessonForm.type === 'music' ? {
        description: 'Bài hát tiếng Anh mới',
        lyrics: lessonForm.script,
        situationalQuestion: {
          question: lessonForm.question,
          options: lessonForm.options,
          correctAnswer: lessonForm.correct,
          explanation: 'Chính xác!'
        }
      } : undefined,
      trueFalseQuestion: {
        statement: 'Bạn đã nắm vững kiến thức từ bài học này chưa?',
        isTrue: true,
        explanation: 'Sự tự tin đến từ việc ôn tập kỹ lưỡng.'
      },
      // Added missing grammarPoint field to fix type error
      grammarPoint: {
        title: 'Trọng tâm bài học',
        rule: 'Quy tắc ngữ pháp quan trọng trong bài học này.',
        examples: [
          { en: 'I am learning English.', vi: 'Tôi đang học tiếng Anh.' }
        ]
      },
      audioDrill: { text: lessonForm.audioText, translation: lessonForm.audioTrans },
      readingContent: {
        passage: lessonForm.passage,
        highlights: [{ word: 'Apple', meaning: 'Quả táo / Tên ứng dụng', example: 'I am learning with Apple Eng AI.' }]
      },
      quiz: {
        title: 'Review',
        questions: [{
          question: lessonForm.question,
          options: lessonForm.options,
          correctAnswer: lessonForm.correct,
          explanation: 'Dựa trên nội dung bài học.'
        }]
      }
    };

    saveToLocal(units.map(u => u.id === activeUnitId ? { ...u, lessons: [...u.lessons, newLesson] } : u));
    setShowLessonModal(false);
    setLessonForm({ title: '', type: 'video', script: '', audioText: '', audioTrans: '', passage: '', question: '', options: ['', '', ''], correct: 0 });
  };

  const deleteUnit = (id: string) => {
    if (confirm('Xóa chương này?')) saveToLocal(units.filter(u => u.id !== id));
  };

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-12 space-y-12">
      <div className="flex items-center justify-between">
         <h1 className="text-4xl font-[900] flex items-center gap-4"><Settings className="text-[#ff4b4b]" /> Quản trị nội dung</h1>
         <button onClick={() => setShowUnitModal(true)} className="px-8 py-4 bg-[#58cc02] text-white font-black rounded-2xl flex items-center gap-2 shadow-lg"><Plus /> THÊM CHƯƠNG</button>
      </div>

      <div className="grid gap-8">
        {units.map(unit => (
          <div key={unit.id} className="duo-card p-8 bg-white space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-3xl font-[900] text-[#4b4b4b]">{unit.title}</h3>
                <p className="font-bold text-[#afafaf]">{unit.description}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setActiveUnitId(unit.id); setShowLessonModal(true); }} className="p-3 bg-[#ddf4ff] text-[#1cb0f6] rounded-xl hover:scale-110 transition-transform"><Plus /></button>
                <button onClick={() => deleteUnit(unit.id)} className="p-3 bg-[#ffd9d9] text-[#ff4b4b] rounded-xl hover:scale-110 transition-transform"><Trash2 /></button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {unit.lessons.map(l => (
                <div key={l.id} className="p-4 bg-[#f7f7f7] rounded-2xl border-2 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {l.type === 'video' ? <Video size={20} className="text-[#ff4b4b]" /> : <Music size={20} className="text-[#ce82ff]" />}
                    <span className="font-black text-sm">{l.title}</span>
                  </div>
                  <X size={16} className="text-[#afafaf] cursor-pointer" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {showUnitModal && (
        <div className="fixed inset-0 bg-black/60 z-[300] flex items-center justify-center p-4 backdrop-blur-md">
           <div className="bg-white w-full max-w-lg rounded-[40px] p-10 space-y-8 shadow-2xl animate-in zoom-in">
              <h2 className="text-3xl font-[900]">Tạo Chương Học</h2>
              <input placeholder="Tên chương" className="w-full p-6 duo-card outline-none font-bold" value={unitForm.title} onChange={e => setUnitForm({...unitForm, title: e.target.value})} />
              <textarea placeholder="Mô tả" className="w-full p-6 duo-card outline-none font-bold" value={unitForm.description} onChange={e => setUnitForm({...unitForm, description: e.target.value})} />
              <div className="flex gap-4">
                <button onClick={() => setShowUnitModal(false)} className="flex-1 py-4 font-black text-[#afafaf]">HỦY</button>
                <button onClick={handleAddUnit} className="flex-1 py-4 bg-[#58cc02] text-white font-black rounded-2xl">LƯU</button>
              </div>
           </div>
        </div>
      )}

      {showLessonModal && (
        <div className="fixed inset-0 bg-black/60 z-[300] flex items-center justify-center p-4 backdrop-blur-md overflow-y-auto">
           <div className="bg-white w-full max-w-2xl rounded-[40px] p-10 space-y-8 shadow-2xl my-10 animate-in zoom-in">
              <div className="flex justify-between items-center border-b-2 pb-6">
                <h2 className="text-3xl font-[900]">Thêm Bài Học</h2>
                <button onClick={() => setShowLessonModal(false)}><X size={32} className="text-[#afafaf]" /></button>
              </div>
              
              <div className="grid gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-[#afafaf]">Cơ bản</label>
                  <input placeholder="Tên bài học" className="w-full p-5 duo-card outline-none font-bold" value={lessonForm.title} onChange={e => setLessonForm({...lessonForm, title: e.target.value})} />
                  <div className="flex gap-4">
                    <button onClick={() => setLessonForm({...lessonForm, type: 'video'})} className={`flex-1 p-4 border-2 rounded-2xl font-black ${lessonForm.type === 'video' ? 'bg-[#ff4b4b] text-white' : ''}`}>VIDEO</button>
                    <button onClick={() => setLessonForm({...lessonForm, type: 'music'})} className={`flex-1 p-4 border-2 rounded-2xl font-black ${lessonForm.type === 'music' ? 'bg-[#ce82ff] text-white' : ''}`}>MUSIC</button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-[#afafaf]">Nội dung & Luyện nghe</label>
                  <textarea placeholder="Kịch bản / Lời bài hát" className="w-full p-5 duo-card outline-none font-bold" value={lessonForm.script} onChange={e => setLessonForm({...lessonForm, script: e.target.value})} />
                  <div className="grid grid-cols-2 gap-4">
                    <input placeholder="Câu luyện nghe (EN)" className="w-full p-5 duo-card outline-none font-bold" value={lessonForm.audioText} onChange={e => setLessonForm({...lessonForm, audioText: e.target.value})} />
                    <input placeholder="Bản dịch (VN)" className="w-full p-5 duo-card outline-none font-bold" value={lessonForm.audioTrans} onChange={e => setLessonForm({...lessonForm, audioTrans: e.target.value})} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-[#afafaf]">Đọc hiểu & Kiểm tra</label>
                  <textarea placeholder="Đoạn văn đọc hiểu" className="w-full p-5 duo-card outline-none font-bold" value={lessonForm.passage} onChange={e => setLessonForm({...lessonForm, passage: e.target.value})} />
                  <div className="p-6 bg-[#f7f7f7] rounded-[30px] space-y-4">
                    <input placeholder="Câu hỏi kiểm tra" className="w-full p-4 border-2 rounded-xl" value={lessonForm.question} onChange={e => setLessonForm({...lessonForm, question: e.target.value})} />
                    {lessonForm.options.map((opt, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <input placeholder={`Đáp án ${i+1}`} className="flex-1 p-3 border-2 rounded-xl" value={opt} onChange={e => {
                          const n = [...lessonForm.options]; n[i] = e.target.value; setLessonForm({...lessonForm, options: n});
                        }} />
                        <input type="radio" name="correct" checked={lessonForm.correct === i} onChange={() => setLessonForm({...lessonForm, correct: i})} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <button onClick={handleAddLesson} className="w-full py-6 bg-[#1cb0f6] text-white font-black rounded-[30px] text-xl shadow-[0_8px_0_0_#1899d6] active:translate-y-2 active:shadow-none transition-all">LƯU BÀI HỌC</button>
           </div>
        </div>
      )}
    </div>
  );
}
