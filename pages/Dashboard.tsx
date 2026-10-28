import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { UserStats, Unit, RichLesson, QuizQuestion, VocabularyWord } from '../types';
import { 
  Star, Zap, X, Mic, MicOff,
  Loader2, Sparkles,
  ArrowRight, Heart, Volume2, BookOpen, Send,
  Brain, Tag, Link2, CheckCircle2, XCircle, RotateCcw,
  MessageSquare, HelpCircle, Check, Award, ChevronRight,
  Lock, Gift, Trophy, Target, Gem, Flame, Crown, BookMarked,
  Plus, Trash2, Infinity as InfinityIcon
} from 'lucide-react';
import { 
  playTTS, 
  stopTTS,
  generateRichLesson, 
  generateTopicFallbackLesson,
  evaluatePronunciation,
  PronunciationEvaluation,
  announceAccessibility
} from '../services/geminiService';
import { 
  playCorrectSound, 
  playIncorrectSound, 
  playClickSound, 
  playChestSound 
} from '../services/soundEffects';
import { APP_LOGO_URL } from '../App';

const Fireworks = () => {
  const [particles, setParticles] = useState<any[]>([]);
  useEffect(() => {
    const colors = ['#ff4b4b', '#58cc02', '#ffc800', '#ce82ff', '#1cb0f6'];
    setParticles(Array.from({ length: 45 }).map((_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 550 + 'px',
      y: (Math.random() - 0.5) * 550 + 'px',
      left: Math.random() * 100 + '%',
      top: Math.random() * 100 + '%',
      color: colors[Math.floor(Math.random() * colors.length)]
    })));
  }, []);
  return (
    <div className="fixed inset-0 pointer-events-none z-[1000] overflow-hidden">
      {particles.map(p => (
        <div key={p.id} className="firework" style={{ '--x': p.x, '--y': p.y, left: p.left, top: p.top, backgroundColor: p.color } as any} />
      ))}
    </div>
  );
};

const DEFAULT_20_QUESTIONS: QuizQuestion[] = [
  // 1. TỪ VỰNG (1 - 4)
  {
    type: "multiple_choice",
    question: "Trong đoạn hội thoại, tính từ \"delicious\" trong câu \"These apples look delicious\" mang ý nghĩa là gì?",
    options: ["Thơm ngon, ngon miệng", "Chua chát, khó ăn", "Đắt đỏ, quý hiếm", "Tươi sống, chưa chín"],
    correctAnswer: 0,
    explanation: "\"Delicious\" (/dɪˈlɪʃ.əs/) là tính từ có nghĩa là thơm ngon, ngon miệng, hấp dẫn vị giác.",
    category: "vocabulary",
    categoryLabel: "Từ vựng"
  },
  {
    type: "card_match",
    question: "Chọn các cặp thẻ tương ứng để ghi nhớ từ vựng trong bài hội thoại:",
    matchPairs: [
      { en: "delicious", vi: "thơm ngon" },
      { en: "fresh", vi: "tươi mới" },
      { en: "healthy", vi: "khỏe mạnh" },
      { en: "active", vi: "năng động" }
    ],
    explanation: "Xuất sắc! Bạn đã ghi nhớ đúng 4 từ vựng then chốt: delicious (thơm ngon), fresh (tươi mới), healthy (khỏe mạnh), active (năng động).",
    category: "vocabulary",
    categoryLabel: "Từ vựng"
  },
  {
    type: "multiple_choice",
    question: "Cụm từ \"plenty of\" trong \"It gives you plenty of natural vitamins\" có nghĩa là gì?",
    options: ["Rất ít, hiếm hoi", "Dồi dào, rất nhiều", "Không có chút nào", "Vừa đủ một chút"],
    correctAnswer: 1,
    explanation: "\"Plenty of\" = \"a lot of / abundant\", mang ý nghĩa là dồi dào, nhiều.",
    category: "vocabulary",
    categoryLabel: "Từ vựng"
  },
  {
    type: "multiple_choice",
    question: "Từ trái nghĩa (antonym) chính xác nhất với tính từ \"healthy\" (khỏe mạnh) là gì?",
    options: ["Energetic", "Unhealthy", "Strong", "Active"],
    correctAnswer: 1,
    explanation: "Tiền tố phủ định \"un-\" kết hợp với \"healthy\" tạo thành \"unhealthy\" (không lành mạnh, ốm yếu).",
    category: "vocabulary",
    categoryLabel: "Từ vựng"
  },

  // 2. TỪ LOẠI (5 - 8)
  {
    type: "multiple_choice",
    question: "Trong câu \"These apples look delicious\", từ \"delicious\" đóng vai trò là từ loại nào?",
    options: ["Danh từ (Noun)", "Tính từ (Adjective)", "Động từ (Verb)", "Trạng từ (Adverb)"],
    correctAnswer: 1,
    explanation: "Sau linking verb \"look\", ta sử dụng tính từ (Adjective) để mô tả tính chất của chủ ngữ: \"look delicious\".",
    category: "part_of_speech",
    categoryLabel: "Từ loại"
  },
  {
    type: "multiple_choice",
    question: "Từ \"energy\" trong cụm từ \"sweet energy\" thuộc loại từ nào?",
    options: ["Danh từ (Noun)", "Tính từ (Adjective)", "Động từ (Verb)", "Giới từ (Preposition)"],
    correctAnswer: 0,
    explanation: "\"Energy\" là danh từ (Noun) mang nghĩa năng lượng. Tính từ của nó là \"energetic\".",
    category: "part_of_speech",
    categoryLabel: "Từ loại"
  },
  {
    type: "multiple_choice",
    question: "Dạng trạng từ (Adverb) của tính từ \"exact\" được dùng trong câu cảm thán \"Exactly!\" là gì?",
    options: ["Exactness", "Exact", "Exactly", "Exacting"],
    correctAnswer: 2,
    explanation: "Thêm hậu tố \"-ly\" vào sau tính từ \"exact\" để tạo thành trạng từ \"exactly\" (chính xác).",
    category: "part_of_speech",
    categoryLabel: "Từ loại"
  },
  {
    type: "multiple_choice",
    question: "Trong câu \"Eating fresh apples every day keeps you healthy\", từ \"Eating\" đóng vai trò ngữ pháp gì?",
    options: ["Danh động từ làm chủ ngữ (Gerund as Subject)", "Động từ vị ngữ thì tiếp diễn", "Tính từ bổ nghĩa cho quả táo", "Liên từ nối câu"],
    correctAnswer: 0,
    explanation: "\"Eating\" là Gerund (danh động từ thêm -ing) đứng đầu câu làm chủ ngữ số ít cho động từ \"keeps\".",
    category: "part_of_speech",
    categoryLabel: "Từ loại"
  },

  // 3. CÁCH PHÁT ÂM (9 - 12)
  {
    type: "multiple_choice",
    question: "Trọng âm chính của từ \"delicious\" rơi vào âm tiết thứ mấy?",
    options: ["Âm tiết 1 (/ˈdɪ.lɪʃ.əs/)", "Âm tiết 2 (/dɪˈlɪʃ.əs/)", "Âm tiết 3 (/dɪ.lɪˈʃəs/)", "Không có trọng âm"],
    correctAnswer: 1,
    explanation: "Từ \"delicious\" có 3 âm tiết, trọng âm nhấn vào âm tiết thứ hai: de-LI-cious /dɪˈlɪʃ.əs/.",
    category: "pronunciation",
    categoryLabel: "Cách phát âm",
    audioPrompt: "delicious"
  },
  {
    type: "multiple_choice",
    question: "Từ nào sau đây có phần nguyên âm được phát âm là /e/ giống như từ \"fresh\"?",
    options: ["healthy (/ˈhel.θi/)", "please (/pliːz/)", "eating (/ˈiː.tɪŋ/)", "sweet (/swiːt/)"],
    correctAnswer: 0,
    explanation: "Từ \"healthy\" phát âm âm 'ea' là /e/ (/ˈhel.θi/), giống âm /e/ trong \"fresh\" (/freʃ/).",
    category: "pronunciation",
    categoryLabel: "Cách phát âm",
    audioPrompt: "healthy fresh"
  },
  {
    type: "multiple_choice",
    question: "Từ nào dưới đây có trọng âm rơi vào âm tiết đầu tiên (thứ 1)?",
    options: ["wonderful (/ˈwʌn.də.fəl/)", "delicious (/dɪˈlɪʃ.əs/)", "enjoy (/ɪnˈdʒɔɪ/)", "away (/əˈweɪ/)"],
    correctAnswer: 0,
    explanation: "\"Wonderful\" nhấn trọng âm vào âm tiết thứ nhất. Ba từ còn lại nhấn âm tiết thứ hai.",
    category: "pronunciation",
    categoryLabel: "Cách phát âm",
    audioPrompt: "wonderful"
  },
  {
    type: "multiple_choice",
    question: "Hậu tố số nhiều '-s' trong từ \"apples\" (/ˈæp.əlz/) được phát âm chuẩn là âm gì?",
    options: ["Âm /s/", "Âm /z/", "Âm /ɪz/", "Âm câm không phát âm"],
    correctAnswer: 1,
    explanation: "Sau âm hữu thanh /l/, đuôi \"-s\" được phát âm thành /z/: /ˈæp.əlz/.",
    category: "pronunciation",
    categoryLabel: "Cách phát âm",
    audioPrompt: "apples"
  },

  // 4. TRÍ NHỚ & HỒI TƯỞNG (13 - 16)
  {
    type: "multiple_choice",
    question: "Theo nội dung cuộc hội thoại, người B bày tỏ niềm yêu thích với loại táo nào?",
    options: ["Táo xanh (Green apples)", "Táo đỏ (Red apples)", "Táo vàng (Yellow apples)", "Táo sấy khô"],
    correctAnswer: 1,
    explanation: "Người B nói rõ trong bài: \"Yes, please! I love red apples.\" (Tôi thích táo đỏ).",
    category: "memory",
    categoryLabel: "Trí nhớ"
  },
  {
    type: "card_match",
    question: "Thử thách trí nhớ: Chọn cặp thẻ ghép từ vựng tiếng Anh với nghĩa trong cuộc hội thoại:",
    matchPairs: [
      { en: "vitamins", vi: "vitamin dinh dưỡng" },
      { en: "doctor", vi: "bác sĩ" },
      { en: "sharing", vi: "sự sẻ chia" },
      { en: "enjoy", vi: "thưởng thức" }
    ],
    explanation: "Trí nhớ siêu đỉnh! Bạn đã ghi nhớ và ghép chính xác các cặp từ quan trọng trong cuộc trò chuyện với Alex.",
    category: "memory",
    categoryLabel: "Trí nhớ"
  },
  {
    type: "multiple_choice",
    question: "Thành ngữ nổi tiếng nào về sức khỏe đã được người B trích dẫn trong cuộc trò chuyện?",
    options: ["Time is money", "An apple a day keeps the doctor away", "Better late than never", "No pain, no gain"],
    correctAnswer: 1,
    explanation: "Người B đã trích dẫn: \"An apple a day keeps the doctor away, right?\" (Mỗi ngày một quả táo, thầy thuốc tránh xa).",
    category: "memory",
    categoryLabel: "Trí nhớ"
  },
  {
    type: "multiple_choice",
    question: "Hành động người B dự định làm ngay sau khi nhận được quả táo từ người A là gì?",
    options: ["Cất vào tủ lạnh", "Thưởng thức quả táo ngay lúc này", "Đem tặng cho người khác", "Rửa và để dành ngày mai"],
    correctAnswer: 1,
    explanation: "Người B kết thúc hội thoại: \"Thank you so much for sharing! I will enjoy this right now.\"",
    category: "memory",
    categoryLabel: "Trí nhớ"
  },

  // 5. GHÉP ĐÚNG NGHĨA CÂU (17 - 20)
  {
    type: "word_order",
    question: "Ghép các thẻ chữ bên dưới để tạo thành câu có nghĩa hoàn chỉnh:",
    translationHint: "Ăn táo tươi mỗi ngày giúp bạn khỏe mạnh và năng động.",
    targetSentence: "Eating fresh apples every day keeps you healthy and active",
    wordsPool: ["Eating", "fresh", "apples", "every day", "keeps", "you", "healthy", "and", "active", "bad", "drink"],
    explanation: "Chính xác tuyệt đối! Câu hoàn chỉnh là: 'Eating fresh apples every day keeps you healthy and active.' (Ăn táo tươi mỗi ngày giúp bạn khỏe mạnh và năng động).",
    category: "sentence_matching",
    categoryLabel: "Ghép đúng nghĩa câu"
  },
  {
    type: "word_order",
    question: "Sắp xếp các khối từ để tạo thành câu thành ngữ nổi tiếng mà người B đã nói:",
    translationHint: "Một quả táo mỗi ngày giúp tránh xa bác sĩ.",
    targetSentence: "An apple a day keeps the doctor away",
    wordsPool: ["An", "apple", "a day", "keeps", "the", "doctor", "away", "hospital", "bring"],
    explanation: "Rất chuẩn xác! Thành ngữ kinh điển là: 'An apple a day keeps the doctor away.'",
    category: "sentence_matching",
    categoryLabel: "Ghép đúng nghĩa câu"
  },
  {
    type: "multiple_choice",
    question: "Đâu là bản dịch chính xác của câu chào hỏi: \"Glad to hear that! Do you want one?\"?",
    options: [
      "Rất vui được nghe điều đó! Bạn có muốn một quả không?",
      "Thật buồn khi nghe tin! Bạn có cần tiền không?",
      "Hãy chú ý lắng nghe! Quả táo này của ai?",
      "Tôi không nghe rõ! Bạn có thể nói lại không?"
    ],
    correctAnswer: 0,
    explanation: "\"Glad to hear that!\" = Rất vui được nghe điều đó; \"Do you want one?\" = Bạn có muốn một quả không?",
    category: "sentence_matching",
    categoryLabel: "Ghép đúng nghĩa câu"
  },
  {
    type: "word_order",
    question: "Ghép các khối từ để tạo thành lời cảm ơn trọn vẹn của bạn B:",
    translationHint: "Cảm ơn bạn rất nhiều vì đã chia sẻ! Tôi sẽ thưởng thức nó ngay bây giờ.",
    targetSentence: "Thank you so much for sharing I will enjoy this right now",
    wordsPool: ["Thank you", "so much", "for sharing", "I will", "enjoy this", "right now", "never", "later"],
    explanation: "Hoàn hảo! Lời cảm ơn hoàn chỉnh: 'Thank you so much for sharing! I will enjoy this right now.'",
    category: "sentence_matching",
    categoryLabel: "Ghép đúng nghĩa câu"
  }
];

const DEFAULT_UNITS: Unit[] = [
  {
    id: 'u1',
    title: 'Giao tiếp hằng ngày',
    description: 'Chào hỏi, sở thích, hội thoại & 20 câu hỏi chuyên sâu kiểm tra toàn diện.',
    lessons: [
      {
        id: 'l1',
        title: 'Chào hỏi & Vị ngon quả táo',
        type: 'video',
        videoContext: {
          description: 'Alex và Học viên trò chuyện về những quả táo đỏ thơm ngon và lợi ích sức khỏe.',
          script: `A: Hi! These apples look delicious. How are you?\nB: I am great, thanks! They are fresh.\nA: Glad to hear that! Do you want one?\nB: Yes, please! I love red apples.\nA: Here you go! Eating fresh apples every day keeps you healthy and active.\nB: That is wonderful! An apple a day keeps the doctor away, right?\nA: Exactly! It gives you plenty of natural vitamins and sweet energy.\nB: Thank you so much for sharing! I will enjoy this right now.`,
          situationalQuestion: {
            question: 'How are the apples according to person B?',
            options: ['Sour', 'Fresh', 'Old'],
            correctAnswer: 1,
            explanation: 'Người B nói rằng "They are fresh" (Chúng tươi).'
          }
        },
        trueFalseQuestion: { statement: "The apples are rotten and old.", isTrue: false, explanation: "Người B khẳng định táo 'tươi' (fresh)." },
        audioDrill: { text: 'These apples look delicious', translation: 'Những quả táo này trông thật ngon' },
        grammarPoint: {
          title: "Thì Hiện Tại Đơn & Linking Verbs",
          rule: "Sử dụng tính từ sau động từ chỉ giác quan (look, feel, smell, taste).",
          examples: [{ en: "These apples look delicious.", vi: "Những quả táo này trông thật ngon miệng." }]
        },
        readingContent: {
          passage: 'Eating fresh apples daily gives your body vitamins and natural energy.',
          highlights: [{ word: 'Delicious', meaning: 'Ngon tuyệt', example: 'This red apple is delicious.' }]
        },
        quiz: {
          title: '20 Câu hỏi chuyên sâu',
          questions: DEFAULT_20_QUESTIONS
        }
      },
      {
        id: 'l2',
        title: 'Trái cây & Năng lượng lành mạnh',
        type: 'video',
        videoContext: {
          description: 'Alex giải thích về các loại trái cây và bổ sung năng lượng tự nhiên trong ngày.',
          script: `A: Do you know what other fruits give you quick energy?\nB: Bananas and oranges are great, right?\nA: Absolutely! They contain natural sugars and dietary fibers.\nB: I usually have a fruit smoothie before my morning workout.\nA: That is a wonderful healthy habit! Keep it up.\nB: Thank you Alex! Let us practice more healthy lifestyle words.`,
          situationalQuestion: {
            question: 'What does person B drink before morning workout?',
            options: ['Soda', 'Fruit smoothie', 'Coffee'],
            correctAnswer: 1,
            explanation: 'Người B nói "I usually have a fruit smoothie before my morning workout".'
          }
        },
        trueFalseQuestion: { statement: "Bananas and oranges have no vitamins.", isTrue: false, explanation: "Trái cây giàu vitamin và chất xơ." },
        audioDrill: { text: 'That is a wonderful healthy habit', translation: 'Đó là một thói quen lành mạnh tuyệt vời' },
        grammarPoint: {
          title: "Adverbs of Frequency (Trạng từ tần suất)",
          rule: "Trạng từ tần suất (usually, always, often) đứng trước động từ thường và sau động từ to be.",
          examples: [{ en: "I usually have a fruit smoothie.", vi: "Tôi thường uống sinh tố trái cây." }]
        },
        readingContent: {
          passage: 'Healthy habits create a strong mind and energetic body for everyday study.',
          highlights: [{ word: 'Habit', meaning: 'Thói quen', example: 'Reading daily is a good habit.' }]
        },
        quiz: {
          title: '20 Câu hỏi chuyên sâu',
          questions: DEFAULT_20_QUESTIONS
        }
      }
    ]
  },
  {
    id: 'u2',
    title: 'Gọi món & Ẩm thực thường nhật',
    description: 'Giao tiếp tại quán ăn, hương vị món ăn & cách đặt câu hỏi lịch sự.',
    lessons: [
      {
        id: 'l3',
        title: 'Tại quán cà phê ấm cúng',
        type: 'video',
        videoContext: {
          description: 'Gọi đồ uống và bánh ngọt tại quầy thu ngân quán cà phê.',
          script: `A: Good morning! Welcome to Green Coffee. What can I get for you?\nB: Hi! Could I please have a hot latte with almond milk?\nA: Sure thing. Would you like any pastry with that today?\nB: A fresh croissant would be perfect, thanks!\nA: That comes to six dollars. Are you paying by card or cash?\nB: By card, please. Here you go!`,
          situationalQuestion: {
            question: 'What milk does the customer request?',
            options: ['Cow milk', 'Almond milk', 'Oat milk'],
            correctAnswer: 1,
            explanation: 'Khách hàng yêu cầu "almond milk" (sữa hạnh nhân).'
          }
        },
        trueFalseQuestion: { statement: "The customer orders tea.", isTrue: false, explanation: "Khách hàng gọi hot latte." },
        audioDrill: { text: 'Could I please have a hot latte', translation: 'Cho tôi xin một ly latte nóng được không' },
        grammarPoint: {
          title: "Polite Requests with 'Could I please...'",
          rule: "Sử dụng 'Could I / Would you like...' để gọi món và giao tiếp lịch sự trong nhà hàng, quán cà phê.",
          examples: [{ en: "Could I please have a coffee?", vi: "Làm ơn cho tôi một ly cà phê được không?" }]
        },
        readingContent: {
          passage: 'Polite words make daily conversations friendly and respectful everywhere in the world.',
          highlights: [{ word: 'Polite', meaning: 'Lịch sự', example: 'Always be polite to others.' }]
        },
        quiz: {
          title: '20 Câu hỏi chuyên sâu',
          questions: DEFAULT_20_QUESTIONS
        }
      },
      {
        id: 'l4',
        title: 'Thực đơn trưa & Thanh toán',
        type: 'video',
        videoContext: {
          description: 'Hỏi nhân viên phục vụ về các món ăn đặc sắc và thanh toán hóa đơn.',
          script: `A: Are you ready to order lunch today?\nB: Yes! What is today's special dish?\nA: Today we have grilled salmon with garden salad and lemon sauce.\nB: That sounds mouth-watering! I will take that, please.\nA: Excellent choice. I will bring your order right away.\nB: Thank you very much!`,
          situationalQuestion: {
            question: 'What is today special dish?',
            options: ['Pizza', 'Grilled salmon with salad', 'Burger'],
            correctAnswer: 1,
            explanation: 'Món đặc biệt hôm nay là cá hồi nướng kèm salad rau củ.'
          }
        },
        trueFalseQuestion: { statement: "The customer disliked the dish recommendation.", isTrue: false, explanation: "Khách hàng khen món nghe thật hấp dẫn (mouth-watering)." },
        audioDrill: { text: 'What is today special dish', translation: 'Hôm nay có món ăn đặc biệt nào vậy' },
        grammarPoint: {
          title: "Future simple with 'I will take...'",
          rule: "Dùng 'I will (I'll) + V' khi đưa ra quyết định ngay tại thời điểm nói.",
          examples: [{ en: "I will take that, please.", vi: "Tôi sẽ chọn món đó nhé." }]
        },
        readingContent: {
          passage: 'Trying international cuisines enriches your vocabulary and cultural knowledge.',
          highlights: [{ word: 'Cuisine', meaning: 'Ẩm thực', example: 'Vietnamese cuisine is delicious.' }]
        },
        quiz: {
          title: '20 Câu hỏi chuyên sâu',
          questions: DEFAULT_20_QUESTIONS
        }
      }
    ]
  },
  {
    id: 'u3',
    title: 'Du lịch & Khám phá thế giới',
    description: 'Hỏi đường, phương tiện giao thông & các chuyến phiêu lưu kỳ thú.',
    lessons: [
      {
        id: 'l5',
        title: 'Hỏi đường tại London',
        type: 'video',
        videoContext: {
          description: 'Hỏi thăm người dân địa phương cách di chuyển đến ga tàu điện ngầm.',
          script: `A: Excuse me! Could you tell me where the nearest tube station is?\nB: Sure! Walk straight down this avenue, then turn right at the traffic lights.\nA: Is it far from here? Should I take a bus?\nB: No, it is just a five-minute walk. You cannot miss it!\nA: That is very kind of you. Have a great day!\nB: You too! Enjoy your stay in London.`,
          situationalQuestion: {
            question: 'How far is the station?',
            options: ['1 hour', '5-minute walk', '20 miles'],
            correctAnswer: 1,
            explanation: 'Người chỉ đường nói "just a five-minute walk" (chỉ 5 phút đi bộ).'
          }
        },
        trueFalseQuestion: { statement: "The station is very far away.", isTrue: false, explanation: "Ga tàu điện rất gần, chỉ 5 phút đi bộ." },
        audioDrill: { text: 'Could you tell me where the station is', translation: 'Bạn có thể chỉ cho tôi nhà ga ở đâu không' },
        grammarPoint: {
          title: "Giving & Asking for Directions (Chỉ đường)",
          rule: "Sử dụng câu mệnh lệnh: 'Walk straight', 'Turn right/left at...', 'Go past...'.",
          examples: [{ en: "Turn right at the traffic lights.", vi: "Rẽ phải ở cột đèn giao thông." }]
        },
        readingContent: {
          passage: 'Traveling broadens our perspectives and connects people across nations.',
          highlights: [{ word: 'Explore', meaning: 'Khám phá', example: 'I love to explore historic cities.' }]
        },
        quiz: {
          title: '20 Câu hỏi chuyên sâu',
          questions: DEFAULT_20_QUESTIONS
        }
      }
    ]
  }
];

interface CardMatchItem {
  id: string;
  side: 'en' | 'vi';
  text: string;
  pairIdx: number;
}

interface CardMatchProps {
  question: QuizQuestion;
  isAnswered: boolean;
  onAllMatched: () => void;
  onError: () => void;
}

const CardMatchQuestion: React.FC<CardMatchProps> = ({ question, isAnswered, onAllMatched, onError }) => {
  const pairs = question.matchPairs || [];
  const [cards, setCards] = useState<{ en: CardMatchItem[]; vi: CardMatchItem[] }>({ en: [], vi: [] });
  const [selectedCard, setSelectedCard] = useState<CardMatchItem | null>(null);
  const [matchedPairIdxs, setMatchedPairIdxs] = useState<number[]>([]);
  const [shakeCardIds, setShakeCardIds] = useState<string[]>([]);

  useEffect(() => {
    const enList: CardMatchItem[] = pairs.map((p, idx) => ({
      id: `en-${idx}`,
      side: 'en' as const,
      text: p.en,
      pairIdx: idx
    })).sort(() => Math.random() - 0.5);

    const viList: CardMatchItem[] = pairs.map((p, idx) => ({
      id: `vi-${idx}`,
      side: 'vi' as const,
      text: p.vi,
      pairIdx: idx
    })).sort(() => Math.random() - 0.5);

    setCards({ en: enList, vi: viList });
    setSelectedCard(null);
    setMatchedPairIdxs([]);
    setShakeCardIds([]);
  }, [question]);

  const handleCardClick = (card: CardMatchItem) => {
    if (isAnswered) return;
    if (matchedPairIdxs.includes(card.pairIdx)) return;

    if (card.side === 'en') {
      playTTS(card.text);
    }

    if (!selectedCard) {
      setSelectedCard(card);
      return;
    }

    if (selectedCard.id === card.id) {
      setSelectedCard(null);
      return;
    }

    if (selectedCard.side === card.side) {
      setSelectedCard(card);
      return;
    }

    // Checking match
    if (selectedCard.pairIdx === card.pairIdx) {
      const nextMatched = [...matchedPairIdxs, card.pairIdx];
      setMatchedPairIdxs(nextMatched);
      setSelectedCard(null);
      if (nextMatched.length === pairs.length) {
        onAllMatched();
      }
    } else {
      setShakeCardIds([selectedCard.id, card.id]);
      onError();
      setTimeout(() => {
        setShakeCardIds([]);
        setSelectedCard(null);
      }, 700);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 sm:p-3.5 bg-[#f0fff0] rounded-xl sm:rounded-2xl border-2 border-[#58cc02]/20 gap-2">
        <span className="text-[11px] sm:text-xs font-black text-[#15803d] flex items-center gap-1.5 leading-snug">
          <Sparkles size={15} className="text-[#58cc02] shrink-0" />
          Chạm chọn 1 thẻ tiếng Anh và 1 thẻ tiếng Việt tương ứng:
        </span>
        <span className="text-[10px] sm:text-xs font-black text-[#58cc02] bg-white px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full border border-[#58cc02]/20 shadow-xs self-start sm:self-auto shrink-0">
          Đã ghép: {matchedPairIdxs.length} / {pairs.length}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-3.5 md:gap-4 w-full">
        {/* Left Column: English Words */}
        <div className="space-y-2 sm:space-y-3 min-w-0">
          <div className="text-[10px] sm:text-[11px] font-black uppercase text-[#afafaf] tracking-wider text-center">
            Từ tiếng Anh
          </div>
          {cards.en.map((card) => {
            const isMatched = matchedPairIdxs.includes(card.pairIdx);
            const isSelected = selectedCard?.id === card.id;
            const isShaking = shakeCardIds.includes(card.id);

            let style = "bg-white border-[#e5e5e5] text-[#4b4b4b] hover:border-[#1cb0f6] shadow-sm";
            if (isMatched) {
              style = "bg-[#f0fff0] border-[#58cc02] text-[#46a302] font-black cursor-default opacity-90 shadow-none";
            } else if (isShaking) {
              style = "bg-[#fff0f0] border-[#ff4b4b] text-[#ff4b4b] shake-error font-black";
            } else if (isSelected) {
              style = "bg-[#f0f9ff] border-[#1cb0f6] text-[#1cb0f6] ring-2 sm:ring-4 ring-[#1cb0f6]/20 font-black scale-[1.02]";
            }

            return (
              <button
                key={card.id}
                type="button"
                disabled={isMatched || isAnswered}
                onClick={() => handleCardClick(card)}
                className={`w-full min-h-[44px] p-2 sm:p-3.5 rounded-xl sm:rounded-[20px] border-2 text-left font-black text-xs sm:text-sm md:text-base transition-all flex items-center justify-between cursor-pointer select-none gap-1 ${style}`}
              >
                <span className="truncate flex-1 min-w-0">{card.text}</span>
                {isMatched ? (
                  <CheckCircle2 size={16} className="text-[#58cc02] shrink-0 ml-1" />
                ) : (
                  <Volume2 size={14} className="text-[#afafaf] shrink-0 ml-1 hover:text-[#1cb0f6]" />
                )}
              </button>
            );
          })}
        </div>

        {/* Right Column: Vietnamese Meanings */}
        <div className="space-y-2 sm:space-y-3 min-w-0">
          <div className="text-[10px] sm:text-[11px] font-black uppercase text-[#afafaf] tracking-wider text-center">
            Nghĩa tiếng Việt
          </div>
          {cards.vi.map((card) => {
            const isMatched = matchedPairIdxs.includes(card.pairIdx);
            const isSelected = selectedCard?.id === card.id;
            const isShaking = shakeCardIds.includes(card.id);

            let style = "bg-white border-[#e5e5e5] text-[#4b4b4b] hover:border-[#ff4b4b] shadow-sm";
            if (isMatched) {
              style = "bg-[#f0fff0] border-[#58cc02] text-[#46a302] font-black cursor-default opacity-90 shadow-none";
            } else if (isShaking) {
              style = "bg-[#fff0f0] border-[#ff4b4b] text-[#ff4b4b] shake-error font-black";
            } else if (isSelected) {
              style = "bg-[#fff0f0] border-[#ff4b4b] text-[#ff4b4b] ring-2 sm:ring-4 ring-[#ff4b4b]/20 font-black scale-[1.02]";
            }

            return (
              <button
                key={card.id}
                type="button"
                disabled={isMatched || isAnswered}
                onClick={() => handleCardClick(card)}
                className={`w-full min-h-[44px] p-2 sm:p-3.5 rounded-xl sm:rounded-[20px] border-2 text-left font-black text-xs sm:text-sm md:text-base transition-all flex items-center justify-between cursor-pointer select-none gap-1 ${style}`}
              >
                <span className="truncate flex-1 min-w-0">{card.text}</span>
                {isMatched && (
                  <CheckCircle2 size={16} className="text-[#58cc02] shrink-0 ml-1" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

interface WordOrderProps {
  question: QuizQuestion;
  assembledWords: string[];
  setAssembledWords: React.Dispatch<React.SetStateAction<string[]>>;
  isAnswered: boolean;
  isLastAnswerCorrect: boolean | null;
}

const WordOrderQuestion: React.FC<WordOrderProps> = ({
  question,
  assembledWords,
  setAssembledWords,
  isAnswered,
  isLastAnswerCorrect
}) => {
  const pool = question.wordsPool || (question.targetSentence ? question.targetSentence.split(/\s+/) : []);
  const [placedPoolIndices, setPlacedPoolIndices] = useState<number[]>([]);

  useEffect(() => {
    setPlacedPoolIndices([]);
    setAssembledWords([]);
  }, [question]);

  const handlePickWord = (word: string, poolIdx: number) => {
    if (isAnswered) return;
    if (placedPoolIndices.includes(poolIdx)) return;
    setPlacedPoolIndices(prev => [...prev, poolIdx]);
    setAssembledWords(prev => [...prev, word]);
    playTTS(word);
  };

  const handleRemoveWord = (wordIdx: number) => {
    if (isAnswered) return;
    setPlacedPoolIndices(prev => prev.filter((_, idx) => idx !== wordIdx));
    setAssembledWords(prev => prev.filter((_, idx) => idx !== wordIdx));
  };

  const handleReset = () => {
    if (isAnswered) return;
    setPlacedPoolIndices([]);
    setAssembledWords([]);
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full">
      {/* Target Translation Banner */}
      {question.translationHint && (
        <div className="p-3 sm:p-4 bg-[#fffbf0] rounded-xl sm:rounded-[24px] border-2 border-[#ff9600]/25 flex items-start gap-2.5 sm:gap-3 shadow-xs">
          <MessageSquare className="text-[#ff9600] shrink-0 mt-0.5" size={18} />
          <div className="min-w-0 flex-1">
            <span className="text-[10px] sm:text-[11px] font-black uppercase text-[#ff9600] tracking-wider block mb-0.5">
              Nghĩa tiếng Việt cần ghép:
            </span>
            <p className="text-sm sm:text-lg font-[900] text-[#4b4b4b] break-words">
              "{question.translationHint}"
            </p>
          </div>
        </div>
      )}

      {/* Assembly Slot */}
      <div className="space-y-1.5 sm:space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] sm:text-xs font-black text-[#afafaf] uppercase tracking-wider">
            Câu ghép của bạn ({assembledWords.length} từ):
          </span>
          {assembledWords.length > 0 && !isAnswered && (
            <button
              type="button"
              onClick={handleReset}
              className="text-[11px] sm:text-xs font-black text-[#ff4b4b] hover:text-[#d33030] flex items-center gap-1 cursor-pointer transition-colors"
            >
              <RotateCcw size={12} /> Làm lại
            </button>
          )}
        </div>

        <div className={`min-h-[70px] sm:min-h-[100px] p-2 sm:p-4 md:p-5 rounded-xl sm:rounded-[28px] border-2 sm:border-3 border-dashed transition-all flex flex-wrap gap-1.5 sm:gap-2.5 items-center content-center w-full max-w-full ${
          isAnswered 
            ? isLastAnswerCorrect 
              ? 'bg-[#f0fff0] border-[#58cc02]' 
              : 'bg-[#fff0f0] border-[#ff4b4b]'
            : assembledWords.length > 0
              ? 'bg-white border-[#1cb0f6] shadow-sm'
              : 'bg-[#fdfbf7] border-[#d8d8d8]'
        }`}>
          {assembledWords.length === 0 ? (
            <div className="w-full text-center text-xs sm:text-sm font-bold text-[#afafaf] italic py-2 select-none">
              Chạm vào các thẻ từ bên dưới để ghép câu...
            </div>
          ) : (
            assembledWords.map((word, idx) => (
              <button
                key={idx}
                type="button"
                disabled={isAnswered}
                onClick={() => handleRemoveWord(idx)}
                className={`px-2.5 py-1.5 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-2xl font-black text-xs sm:text-sm md:text-base border-2 shadow-xs transition-all flex items-center gap-1 cursor-pointer max-w-full ${
                  isAnswered
                    ? isLastAnswerCorrect
                      ? 'bg-[#58cc02] text-white border-[#46a302]'
                      : 'bg-[#ff4b4b] text-white border-[#d33030]'
                    : 'bg-white hover:bg-[#fff0f0] text-[#4b4b4b] hover:text-[#ff4b4b] border-[#e5e5e5] hover:border-[#ff4b4b]/30 active:scale-95'
                }`}
                title={!isAnswered ? "Nhấn để gỡ từ này" : undefined}
              >
                <span className="truncate">{word}</span>
                {!isAnswered && <X size={11} className="opacity-60 shrink-0" />}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Words Pool Bank */}
      <div className="space-y-1.5 sm:space-y-2">
        <div className="text-[10px] sm:text-xs font-black text-[#afafaf] uppercase tracking-wider px-1">
          Kho từ vựng có sẵn:
        </div>
        <div className="flex flex-wrap gap-1.5 sm:gap-2.5 p-2.5 sm:p-4 bg-[#f9f9f9] rounded-xl sm:rounded-[26px] border-2 border-[#f0f0f0] min-h-[60px] sm:min-h-[75px] items-center w-full max-w-full">
          {pool.map((word, poolIdx) => {
            const isUsed = placedPoolIndices.includes(poolIdx);
            return (
              <button
                key={poolIdx}
                type="button"
                disabled={isUsed || isAnswered}
                onClick={() => handlePickWord(word, poolIdx)}
                className={`min-h-[40px] px-2.5 py-1.5 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-2xl font-black text-xs sm:text-sm md:text-base transition-all border-b-2 sm:border-b-4 select-none ${
                  isUsed
                    ? 'bg-[#e5e5e5] border-[#d4d4d4] text-transparent opacity-25 cursor-default'
                    : 'bg-white hover:bg-gray-50 text-[#4b4b4b] border-2 border-b-2 sm:border-b-4 border-[#e5e5e5] active:border-b-2 active:translate-y-0.5 hover:border-[#1cb0f6] cursor-pointer shadow-xs'
                }`}
              >
                {word}
              </button>
            );
          })}
        </div>
      </div>

      {/* Audio Button for assembled sentence */}
      {assembledWords.length > 0 && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => playTTS(assembledWords.join(' '))}
            className="px-4 py-2 bg-white hover:bg-gray-50 text-[#777] hover:text-[#ff4b4b] rounded-xl text-xs font-black border border-[#e5e5e5] shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Volume2 size={15} className="text-[#ff4b4b]" />
            <span>Nghe câu đang ghép</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default function Dashboard({ stats, onUpdateProfile, setIsLessonMode }: { stats: UserStats, onUpdateProfile: (d: Partial<UserStats>) => void, setIsLessonMode: (val: boolean) => void }) {
  const [units, setUnits] = useState<Unit[]>([]);
  const [activeLesson, setActiveLesson] = useState<any>(null);
  const [step, setStep] = useState(0); // 0: Dialogue, 1: 20 Questions, 2: Completed
  const [currentQuizIdx, setCurrentQuizIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [assembledWords, setAssembledWords] = useState<string[]>([]);
  const [isCardMatchComplete, setIsCardMatchComplete] = useState<boolean>(false);
  const [isAnswered, setIsAnswered] = useState(false);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [categoryScores, setCategoryScores] = useState({
    vocabulary: 0,
    part_of_speech: 0,
    pronunciation: 0,
    memory: 0,
    sentence_matching: 0
  });
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showFireworks, setShowFireworks] = useState(false);
  const [isWrongAnswer, setIsWrongAnswer] = useState(false);
  const [isLastAnswerCorrect, setIsLastAnswerCorrect] = useState<boolean | null>(null);
  const [visibleDialogueLines, setVisibleDialogueLines] = useState<number>(0);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [showDialogueModal, setShowDialogueModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [selectedGuidebookUnit, setSelectedGuidebookUnit] = useState<Unit | null>(null);
  const [openedChests, setOpenedChests] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('linguist_chests') || '[]');
    } catch (e) {
      return [];
    }
  });
  const [chestReward, setChestReward] = useState<{ title: string; gems: number; exp: number } | null>(null);

  // GHI ÂM VÀ NHẬN XÉT PHÁT ÂM TRONG BÀI HỌC
  const [isRecordingPronunciation, setIsRecordingPronunciation] = useState(false);
  const [recordedPronunciationText, setRecordedPronunciationText] = useState('');
  const [pronunciationEvaluation, setPronunciationEvaluation] = useState<PronunciationEvaluation | null>(null);
  const [isEvaluatingPronunciation, setIsEvaluatingPronunciation] = useState(false);
  const [showPronunciationDrill, setShowPronunciationDrill] = useState(false);
  const speechRecognitionRef = useRef<any>(null);

  // Tự động reset khi chuyển câu hỏi
  useEffect(() => {
    setPronunciationEvaluation(null);
    setRecordedPronunciationText('');
    setIsRecordingPronunciation(false);
    if (speechRecognitionRef.current) {
      try { speechRecognitionRef.current.stop(); } catch (e) {}
    }
  }, [currentQuizIdx, activeLesson]);

  const getTargetPronunciation = (q: QuizQuestion | undefined): string => {
    if (!q) return "Hello";
    if (q.audioPrompt) return q.audioPrompt;
    if (q.targetSentence) return q.targetSentence;
    const match = q.question.match(/"([^"]+)"/);
    if (match && match[1] && match[1].length < 35) {
      return match[1];
    }
    if (q.options && typeof q.correctAnswer === 'number' && q.options[q.correctAnswer]) {
      const opt = q.options[q.correctAnswer];
      if (/^[a-zA-Z\s,.'"-]+$/.test(opt) && opt.length < 30) {
        return opt;
      }
    }
    return q.options?.[0] || "Pronounce clearly";
  };

  const handleStartPronunciationRecording = (targetWord: string) => {
    playClickSound();
    setRecordedPronunciationText('');
    setPronunciationEvaluation(null);

    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Trình duyệt chưa hỗ trợ Web Speech API trên micro. Bạn hãy dùng Chrome hoặc Edge để ghi âm phát âm nhé!");
      return;
    }

    try {
      if (speechRecognitionRef.current) {
        try { speechRecognitionRef.current.stop(); } catch (e) {}
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecordingPronunciation(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setRecordedPronunciationText(transcript);
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        setIsRecordingPronunciation(false);
      };

      recognition.onend = () => {
        setIsRecordingPronunciation(false);
      };

      speechRecognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.warn("Error starting speech recognition:", e);
      setIsRecordingPronunciation(false);
    }
  };

  const handleStopPronunciationRecording = async (targetWord: string) => {
    if (speechRecognitionRef.current) {
      try { speechRecognitionRef.current.stop(); } catch (e) {}
    }
    setIsRecordingPronunciation(false);

    setIsEvaluatingPronunciation(true);
    const spoken = recordedPronunciationText.trim();
    const result = await evaluatePronunciation(targetWord, spoken);
    setPronunciationEvaluation(result);
    setIsEvaluatingPronunciation(false);

    if (result.isGood) {
      playCorrectSound();
      setShowFireworks(true);
      setTimeout(() => setShowFireworks(false), 1600);
      onUpdateProfile({
        exp: (stats.exp ?? 0) + 10,
        gems: (stats.gems ?? 150) + 1
      });
    } else {
      playIncorrectSound();
    }
  };

  const handleOpenChest = (chestId: string, gems: number, exp: number, title: string) => {
    if (openedChests.includes(chestId)) {
      alert("Bạn đã mở rương kho báu này rồi!");
      return;
    }
    playChestSound();
    const next = [...openedChests, chestId];
    setOpenedChests(next);
    localStorage.setItem('linguist_chests', JSON.stringify(next));
    onUpdateProfile({
      gems: (stats.gems ?? 150) + gems,
      exp: (stats.exp ?? 0) + exp
    });
    setChestReward({ title, gems, exp });
  };

  const chatEndRef = useRef<HTMLDivElement>(null);
  const animationTimerRef = useRef<any>(null);

  const isIeltsMode = stats.studyMode === 'ielts';

  const handleDeleteAiUnit = (unitId: string, unitTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    playClickSound();
    const aiUnits = JSON.parse(localStorage.getItem('linguist_ai_units_complex') || '[]');
    const filtered = aiUnits.filter((u: any) => u.id !== unitId);
    localStorage.setItem('linguist_ai_units_complex', JSON.stringify(filtered));
    setUnits(prev => prev.filter(u => u.id !== unitId));
    if (selectedGuidebookUnit?.id === unitId) {
      setSelectedGuidebookUnit(null);
    }
  };

  const handleAddSingleWordToNotebook = (v: any, topicTitle: string) => {
    playClickSound();
    const existing = stats.learnedWords || [];
    if (existing.some(w => w.word.toLowerCase() === v.word.toLowerCase())) return;
    const cleanTopic = topicTitle.replace('Chủ đề: ', '');
    const newWord: VocabularyWord = {
      word: v.word,
      meaning: v.meaning,
      example: v.example || '',
      phonetic: v.phonetic || '',
      mastery: 20,
      topic: cleanTopic
    };
    onUpdateProfile({
      learnedWords: [...existing, newWord]
    });
  };

  const handleSaveAllWordsToNotebook = (highlights: any[], topicTitle: string) => {
    playChestSound();
    const existing = stats.learnedWords || [];
    const existingSet = new Set(existing.map(w => w.word.toLowerCase()));
    const cleanTopic = topicTitle.replace('Chủ đề: ', '');
    const toAdd: VocabularyWord[] = highlights
      .filter((h: any) => !existingSet.has(h.word.toLowerCase()))
      .map((h: any) => ({
        word: h.word,
        meaning: h.meaning,
        example: h.example || '',
        phonetic: h.phonetic || '',
        mastery: 20,
        topic: cleanTopic
      }));
    if (toAdd.length > 0) {
      onUpdateProfile({
        learnedWords: [...existing, ...toAdd]
      });
      alert(`Đã lưu thành công ${toAdd.length} từ vựng vào Sổ tay của bạn!`);
    } else {
      alert("Tất cả từ vựng của chủ đề này đã có trong Sổ tay rồi!");
    }
  };

  useEffect(() => {
    const customUnits = JSON.parse(localStorage.getItem('linguist_units') || '[]');
    const aiUnits = JSON.parse(localStorage.getItem('linguist_ai_units_complex') || '[]');
    setUnits([...aiUnits, ...DEFAULT_UNITS, ...customUnits]);
  }, [activeLesson]);

  useEffect(() => {
    setIsLessonMode(!!activeLesson);
    if (activeLesson && step === 0) {
      setVisibleDialogueLines(0);
      setCurrentQuizIdx(0);
      setSelectedOpt(null);
      setAssembledWords([]);
      setIsCardMatchComplete(false);
      setIsAnswered(false);
      setCorrectCount(0);
      setCategoryScores({
        vocabulary: 0,
        part_of_speech: 0,
        pronunciation: 0,
        memory: 0,
        sentence_matching: 0
      });
      startDialogueAnimation();
    } else {
      clearTimers();
    }
    return () => clearTimers();
  }, [activeLesson, step]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [visibleDialogueLines, isTyping]);

  const clearTimers = () => { 
    if (animationTimerRef.current) clearTimeout(animationTimerRef.current); 
  };

  const getLessonDialogueLines = (lesson: any) => {
    const script = lesson?.videoContext?.script || '';
    const raw = script.split('\n').filter((l: string) => l.trim().length > 0);
    if (raw.length >= 2) return raw;
    return [
      `A: Welcome to our lesson on ${lesson?.title || 'English'}! Let's explore key expressions today.`,
      `B: Hi Alex! What are we going to practice in this lesson?`,
      `A: We will learn useful vocabulary, correct grammar and practice conversation.`,
      `B: That sounds wonderful! Let's get started right away.`
    ];
  };

  const startDialogueAnimation = () => {
    const lines = getLessonDialogueLines(activeLesson);
    let currentIdx = 0;
    const animate = () => {
      if (currentIdx < lines.length) {
        setIsTyping(true);
        animationTimerRef.current = setTimeout(() => {
          setIsTyping(false);
          setVisibleDialogueLines(prev => prev + 1);
          currentIdx++;
          animationTimerRef.current = setTimeout(animate, 1200);
        }, 900);
      }
    };
    animate();
  };

  const showAllDialogue = () => {
    clearTimers();
    setIsTyping(false);
    const lines = getLessonDialogueLines(activeLesson);
    setVisibleDialogueLines(lines.length);
  };

  // Chuẩn hóa và làm sạch bộ câu hỏi để đảm bảo 100% hiển thị đáp án và tương tác được
  const rawQuestions = activeLesson?.quiz?.questions?.length >= 10 
    ? activeLesson.quiz.questions 
    : (activeLesson?.quiz?.questions?.length ? activeLesson.quiz.questions : DEFAULT_20_QUESTIONS);

  const currentQuestions: QuizQuestion[] = useMemo(() => {
    const highlights = activeLesson?.readingContent?.highlights || [];
    const lessonTopic = activeLesson?.title?.replace(/^chủ đề:\s*/i, '') || 'Tiếng Anh';

    return (rawQuestions || []).map((q: any, idx: number): QuizQuestion => {
      const hasMatchPairs = Array.isArray(q.matchPairs) && q.matchPairs.length >= 2;
      const hasWordOrder = Boolean(q.targetSentence) || (Array.isArray(q.wordsPool) && q.wordsPool.length >= 2);
      
      let type: 'card_match' | 'word_order' | 'multiple_choice' = 'multiple_choice';
      let matchPairs = q.matchPairs;
      let targetSentence = q.targetSentence;
      let wordsPool = q.wordsPool;

      if (q.type === 'card_match') {
        if (hasMatchPairs) {
          type = 'card_match';
        } else if (highlights.length >= 2) {
          type = 'card_match';
          matchPairs = highlights.slice(0, 4).map((h: any) => ({ en: h.word, vi: h.meaning }));
        } else {
          type = 'multiple_choice';
        }
      } else if (q.type === 'word_order') {
        if (hasWordOrder) {
          type = 'word_order';
          if (!targetSentence && Array.isArray(wordsPool)) targetSentence = wordsPool.join(' ');
          if (!wordsPool && targetSentence) wordsPool = targetSentence.split(/\s+/);
        } else {
          type = 'multiple_choice';
        }
      } else {
        type = 'multiple_choice';
      }

      // Xử lý Multiple Choice: 100% LUÔN CÓ ÍT NHẤT 4 LỰA CHỌN ĐÁP ÁN ĐỂ CHỌN
      let options: string[] = [];
      if (Array.isArray(q.options) && q.options.length >= 2) {
        options = q.options.map(String);
      } else {
        const vocabItem = highlights[idx % Math.max(1, highlights.length)];
        const correctText = vocabItem ? `${vocabItem.meaning} (${vocabItem.word})` : `Khái niệm chuẩn về ${lessonTopic}`;
        options = [
          correctText,
          'Ý kiến phụ, chưa hoàn toàn chính xác',
          'Khái niệm khác trong bài học',
          'Không liên quan đến nội dung'
        ];
      }

      // Đảm bảo ít nhất 4 lựa chọn nếu thiếu
      while (options.length < 4) {
        options.push(`Lựa chọn bổ sung ${String.fromCharCode(65 + options.length)}`);
      }

      let correctAnswer = typeof q.correctAnswer === 'number' && q.correctAnswer >= 0 ? q.correctAnswer : 0;
      if (correctAnswer >= options.length || correctAnswer < 0) {
        correctAnswer = 0;
      }

      return {
        ...q,
        id: q.id || `q-${idx}`,
        type,
        options,
        correctAnswer,
        matchPairs: type === 'card_match' ? matchPairs : undefined,
        targetSentence: type === 'word_order' ? targetSentence : undefined,
        wordsPool: type === 'word_order' ? wordsPool : undefined,
        explanation: q.explanation || (type === 'multiple_choice' ? `Đáp án chính xác là: "${options[correctAnswer]}".` : 'Đáp án chính xác theo ngữ cảnh bài học.')
      };
    });
  }, [rawQuestions, activeLesson]);

  // Auto-read question and choices when Accessibility Mode is active (Zero delay native Web Speech TTS)
  useEffect(() => {
    if (!stats.accessibilityMode || !activeLesson || step > 1) return;
    const q = currentQuestions[currentQuizIdx];
    if (!q) return;

    let speechText = `Câu hỏi số ${currentQuizIdx + 1}. `;
    if (q.type === 'multiple_choice') {
      speechText += `${q.question}. `;
      if (q.options && q.options.length > 0) {
        q.options.forEach((opt, idx) => {
          speechText += `Lựa chọn ${idx + 1}: ${opt}. `;
        });
      }
    } else if (q.type === 'card_match') {
      speechText += `Dạng bài tập: Ghép cặp thẻ từ vựng. Hãy ghép từ tiếng Anh với nghĩa tiếng Việt tương ứng.`;
    } else if (q.type === 'word_order') {
      speechText += `Dạng bài tập: Sắp xếp các từ thành câu đúng. ${q.translationHint ? `Dịch nghĩa: ${q.translationHint}.` : ''} Hãy chọn các thẻ từ phía dưới để tạo thành câu hoàn chỉnh.`;
    }

    announceAccessibility(speechText);
  }, [currentQuizIdx, step, activeLesson, stats.accessibilityMode]);

  const handleSelectOption = (idx: number) => {
    if (isAnswered) return;
    setSelectedOpt(idx);
    if (stats.accessibilityMode) {
      const q = currentQuestions[currentQuizIdx];
      const optText = q?.options?.[idx] || '';
      announceAccessibility(`Đã chọn lựa chọn ${idx + 1}: ${optText}`);
    }
  };

  const handleCardMatchAllMatched = () => {
    setIsCardMatchComplete(true);
    setShowFireworks(true);
    setCorrectCount(prev => prev + 1);
    setIsLastAnswerCorrect(true);
    setIsAnswered(true);
    if (stats.accessibilityMode) {
      announceAccessibility("Xuất sắc! Bạn đã ghép chính xác tất cả các cặp thẻ từ vựng. Nhấn Tiếp tục.");
    }
    const q = currentQuestions[currentQuizIdx];
    const cat = (q?.category || 'vocabulary') as keyof typeof categoryScores;
    setCategoryScores(prev => ({
      ...prev,
      [cat]: (prev[cat] || 0) + 1
    }));
    setTimeout(() => setShowFireworks(false), 1800);
  };

  const handleCardMatchError = () => {
    setIsWrongAnswer(true);
    setWrongAttempts(prev => prev + 1);
    if (stats.accessibilityMode) {
      announceAccessibility("Chưa đúng cặp. Hãy thử lại cặp thẻ khác.");
    }
    setTimeout(() => setIsWrongAnswer(false), 700);
  };

  const handleCheckOrNext = () => {
    const q = currentQuestions[currentQuizIdx];
    const isCardMatch = q?.type === 'card_match' && Array.isArray(q?.matchPairs) && q.matchPairs.length >= 2;
    const isWordOrder = q?.type === 'word_order' && Boolean(q?.targetSentence || (Array.isArray(q?.wordsPool) && q.wordsPool.length > 0));

    if (!isAnswered) {
      if (isCardMatch) {
        if (!isCardMatchComplete) return;
        handleCardMatchAllMatched();
        return;
      }

      if (isWordOrder) {
        if (assembledWords.length === 0) return;
        const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
        const isCorrect = normalize(assembledWords.join(' ')) === normalize(q.targetSentence || '');
        setIsLastAnswerCorrect(isCorrect);

        if (isCorrect) {
          playCorrectSound();
          setShowFireworks(true);
          setCorrectCount(prev => prev + 1);
          const cat = (q.category || 'sentence_matching') as keyof typeof categoryScores;
          setCategoryScores(prev => ({
            ...prev,
            [cat]: (prev[cat] || 0) + 1
          }));
          if (q.targetSentence) {
            playTTS(q.targetSentence);
          }
          if (stats.accessibilityMode) {
            announceAccessibility(`Chính xác! Câu hoàn chỉnh: ${q.targetSentence}. Nhấn Tiếp tục.`);
          }
          setTimeout(() => setShowFireworks(false), 1800);
        } else {
          playIncorrectSound();
          if (!stats.isPro && (stats.hearts ?? 5) > 1) {
            onUpdateProfile({ hearts: (stats.hearts ?? 5) - 1 });
          }
          setIsWrongAnswer(true);
          setWrongAttempts(prev => prev + 1);
          if (stats.accessibilityMode) {
            announceAccessibility(`Chưa chính xác. Câu đúng là: ${q.targetSentence}. Nhấn Đã hiểu để tiếp tục.`);
          }
          setTimeout(() => setIsWrongAnswer(false), 800);
        }
        setIsAnswered(true);
        return;
      }

      // Multiple choice (luôn kiểm tra đáp án an toàn)
      if (selectedOpt === null) return;
      const isCorrect = selectedOpt === (q.correctAnswer ?? 0);
      setIsLastAnswerCorrect(isCorrect);

      if (isCorrect) {
        playCorrectSound();
        setShowFireworks(true);
        setCorrectCount(prev => prev + 1);
        const cat = (q.category || 'vocabulary') as keyof typeof categoryScores;
        setCategoryScores(prev => ({
          ...prev,
          [cat]: (prev[cat] || 0) + 1
        }));
        if (stats.accessibilityMode) {
          announceAccessibility("Chính xác! Bạn trả lời rất tốt. Nhấn Tiếp tục.");
        }
        setTimeout(() => setShowFireworks(false), 1800);
      } else {
        playIncorrectSound();
        if (!stats.isPro && (stats.hearts ?? 5) > 1) {
          onUpdateProfile({ hearts: (stats.hearts ?? 5) - 1 });
        }
        setIsWrongAnswer(true);
        setWrongAttempts(prev => prev + 1);
        if (stats.accessibilityMode) {
          const correctText = q?.options?.[q?.correctAnswer ?? 0] || '';
          announceAccessibility(`Chưa chính xác. Đáp án đúng là: ${correctText}. ${q?.explanation || ''}. Nhấn Đã hiểu để tiếp tục.`);
        }
        setTimeout(() => setIsWrongAnswer(false), 800);
      }
      setIsAnswered(true);
    } else {
      // Move to next question or complete
      playClickSound();
      setIsAnswered(false);
      setSelectedOpt(null);
      setAssembledWords([]);
      setIsCardMatchComplete(false);
      setIsLastAnswerCorrect(null);

      if (currentQuizIdx < currentQuestions.length - 1) {
        setCurrentQuizIdx(prev => prev + 1);
      } else {
        setStep(2); // Completed
      }
    }
  };

  // Hàm khởi động bài học AI chuẩn xác, cho phép học đi học lại bất cứ lúc nào
  const startAiLesson = (lesson: any) => {
    playClickSound();
    setActiveLesson(lesson);
    setStep(1); // Vào thẳng bài tập, không qua giao diện đối thoại
    setCurrentQuizIdx(0);
    setSelectedOpt(null);
    setAssembledWords([]);
    setIsCardMatchComplete(false);
    setIsAnswered(false);
    setWrongAttempts(0);
    setCorrectCount(0);
    setIsLastAnswerCorrect(null);
    setVisibleDialogueLines(0);
  };

  const handleFinish = () => {
    playChestSound();
    const earnedExp = Math.max(20, Math.round((correctCount / Math.max(1, currentQuestions.length)) * 100));
    onUpdateProfile({ 
      exp: (stats.exp ?? 0) + earnedExp, 
      gems: (stats.gems ?? 150) + 15,
      completedLessons: [...(stats.completedLessons || []), activeLesson.id] 
    });
    setActiveLesson(null); 
    setStep(0); 
    setIsLessonMode(false);
  };

  const handleCreateAiLesson = async () => {
    if (!aiTopic.trim()) return;
    setIsGenerating(true);
    const cleanTopic = aiTopic.trim();

    try {
      const lessonData = await generateRichLesson(cleanTopic, isIeltsMode ? (stats.targetBand || '6.5') : (stats.grade || '10'), isIeltsMode);
      const newLesson: RichLesson = { ...lessonData, id: 'ai-' + Date.now() };
      const newUnit: Unit = { 
        id: 'unit-ai-' + Date.now(), 
        title: `Chủ đề: ${cleanTopic}`, 
        description: `Hội thoại, từ vựng & 20 câu hỏi chuyên sâu về ${cleanTopic}`, 
        lessons: [newLesson],
        isAiUnit: true,
        topic: cleanTopic,
        createdAt: new Date().toISOString()
      };
      
      const aiUnits = JSON.parse(localStorage.getItem('linguist_ai_units_complex') || '[]');
      const updatedAiUnits = [newUnit, ...aiUnits.filter((u: any) => u.title !== newUnit.title)];
      localStorage.setItem('linguist_ai_units_complex', JSON.stringify(updatedAiUnits));

      // Tự động đồng bộ các từ vựng cốt lõi của chủ đề vào Sổ tay cá nhân (learnedWords)
      const highlights = newLesson.readingContent?.highlights || [];
      if (highlights.length > 0) {
        const existingWords = stats.learnedWords || [];
        const existingWordSet = new Set(existingWords.map(w => w.word.toLowerCase()));
        const wordsToAdd: VocabularyWord[] = highlights
          .filter((h: any) => !existingWordSet.has(h.word.toLowerCase()))
          .map((h: any) => ({
            word: h.word,
            meaning: h.meaning,
            example: h.example,
            phonetic: h.phonetic,
            mastery: 20,
            topic: cleanTopic
          }));
        
        if (wordsToAdd.length > 0) {
          onUpdateProfile({
            learnedWords: [...existingWords, ...wordsToAdd]
          });
        }
      }

      setUnits(prev => [newUnit, ...prev.filter(u => u.id !== newUnit.id)]);
      setActiveLesson(newLesson); 
      setShowAiModal(false); 
      setStep(1); // Vào thẳng 20 câu hỏi trắc nghiệm
      setAiTopic('');
    } catch (e) { 
      console.warn("AI generation fallback:", e);
      const fallback = generateTopicFallbackLesson(cleanTopic, isIeltsMode ? (stats.targetBand || '6.5') : (stats.grade || '10'), isIeltsMode);
      const newLesson: RichLesson = { ...fallback, id: 'ai-' + Date.now() };
      const newUnit: Unit = { 
        id: 'unit-ai-' + Date.now(), 
        title: `Chủ đề: ${cleanTopic}`, 
        description: `Hội thoại, từ vựng & 20 câu hỏi chuyên sâu về ${cleanTopic}`, 
        lessons: [newLesson],
        isAiUnit: true,
        topic: cleanTopic,
        createdAt: new Date().toISOString()
      };
      
      const aiUnits = JSON.parse(localStorage.getItem('linguist_ai_units_complex') || '[]');
      const updatedAiUnits = [newUnit, ...aiUnits.filter((u: any) => u.title !== newUnit.title)];
      localStorage.setItem('linguist_ai_units_complex', JSON.stringify(updatedAiUnits));

      // Đồng bộ từ vựng fallback
      const highlights = newLesson.readingContent?.highlights || [];
      if (highlights.length > 0) {
        const existingWords = stats.learnedWords || [];
        const existingWordSet = new Set(existingWords.map(w => w.word.toLowerCase()));
        const wordsToAdd: VocabularyWord[] = highlights
          .filter((h: any) => !existingWordSet.has(h.word.toLowerCase()))
          .map((h: any) => ({
            word: h.word,
            meaning: h.meaning,
            example: h.example,
            phonetic: h.phonetic,
            mastery: 20,
            topic: cleanTopic
          }));
        
        if (wordsToAdd.length > 0) {
          onUpdateProfile({
            learnedWords: [...existingWords, ...wordsToAdd]
          });
        }
      }

      setUnits(prev => [newUnit, ...prev.filter(u => u.id !== newUnit.id)]);
      setActiveLesson(newLesson); 
      setShowAiModal(false); 
      setStep(1); // Vào thẳng 20 câu hỏi trắc nghiệm
      setAiTopic('');
    } finally { 
      setIsGenerating(false); 
    }
  };

  const getCategoryDetails = (cat?: string) => {
    switch (cat) {
      case 'part_of_speech':
        return { label: 'Từ loại', icon: Tag, color: 'text-[#1cb0f6] bg-[#f0f9ff] border-[#1cb0f6]/20' };
      case 'pronunciation':
        return { label: 'Cách phát âm', icon: Volume2, color: 'text-[#ce82ff] bg-[#fbf0ff] border-[#ce82ff]/20' };
      case 'memory':
        return { label: 'Trí nhớ', icon: Brain, color: 'text-[#ff9600] bg-[#fffbf0] border-[#ff9600]/20' };
      case 'sentence_matching':
        return { label: 'Ghép đúng nghĩa câu', icon: Link2, color: 'text-[#58cc02] bg-[#f0fff0] border-[#58cc02]/20' };
      case 'vocabulary':
      default:
        return { label: 'Từ vựng', icon: BookOpen, color: 'text-[#ff4b4b] bg-[#fff0f0] border-[#ff4b4b]/20' };
    }
  };

  // LESSON MODAL VIEW
  if (activeLesson) {
    const lines = getLessonDialogueLines(activeLesson);
    const isDialogueFinished = visibleDialogueLines >= lines.length;
    const progress = step === 0 
      ? 10 
      : step === 1 
        ? 10 + Math.round(((currentQuizIdx + 1) / currentQuestions.length) * 85) 
        : 100;

    return (
      <div className="fixed inset-0 bg-[#fffdfa] z-[200] flex flex-col overflow-hidden animate-in fade-in">
        {showFireworks && <Fireworks />}

        {/* Top Header Bar */}
        <div className="h-14 sm:h-16 border-b-2 border-[#f0f0f0] px-2.5 sm:px-6 md:px-8 flex items-center justify-between bg-white z-50 shadow-xs gap-1.5 sm:gap-2 w-full max-w-full">
          <div className="flex items-center gap-1 sm:gap-3 shrink-0">
            <button 
              type="button"
              onClick={() => {
                playClickSound();
                setShowExitModal(true);
              }} 
              className="text-[#afafaf] p-1.5 sm:p-2 hover:text-[#ff4b4b] hover:bg-[#fff0f0] rounded-xl sm:rounded-2xl transition-all cursor-pointer"
              title="Thoát bài học"
              aria-label="Thoát bài học"
            >
              <X size={20} className="sm:w-6 sm:h-6" />
            </button>
            <span className="hidden md:inline text-xs font-black text-[#777] uppercase tracking-wider truncate max-w-[160px]">
              {activeLesson.title}
            </span>
          </div>

          <div className="flex-1 max-w-xs sm:max-w-xl mx-1 sm:mx-4 min-w-0">
            <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-black uppercase text-[#afafaf] mb-1">
              <span>{step === 0 ? "1. Đoạn hội thoại & Từ vựng" : step === 1 ? `2. Luyện tập (${currentQuizIdx + 1}/${currentQuestions.length})` : "Hoàn thành"}</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 sm:h-3 bg-[#f0f0f0] rounded-full overflow-hidden border border-white shadow-inner">
              <div 
                className={`${isIeltsMode ? 'bg-[#ce82ff]' : 'bg-[#ff4b4b]'} h-full transition-all duration-500 rounded-full`} 
                style={{ width: `${progress}%` }} 
              />
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
            {step === 1 && (
              <button
                type="button"
                onClick={() => setShowDialogueModal(true)}
                className="px-2 py-1 sm:px-3 sm:py-1.5 bg-[#f7f7f7] hover:bg-[#f0f0f0] text-[#4b4b4b] rounded-xl text-[11px] sm:text-xs font-black flex items-center gap-1 transition-colors cursor-pointer border border-[#e5e5e5]"
                title="Mở lại cuộc hội thoại"
              >
                <MessageSquare size={13} className="text-[#ff4b4b]" />
                <span className="hidden sm:inline">Hội thoại</span>
              </button>
            )}
            <div className="flex items-center gap-1 font-black text-[#ff4b4b] px-2 py-1 sm:px-2.5 bg-[#fff0f0] rounded-full border border-[#ff4b4b]/20 text-xs shrink-0" title="Eng AI PRO Trọn Đời - Vô Hạn Tim">
              <Heart size={13} fill="currentColor" /> 
              <InfinityIcon size={13} strokeWidth={2.5} />
            </div>
          </div>
        </div>

        {/* EXIT LESSON CONFIRMATION MODAL */}
        {showExitModal && (
          <div className="fixed inset-0 bg-black/50 z-[400] flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white w-full max-w-sm sm:max-w-md rounded-[28px] sm:rounded-[36px] p-6 sm:p-8 text-center space-y-5 shadow-2xl border-4 border-[#f0f0f0] animate-in zoom-in-95">
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-3xl bg-[#fff0f0] text-[#ff4b4b] flex items-center justify-center border-2 border-[#ff4b4b]/20">
                <X size={36} strokeWidth={3} />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl sm:text-2xl font-[900] text-[#4b4b4b]">
                  Rời khỏi bài học?
                </h3>
                <p className="text-xs sm:text-sm font-bold text-[#afafaf] leading-relaxed">
                  Bạn có chắc chắn muốn thoát? Toàn bộ tiến trình làm bài học hiện tại sẽ không được lưu.
                </p>
              </div>

              <div className="space-y-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setShowExitModal(false);
                  }}
                  className="w-full py-3.5 sm:py-4 bg-[#58cc02] hover:bg-[#46a302] text-white font-[900] text-sm uppercase tracking-wider rounded-2xl border-b-4 border-[#3a8a01] active:translate-y-0.5 cursor-pointer shadow-md"
                >
                  TIẾP TỤC HỌC
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setShowExitModal(false);
                    clearTimers();
                    stopTTS();
                    setActiveLesson(null);
                    setIsLessonMode(false);
                  }}
                  className="w-full py-3 sm:py-3.5 bg-transparent hover:bg-gray-100 text-[#ff4b4b] font-[900] text-xs uppercase tracking-wider rounded-2xl cursor-pointer transition-colors"
                >
                  THOÁT BÀI HỌC
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DIALOGUE REVIEW MODAL */}
        {showDialogueModal && (
          <div className="fixed inset-0 bg-black/40 z-[300] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white w-full max-w-2xl rounded-[32px] p-6 md:p-8 space-y-5 shadow-2xl relative border-4 border-[#f0f0f0] max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b-2 border-[#f0f0f0]">
                <h3 className="text-lg font-black text-[#4b4b4b] flex items-center gap-2">
                  <MessageSquare className="text-[#ff4b4b]" size={22} /> Nội dung cuộc hội thoại
                </h3>
                <button 
                  onClick={() => setShowDialogueModal(false)}
                  className="text-[#afafaf] hover:text-[#ff4b4b] p-1.5 rounded-full hover:bg-gray-100"
                >
                  <X size={22} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 p-2 custom-scrollbar">
                {lines.map((line: string, i: number) => {
                  const isA = line.trim().toUpperCase().startsWith('A:');
                  const content = line.replace(/^[AB]:/i, '').trim();
                  return (
                    <div key={i} className={`flex w-full ${isA ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[85%] flex flex-col ${isA ? 'items-start' : 'items-end'}`}>
                        <span className="text-[10px] font-black text-[#afafaf] uppercase mb-1">
                          {isA ? 'Alex (Giáo viên)' : 'Bạn (Học viên)'}
                        </span>
                        <div className={`p-4 rounded-[20px] font-bold text-sm shadow-xs border ${
                          isA ? 'bg-white text-[#4b4b4b] rounded-tl-none border-[#f0f0f0]' 
                              : 'bg-[#ff4b4b] text-white rounded-tr-none border-[#d33030]'
                        }`}>
                          {content}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button 
                onClick={() => setShowDialogueModal(false)}
                className="w-full py-4 bg-[#ff4b4b] text-white font-black rounded-2xl text-sm uppercase tracking-wider cursor-pointer"
              >
                ĐÃ HIỂU, TIẾP TỤC LÀM BÀI
              </button>
            </div>
          </div>
        )}

        {/* MAIN LESSON CONTAINER */}
        <div className="flex-1 overflow-y-auto flex flex-col items-center py-6 px-4 custom-scrollbar">
          
          {/* STEP 0: ĐOẠN HỘI THOẠI & TỪ VỰNG TRỌNG TÂM */}
          {step === 0 && (
            <div className="w-full max-w-2xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-200 pb-10">
              {/* Dialogue Container Card */}
              <div className="bg-white rounded-[28px] sm:rounded-[36px] p-5 sm:p-7 border-2 sm:border-4 border-[#f0f0f0] shadow-sm space-y-5">
                <div className="flex items-center justify-between gap-2 border-b-2 border-[#f0f0f0] pb-4">
                  <span className="px-3.5 py-1.5 rounded-full bg-[#f0fff0] border border-[#58cc02]/30 text-[#58cc02] text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-2xs">
                    <MessageSquare size={15} /> Đoạn Hội Thoại Bài Học
                  </span>
                  <div className="flex items-center gap-2">
                    {!isDialogueFinished && (
                      <button
                        type="button"
                        onClick={showAllDialogue}
                        className="text-xs font-black text-[#1cb0f6] hover:underline cursor-pointer px-2 py-1"
                      >
                        Hiện toàn bộ
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        if (activeLesson.videoContext?.script) {
                          playTTS(activeLesson.videoContext.script);
                        }
                      }}
                      className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-[#f0f9ff] text-[#1cb0f6] hover:bg-[#e0f2fe] transition-colors cursor-pointer border border-[#1cb0f6]/20 font-black text-xs flex items-center gap-1.5"
                      title="Nghe toàn bộ hội thoại"
                    >
                      <Volume2 size={16} />
                      <span className="hidden sm:inline">Phát âm</span>
                    </button>
                  </div>
                </div>

                <div>
                  <h2 className="text-xl sm:text-2xl font-[900] text-[#4b4b4b] leading-tight">
                    {activeLesson.title}
                  </h2>
                  {activeLesson.videoContext?.description && (
                    <p className="text-xs sm:text-sm font-bold text-[#afafaf] mt-1 leading-relaxed">
                      {activeLesson.videoContext.description}
                    </p>
                  )}
                </div>

                {/* Animated Speech Dialogue Lines */}
                <div className="space-y-4 pt-2">
                  {lines.slice(0, Math.max(1, visibleDialogueLines)).map((line: string, i: number) => {
                    const isA = line.trim().toUpperCase().startsWith('A:');
                    const content = line.replace(/^[AB]:/i, '').trim();

                    return (
                      <div key={i} className={`flex items-start gap-2.5 sm:gap-3.5 ${isA ? 'justify-start' : 'justify-end flex-row-reverse'}`}>
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl shrink-0 overflow-hidden border-2 border-white shadow-sm flex items-center justify-center bg-gray-100">
                          {isA ? (
                            <img src={APP_LOGO_URL} alt="Alex" className="w-full h-full object-contain pointer-events-none select-none" />
                          ) : (
                            <div className="w-full h-full bg-[#58cc02] text-white flex items-center justify-center font-black text-xs sm:text-sm">
                              Bạn
                            </div>
                          )}
                        </div>

                        <div className={`max-w-[82%] space-y-1 ${isA ? 'items-start' : 'items-end'}`}>
                          <div className={`flex items-center gap-2 px-1 ${isA ? 'justify-start' : 'justify-end'}`}>
                            <span className="text-[10px] font-black text-[#afafaf] uppercase tracking-wider">
                              {isA ? 'Alex (Giáo viên AI)' : 'Bạn (Học viên)'}
                            </span>
                            <button
                              type="button"
                              onClick={() => playTTS(content)}
                              className="text-[#afafaf] hover:text-[#1cb0f6] cursor-pointer transition-colors"
                              title="Nghe phát âm câu này"
                            >
                              <Volume2 size={13} />
                            </button>
                          </div>
                          <div className={`p-3.5 sm:p-4 rounded-[22px] font-bold text-xs sm:text-sm leading-relaxed shadow-xs border-2 ${
                            isA 
                              ? 'bg-[#f7f7f7] text-[#4b4b4b] border-[#e5e5e5] rounded-tl-sm' 
                              : 'bg-[#58cc02] text-white border-[#46a302] rounded-tr-sm'
                          }`}>
                            {content}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {isTyping && (
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-2xl w-fit border border-gray-200">
                      <span className="text-xs font-black text-[#afafaf]">Alex đang soạn câu tiếp theo...</span>
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-[#58cc02] rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-1.5 bg-[#58cc02] rounded-full animate-bounce [animation-delay:0.2s]"></span>
                        <span className="w-1.5 h-1.5 bg-[#58cc02] rounded-full animate-bounce [animation-delay:0.4s]"></span>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
              </div>

              {/* Key Vocabulary Highlights from Dialogue */}
              {activeLesson.readingContent?.highlights && activeLesson.readingContent.highlights.length > 0 && (
                <div className="bg-white rounded-[28px] sm:rounded-[32px] p-5 sm:p-6 border-2 sm:border-4 border-[#f0f0f0] shadow-sm space-y-3.5">
                  <h3 className="font-[900] text-sm sm:text-base text-[#4b4b4b] flex items-center gap-2">
                    <BookOpen className="text-[#1cb0f6]" size={18} /> Từ vựng trọng tâm trong đoạn thoại
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {activeLesson.readingContent.highlights.map((h: any, idx: number) => (
                      <div key={idx} className="p-3.5 bg-[#f0f9ff] rounded-2xl border border-[#1cb0f6]/25 flex items-start justify-between gap-2 shadow-2xs">
                        <div>
                          <div className="font-black text-sm text-[#0284c7] flex items-center gap-1.5">
                            <span>{h.word}</span>
                            <button
                              type="button"
                              onClick={() => playTTS(h.word)}
                              className="text-[#0284c7] hover:scale-110 cursor-pointer"
                              title="Nghe phát âm"
                            >
                              <Volume2 size={15} />
                            </button>
                          </div>
                          <div className="text-xs font-bold text-[#4b4b4b] mt-0.5">{h.meaning}</div>
                          {h.example && <div className="text-[11px] text-[#777] italic mt-1 font-medium">"{h.example}"</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Grammar Point Card */}
              {activeLesson.grammarPoint && (
                <div className="bg-[#fffbf0] rounded-[28px] sm:rounded-[32px] p-5 sm:p-6 border-2 border-[#ffc800]/30 shadow-sm space-y-2">
                  <h3 className="font-[900] text-sm sm:text-base text-[#b45309] flex items-center gap-2">
                    <Sparkles className="text-[#ff9600]" size={18} /> Ngữ pháp: {activeLesson.grammarPoint.title}
                  </h3>
                  <p className="text-xs sm:text-sm font-bold text-[#78350f] leading-relaxed">
                    {activeLesson.grammarPoint.rule}
                  </p>
                  {activeLesson.grammarPoint.examples && activeLesson.grammarPoint.examples.length > 0 && (
                    <div className="pt-1 space-y-1">
                      {activeLesson.grammarPoint.examples.map((ex: any, i: number) => (
                        <div key={i} className="text-xs font-bold text-[#92400e] bg-white/70 px-3 py-1.5 rounded-xl border border-[#ffc800]/20 flex items-center justify-between">
                          <span>{ex.en} - <em>{ex.vi}</em></span>
                          <button type="button" onClick={() => playTTS(ex.en)} className="text-[#b45309] hover:scale-110 ml-2">
                            <Volume2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Primary Call-to-action button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    clearTimers();
                    setStep(1);
                  }}
                  className="w-full py-4 sm:py-5 bg-[#58cc02] hover:bg-[#46a302] text-white font-[900] text-sm sm:text-lg uppercase tracking-wider rounded-2xl sm:rounded-[24px] shadow-lg border-b-4 sm:border-b-[6px] border-[#3a8a01] active:translate-y-1 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>BẮT ĐẦU LUYỆN TẬP 20 CÂU HỎI</span>
                  <ArrowRight size={20} strokeWidth={3} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 1: 20 CÂU HỎI CHUYÊN SÂU (LUYỆN TẬP) */}
          {step === 1 && currentQuestions[currentQuizIdx] && (
            <div className={`w-full max-w-2xl mx-auto space-y-6 animate-in zoom-in-95 duration-200 ${isWrongAnswer ? 'shake-error' : ''}`}>
              {(() => {
                const q = currentQuestions[currentQuizIdx];
                const catDetails = getCategoryDetails(q.category);
                const IconComponent = catDetails.icon;

                return (
                  <>
                    {/* Category Header */}
                    <div className="flex items-center justify-between">
                      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl border font-black text-xs uppercase tracking-wider ${catDetails.color}`}>
                        <IconComponent size={16} />
                        <span>Chuyên sâu: {catDetails.label}</span>
                      </div>
                      <span className="text-xs font-black text-[#afafaf] uppercase tracking-wider">
                        Câu {currentQuizIdx + 1} / {currentQuestions.length}
                      </span>
                    </div>

                    {/* Question Card with Duolingo Mascot Speech Bubble */}
                    <div className="p-3.5 sm:p-6 md:p-8 bg-white duo-card space-y-4 sm:space-y-6 shadow-xl border-2 sm:border-4 border-[#f0f0f0] rounded-[24px] sm:rounded-[32px] w-full max-w-full">
                      {/* Character Mascot & Speech Bubble */}
                      <div className="flex items-start md:items-end gap-2.5 sm:gap-3.5 pt-1">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 shrink-0 relative">
                          <img 
                            src={APP_LOGO_URL} 
                            alt="Alex Mascot" 
                            className={`w-full h-full object-contain drop-shadow-md transition-transform pointer-events-none select-none ${
                              isAnswered && isLastAnswerCorrect 
                                ? 'scale-110 animate-bounce' 
                                : isWrongAnswer 
                                  ? 'rotate-12' 
                                  : ''
                            }`} 
                            draggable={false}
                          />
                        </div>
                        <div className="relative flex-1 bg-[#f7f7f7] border-2 border-[#e5e5e5] rounded-2xl sm:rounded-3xl rounded-bl-sm p-3 sm:p-4 md:p-5 shadow-xs min-w-0">
                          {/* Triangle tail pointing to mascot */}
                          <div className="absolute -left-2 bottom-3 w-3.5 h-3.5 bg-[#f7f7f7] border-b-2 border-l-2 border-[#e5e5e5] -rotate-45"></div>
                          
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 sm:gap-3">
                            <h3 className="text-base sm:text-lg md:text-xl font-[900] leading-snug text-[#4b4b4b] break-words flex-1 min-w-0">
                              {q.question}
                            </h3>
                            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-start">
                              {q.audioPrompt && (
                                <button
                                  type="button"
                                  onClick={() => playTTS(q.audioPrompt!)}
                                  className="p-2 sm:p-2.5 bg-[#1cb0f6] hover:bg-[#1899d6] text-white rounded-xl sm:rounded-2xl shadow-xs transition-transform active:scale-95 cursor-pointer"
                                  title="Nghe câu hỏi"
                                >
                                  <Volume2 size={17} />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  playClickSound();
                                  setShowPronunciationDrill(prev => !prev);
                                }}
                                className={`p-2 sm:p-2.5 rounded-xl sm:rounded-2xl shadow-xs transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5 ${
                                  showPronunciationDrill || q.category === 'pronunciation'
                                    ? 'bg-[#ce82ff] text-white'
                                    : 'bg-white hover:bg-gray-100 text-[#4b4b4b] border border-[#e5e5e5]'
                                }`}
                                title="Ghi âm phát âm để Alex nhận xét"
                              >
                                <Mic size={17} className={isRecordingPronunciation ? "animate-bounce text-[#ff4b4b]" : ""} />
                                <span className="text-xs font-black hidden sm:inline">Phát âm 🎙️</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* DEDICATED PRONUNCIATION RECORDING & FEEDBACK CARD */}
                      {(() => {
                        const targetWord = getTargetPronunciation(q);
                        const isDrillVisible = showPronunciationDrill || q.category === 'pronunciation';
                        if (!isDrillVisible) return null;

                        return (
                          <div className="p-3 sm:p-4 md:p-5 bg-gradient-to-r from-[#fbf0ff] to-[#f0f9ff] rounded-[20px] sm:rounded-[24px] border-2 border-[#ce82ff]/30 space-y-3 shadow-sm animate-in fade-in duration-200 w-full max-w-full">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                                <span className="p-1 sm:p-1.5 bg-[#ce82ff] text-white rounded-lg sm:rounded-xl shadow-2xs shrink-0">
                                  <Mic size={14} />
                                </span>
                                <span className="font-[900] text-[11px] sm:text-xs uppercase tracking-wider text-[#ce82ff] truncate">
                                  Luyện phát âm cùng Alex AI
                                </span>
                              </div>
                              
                              {/* Listen Sample button */}
                              <button
                                type="button"
                                onClick={() => playTTS(targetWord)}
                                className="px-2.5 py-1 bg-white hover:bg-[#f0f9ff] text-[#1cb0f6] border border-[#1cb0f6]/30 rounded-xl text-xs font-black flex items-center gap-1 transition-colors cursor-pointer shadow-2xs shrink-0"
                                title="Nghe Alex phát âm mẫu"
                              >
                                <Volume2 size={13} />
                                <span>Nghe mẫu</span>
                              </button>
                            </div>

                            {/* Target word to pronounce */}
                            <div className="bg-white/90 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-white flex items-center justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <span className="text-[10px] font-bold text-[#afafaf] uppercase block">Từ / câu cần phát âm:</span>
                                <span className="text-base sm:text-xl font-[900] text-[#4b4b4b] tracking-tight break-words">
                                  "{targetWord}"
                                </span>
                              </div>
                              {pronunciationEvaluation && (
                                <span className={`px-2.5 py-1 rounded-full text-xs font-black shrink-0 ${
                                  pronunciationEvaluation.isGood 
                                    ? 'bg-[#f0fff0] text-[#58cc02] border border-[#58cc02]/30' 
                                    : 'bg-[#fff0f0] text-[#ff4b4b] border border-[#ff4b4b]/30'
                                }`}>
                                  {pronunciationEvaluation.score}/100 Đ
                                </span>
                              )}
                            </div>

                            {/* Recording Action Button */}
                            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
                              {!isRecordingPronunciation ? (
                                <button
                                  type="button"
                                  onClick={() => handleStartPronunciationRecording(targetWord)}
                                  className="w-full sm:flex-1 py-2.5 sm:py-3 px-4 bg-gradient-to-r from-[#ce82ff] to-[#1cb0f6] hover:brightness-105 text-white rounded-xl sm:rounded-2xl font-[900] text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
                                >
                                  <Mic size={16} />
                                  <span>{pronunciationEvaluation ? 'Ghi âm lại phát âm' : 'Bấm để ghi âm phát âm'}</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleStopPronunciationRecording(targetWord)}
                                  className="w-full sm:flex-1 py-2.5 sm:py-3 px-4 bg-[#ff4b4b] hover:bg-[#e03d3d] text-white rounded-xl sm:rounded-2xl font-[900] text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg animate-pulse transition-all active:scale-95 cursor-pointer"
                                >
                                  <div className="w-2.5 h-2.5 bg-white rounded-full animate-ping"></div>
                                  <span>Đang nghe... (Chạm để nhận xét)</span>
                                </button>
                              )}
                            </div>

                            {/* Live Transcript while speaking */}
                            {isRecordingPronunciation && (
                              <div className="p-3 bg-white rounded-xl border border-[#ff4b4b]/30 text-xs font-bold text-[#4b4b4b] animate-in fade-in flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-[#ff4b4b] animate-ping"></span>
                                <span>Alex đang nghe: <strong className="text-[#ff4b4b]">"{recordedPronunciationText || 'Hãy nói vào micro...'}"</strong></span>
                              </div>
                            )}

                            {/* Evaluating Spinner */}
                            {isEvaluatingPronunciation && (
                              <div className="p-3 bg-white rounded-xl border border-[#ce82ff]/30 text-xs font-bold text-[#ce82ff] flex items-center gap-2 animate-pulse">
                                <Loader2 size={16} className="animate-spin" />
                                <span>Alex đang chấm điểm và phân tích phát âm...</span>
                              </div>
                            )}

                            {/* Result Evaluation from Alex */}
                            {pronunciationEvaluation && !isEvaluatingPronunciation && !isRecordingPronunciation && (
                              <div className={`p-4 rounded-2xl border-2 space-y-2 animate-in zoom-in-95 text-xs ${
                                pronunciationEvaluation.isGood 
                                  ? 'bg-[#f0fff0] border-[#58cc02]/30 text-[#4b4b4b]' 
                                  : 'bg-[#fffdf7] border-[#ffc800]/40 text-[#4b4b4b]'
                              }`}>
                                <div className="flex items-center justify-between">
                                  <span className="font-[900] flex items-center gap-1.5 text-sm">
                                    {pronunciationEvaluation.isGood ? (
                                      <>
                                        <CheckCircle2 size={18} className="text-[#58cc02]" />
                                        <span className="text-[#58cc02]">Nhận xét phát âm từ Alex: Đạt chuẩn!</span>
                                      </>
                                    ) : (
                                      <>
                                        <Sparkles size={18} className="text-[#ff9600]" />
                                        <span className="text-[#ff9600]">Nhận xét phát âm từ Alex: Cần cải thiện</span>
                                      </>
                                    )}
                                  </span>
                                  <span className="text-[11px] font-bold text-[#afafaf]">
                                    Bạn đọc: "{pronunciationEvaluation.recognizedText}"
                                  </span>
                                </div>
                                <p className="font-bold leading-relaxed text-[#4b4b4b]">
                                  {pronunciationEvaluation.feedback}
                                </p>
                                {pronunciationEvaluation.isGood && (
                                  <span className="inline-block text-[10px] font-black uppercase text-[#58cc02] bg-white px-2.5 py-1 rounded-full border border-[#58cc02]/20">
                                    +10 EXP Thưởng phát âm chuẩn xác! 🌟
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* DẠNG 1: CHỌN CẶP THẺ ĐỂ NHỚ NGHĨA CỦA TỪ */}
                      {q.type === 'card_match' && Array.isArray(q.matchPairs) && q.matchPairs.length >= 2 ? (
                        <CardMatchQuestion
                          question={q}
                          isAnswered={isAnswered}
                          onAllMatched={handleCardMatchAllMatched}
                          onError={handleCardMatchError}
                        />
                      ) : q.type === 'word_order' && ((Array.isArray(q.wordsPool) && q.wordsPool.length > 0) || Boolean(q.targetSentence)) ? (
                        /* DẠNG 2: GHÉP CHỮ ĐỂ THÀNH CÂU CÓ NGHĨA */
                        <WordOrderQuestion
                          question={q}
                          assembledWords={assembledWords}
                          setAssembledWords={setAssembledWords}
                          isAnswered={isAnswered}
                          isLastAnswerCorrect={isLastAnswerCorrect}
                        />
                      ) : (
                        /* DẠNG 3: TRẮC NGHIỆM CHUYÊN SÂU - LUÔN HIỂN THỊ ĐẦY ĐỦ CÁC LỰA CHỌN ĐÁP ÁN */
                        <div className="grid gap-3.5">
                          {(q.options && q.options.length > 0 ? q.options : ['Đáp án A', 'Đáp án B', 'Đáp án C', 'Đáp án D']).map((opt: string, i: number) => {
                            const isSelected = selectedOpt === i;
                            const isCorrect = i === q.correctAnswer;
                            const letter = String.fromCharCode(65 + i); // A, B, C, D

                            let buttonStyle = "bg-white border-[#f0f0f0] hover:bg-gray-50 text-[#4b4b4b]";
                            if (isAnswered) {
                              if (isCorrect) {
                                buttonStyle = "bg-[#f0fff0] border-[#58cc02] text-[#46a302] font-black";
                              } else if (isSelected) {
                                buttonStyle = "bg-[#fff0f0] border-[#ff4b4b] text-[#c33d3d] font-black";
                              } else {
                                buttonStyle = "bg-white border-[#f0f0f0] opacity-40 text-[#afafaf]";
                              }
                            } else if (isSelected) {
                              buttonStyle = "bg-[#fff0f0] border-[#ff4b4b] text-[#ff4b4b] shadow-md scale-[1.01]";
                            }

                            return (
                              <button
                                key={i}
                                disabled={isAnswered}
                                onClick={() => handleSelectOption(i)}
                                className={`w-full p-2.5 sm:p-4 md:p-5 rounded-xl sm:rounded-[24px] border-2 sm:border-4 text-left font-black text-sm sm:text-base md:text-lg transition-all flex items-center justify-between cursor-pointer gap-2 ${buttonStyle}`}
                              >
                                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                  <span className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center text-xs font-black border-2 shrink-0 ${
                                    isSelected 
                                      ? 'bg-[#ff4b4b] text-white border-[#ff4b4b]' 
                                      : 'bg-[#f7f7f7] text-[#777] border-[#e5e5e5]'
                                  }`}>
                                    {letter}
                                  </span>
                                  <span className="break-words flex-1 leading-snug">{opt}</span>
                                </div>
                                {isAnswered && isCorrect && (
                                  <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-[#58cc02] shrink-0 ml-1.5" />
                                )}
                                {isAnswered && isSelected && !isCorrect && (
                                  <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-[#ff4b4b] shrink-0 ml-1.5" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {/* STEP 2: HOÀN THÀNH BÀI HỌC VÀ TỔNG KẾT 20 CÂU HỎI */}
          {step === 2 && (
            <div className="w-full max-w-2xl mx-auto flex-1 flex flex-col items-center justify-center text-center animate-in zoom-in rounded-[24px] sm:rounded-[40px] bg-white p-4 sm:p-8 md:p-10 shadow-2xl border-2 sm:border-4 border-[#f0f0f0] space-y-4 sm:space-y-6">
              <div className="w-16 h-16 sm:w-24 sm:h-24 bg-[#fff0f0] rounded-2xl sm:rounded-[32px] flex items-center justify-center mx-auto border-2 sm:border-4 border-[#ff4b4b]/20">
                <Award size={36} className="text-[#ff4b4b] sm:w-12 sm:h-12" />
              </div>

              <div>
                <span className="text-[10px] sm:text-xs font-black text-[#58cc02] uppercase tracking-widest bg-[#f0fff0] px-3 py-1 sm:px-4 sm:py-1.5 rounded-full border border-[#58cc02]/20">
                  Xuất sắc hoàn thành
                </span>
                <h2 className="text-2xl sm:text-4xl font-[900] text-[#4b4b4b] mt-1.5 sm:mt-2">
                  KẾT QUẢ BÀI HỌC!
                </h2>
                <p className="text-xs sm:text-sm font-bold text-[#afafaf] mt-1">
                  Bạn đã hoàn thành cuộc hội thoại và toàn bộ 20 câu hỏi chuyên sâu.
                </p>
              </div>

              {/* Total Score Banner */}
              <div className="grid grid-cols-2 gap-2.5 sm:gap-4 w-full">
                <div className="p-3 sm:p-4 bg-[#f0fff0] rounded-xl sm:rounded-2xl border-2 border-[#58cc02]/20 flex flex-col items-center">
                  <span className="text-[10px] sm:text-xs font-black text-[#afafaf] uppercase tracking-wider">Số câu đúng</span>
                  <span className="text-2xl sm:text-3xl font-[900] text-[#58cc02]">{correctCount} / {currentQuestions.length}</span>
                </div>
                <div className="p-3 sm:p-4 bg-[#fff0f0] rounded-xl sm:rounded-2xl border-2 border-[#ff4b4b]/20 flex flex-col items-center">
                  <span className="text-[10px] sm:text-xs font-black text-[#afafaf] uppercase tracking-wider">EXP Thu hoạch</span>
                  <span className="text-2xl sm:text-3xl font-[900] text-[#ff4b4b]">+{Math.max(20, Math.round((correctCount / Math.max(1, currentQuestions.length)) * 100))}</span>
                </div>
              </div>

              {/* Category Breakdown (5 Groups) */}
              <div className="w-full space-y-2 sm:space-y-3 pt-1 text-left">
                <h4 className="text-[11px] sm:text-xs font-black text-[#afafaf] uppercase tracking-wider">
                  Kết quả 5 kỹ năng chuyên sâu:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                  <div className="p-2.5 sm:p-3 bg-[#fff0f0] rounded-xl border border-[#ff4b4b]/20 flex items-center justify-between text-xs font-black">
                    <span className="flex items-center gap-1.5 text-[#ff4b4b]">
                      <BookOpen size={14} /> 1. Từ vựng
                    </span>
                    <span className="text-[#4b4b4b]">{categoryScores.vocabulary}/4 câu</span>
                  </div>
                  <div className="p-2.5 sm:p-3 bg-[#f0f9ff] rounded-xl border border-[#1cb0f6]/20 flex items-center justify-between text-xs font-black">
                    <span className="flex items-center gap-1.5 text-[#1cb0f6]">
                      <Tag size={14} /> 2. Từ loại
                    </span>
                    <span className="text-[#4b4b4b]">{categoryScores.part_of_speech}/4 câu</span>
                  </div>
                  <div className="p-2.5 sm:p-3 bg-[#fbf0ff] rounded-xl border border-[#ce82ff]/20 flex items-center justify-between text-xs font-black">
                    <span className="flex items-center gap-1.5 text-[#ce82ff]">
                      <Volume2 size={14} /> 3. Cách phát âm
                    </span>
                    <span className="text-[#4b4b4b]">{categoryScores.pronunciation}/4 câu</span>
                  </div>
                  <div className="p-2.5 sm:p-3 bg-[#fffbf0] rounded-xl border border-[#ff9600]/20 flex items-center justify-between text-xs font-black">
                    <span className="flex items-center gap-1.5 text-[#ff9600]">
                      <Brain size={14} /> 4. Trí nhớ
                    </span>
                    <span className="text-[#4b4b4b]">{categoryScores.memory}/4 câu</span>
                  </div>
                  <div className="sm:col-span-2 p-2.5 sm:p-3 bg-[#f0fff0] rounded-xl border border-[#58cc02]/20 flex items-center justify-between text-xs font-black">
                    <span className="flex items-center gap-1.5 text-[#58cc02]">
                      <Link2 size={14} /> 5. Ghép đúng nghĩa câu
                    </span>
                    <span className="text-[#4b4b4b]">{categoryScores.sentence_matching}/4 câu</span>
                  </div>
                </div>
              </div>

              <button 
                onClick={handleFinish} 
                className="w-full py-4 sm:py-5 bg-[#ff4b4b] hover:bg-[#d33030] text-white font-[900] text-base sm:text-xl rounded-2xl sm:rounded-[28px] shadow-xl active:translate-y-1 transition-all uppercase tracking-widest cursor-pointer border-b-4 sm:border-b-[6px] border-[#d33030]"
              >
                TIẾP TỤC HÀNH TRÌNH
              </button>
            </div>
          )}
        </div>

        {/* STEP 0 ACTION BAR: DIALOGUE PROCEED */}
        {step === 0 && (
          <div className="shrink-0 z-50 w-full max-w-full bg-white border-t-2 sm:border-t-4 border-[#f0f0f0] px-3 sm:px-6 py-2.5 sm:py-4 pb-[max(12px,env(safe-area-inset-bottom))]">
            <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
              <div className="hidden sm:block text-xs font-black uppercase tracking-wider text-[#afafaf] truncate">
                Đọc đoạn hội thoại và ghi nhớ từ vựng trọng tâm trước khi làm bài tập
              </div>
              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                {!isDialogueFinished && (
                  <button
                    type="button"
                    onClick={showAllDialogue}
                    className="px-4 py-3 sm:py-3.5 bg-[#f7f7f7] hover:bg-[#e5e5e5] text-[#4b4b4b] font-black text-xs uppercase tracking-wider rounded-xl sm:rounded-2xl cursor-pointer shrink-0 transition-colors"
                  >
                    Hiện hết
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    clearTimers();
                    setStep(1);
                  }}
                  className="flex-1 sm:flex-initial px-6 sm:px-10 py-3 sm:py-3.5 bg-[#58cc02] hover:bg-[#46a302] text-white font-[900] text-xs sm:text-sm uppercase tracking-wider rounded-xl sm:rounded-2xl border-b-4 border-[#3a8a01] active:translate-y-0.5 cursor-pointer flex items-center justify-center gap-2 shadow-md transition-all"
                >
                  <span>VÀO BÀI TẬP 20 CÂU</span>
                  <ArrowRight size={16} strokeWidth={3} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SIGNATURE DUOLINGO BOTTOM ACTION BAR (FOR QUIZ STEP 1) */}
        {step === 1 && (
          <div className="shrink-0 z-50 w-full max-w-full">
            {(() => {
              const q = currentQuestions[currentQuizIdx];
              const isCardMatch = q?.type === 'card_match' && Array.isArray(q?.matchPairs) && q.matchPairs.length >= 2;
              const isWordOrder = q?.type === 'word_order' && Boolean(q?.targetSentence || (Array.isArray(q?.wordsPool) && q.wordsPool.length > 0));

              const isCheckDisabled = !isAnswered && (
                (isCardMatch && !isCardMatchComplete) ||
                (isWordOrder && assembledWords.length === 0) ||
                (!isCardMatch && !isWordOrder && selectedOpt === null)
              );

              // 1. Correct State
              if (isAnswered && isLastAnswerCorrect) {
                return (
                  <div className="bg-[#d7ffb8] border-t-2 sm:border-t-4 border-[#58cc02]/30 px-3 sm:px-6 py-3 sm:py-5 pb-[max(12px,env(safe-area-inset-bottom))] transition-colors animate-in slide-in-from-bottom-4 w-full">
                    <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-4">
                      <div className="flex items-center gap-2.5 sm:gap-4 text-left w-full sm:w-auto">
                        <div className="w-9 h-9 sm:w-14 sm:h-14 rounded-full bg-white text-[#58cc02] flex items-center justify-center shadow-md shrink-0">
                          <Check className="w-5 h-5 sm:w-8 sm:h-8" strokeWidth={4} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm sm:text-2xl font-[900] text-[#46a302] leading-tight">
                            Chính xác! Làm tốt lắm!
                          </h4>
                          <p className="text-xs sm:text-sm font-bold text-[#46a302]/90 mt-0.5 sm:mt-1 max-w-xl break-words line-clamp-2 sm:line-clamp-none">
                            {q?.explanation}
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={handleCheckOrNext} 
                        className="w-full sm:w-auto px-6 sm:px-14 py-3 sm:py-4 bg-[#58cc02] hover:bg-[#4eb702] text-white border-b-3 sm:border-b-[6px] border-[#46a302] active:translate-y-1 active:border-b-0 rounded-xl sm:rounded-[24px] font-[900] text-sm sm:text-base uppercase tracking-wider cursor-pointer shrink-0 shadow-lg"
                      >
                        {currentQuizIdx === currentQuestions.length - 1 ? 'XEM KẾT QUẢ' : 'TIẾP TỤC'}
                      </button>
                    </div>
                  </div>
                );
              }

              // 2. Incorrect State
              if (isAnswered && !isLastAnswerCorrect) {
                return (
                  <div className="bg-[#ffdfe0] border-t-2 sm:border-t-4 border-[#ff4b4b]/30 px-3 sm:px-6 py-3 sm:py-5 pb-[max(12px,env(safe-area-inset-bottom))] transition-colors animate-in slide-in-from-bottom-4 w-full">
                    <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-4">
                      <div className="flex items-center gap-2.5 sm:gap-4 text-left w-full sm:w-auto">
                        <div className="w-9 h-9 sm:w-14 sm:h-14 rounded-full bg-white text-[#ff4b4b] flex items-center justify-center shadow-md shrink-0">
                          <X className="w-5 h-5 sm:w-8 sm:h-8" strokeWidth={4} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm sm:text-2xl font-[900] text-[#d33030] leading-tight">
                            Chưa chính xác!
                          </h4>
                          <p className="text-xs sm:text-sm font-bold text-[#d33030]/90 mt-0.5 sm:mt-1 max-w-xl break-words line-clamp-2 sm:line-clamp-none">
                            {q?.options && q?.correctAnswer !== undefined 
                              ? `Đáp án đúng: ${q.options[q.correctAnswer]}` 
                              : q?.explanation}
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={handleCheckOrNext} 
                        className="w-full sm:w-auto px-6 sm:px-14 py-3 sm:py-4 bg-[#ff4b4b] hover:bg-[#ea2b2b] text-white border-b-3 sm:border-b-[6px] border-[#c32222] active:translate-y-1 active:border-b-0 rounded-xl sm:rounded-[24px] font-[900] text-sm sm:text-base uppercase tracking-wider cursor-pointer shrink-0 shadow-lg"
                      >
                        {currentQuizIdx === currentQuestions.length - 1 ? 'XEM KẾT QUẢ' : 'ĐÃ HIỂU'}
                      </button>
                    </div>
                  </div>
                );
              }

              // 3. Normal Selection / Check State
              let buttonText = 'KIỂM TRA';
              if (q?.type === 'card_match') {
                buttonText = isCardMatchComplete ? 'TIẾP TỤC' : 'GHÉP ĐỦ CÁC CẶP THẺ';
              }

              return (
                <div className="bg-white border-t-2 sm:border-t-4 border-[#f0f0f0] px-3 sm:px-6 py-2.5 sm:py-4 pb-[max(12px,env(safe-area-inset-bottom))] w-full">
                  <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
                    <div className="hidden sm:block text-xs font-black uppercase tracking-wider text-[#afafaf] truncate">
                      {q?.type === 'card_match' 
                        ? 'Chạm các thẻ từ vựng và nghĩa để ghép đôi'
                        : q?.type === 'word_order'
                          ? 'Chạm các từ phía dưới để hoàn thành câu'
                          : 'Chọn đáp án chính xác nhất'}
                    </div>

                    <button 
                      onClick={handleCheckOrNext} 
                      disabled={isCheckDisabled}
                      className={`w-full sm:w-auto px-6 sm:px-16 py-3 sm:py-4 font-[900] text-sm sm:text-base rounded-xl sm:rounded-[24px] uppercase tracking-wider transition-all ${
                        isCheckDisabled 
                          ? 'bg-[#e5e5e5] text-[#afafaf] cursor-not-allowed border-b-2 sm:border-b-[6px] border-[#d4d4d4]' 
                          : 'bg-[#58cc02] hover:bg-[#4eb702] text-white border-b-3 sm:border-b-[6px] border-[#46a302] active:translate-y-1 active:border-b-0 shadow-lg cursor-pointer'
                      }`}
                    >
                      {buttonText}
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    );
  }

  // PATH SINE CURVE OFFSETS (DUOLINGO SERPENTINE SNAKE PATH - FULLY RESPONSIVE FOR MOBILE)
  const PATH_OFFSETS = [
    'translate-x-0',
    'translate-x-2.5 sm:translate-x-8 md:translate-x-14',
    'translate-x-5 sm:translate-x-14 md:translate-x-20',
    'translate-x-2.5 sm:translate-x-8 md:translate-x-14',
    'translate-x-0',
    '-translate-x-2.5 sm:-translate-x-8 md:-translate-x-14',
    '-translate-x-5 sm:-translate-x-14 md:-translate-x-20',
    '-translate-x-2.5 sm:-translate-x-8 md:-translate-x-14',
  ];

  // MAIN DASHBOARD (WHEN NOT IN LESSON)
  return (
    <div className="max-w-6xl mx-auto px-2.5 sm:px-4 md:px-8 py-3 sm:py-6 md:py-8 pb-24 md:pb-32 overflow-x-hidden w-full max-w-full">
      {/* Top Banner with AI Lesson Generator shortcut */}
      <div className="flex items-center justify-between mb-4 sm:mb-6 md:mb-8 pb-2.5 sm:pb-4 border-b-2 border-[#f0f0f0] gap-2">
        <div className="min-w-0">
          <span className="text-[10px] sm:text-xs font-black text-[#58cc02] uppercase tracking-wider block">
            Lộ trình học Eng AI For Learn
          </span>
          <h1 className="text-lg sm:text-2xl md:text-3xl font-[900] text-[#4b4b4b] tracking-tight leading-tight truncate">
            Cây Học Tập Tiếng Anh
          </h1>
        </div>

        <button 
          onClick={() => {
            playClickSound();
            setShowAiModal(true);
          }} 
          className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-5 sm:py-3 bg-gradient-to-r from-[#ff4b4b] to-[#ff7b7b] hover:from-[#e53939] hover:to-[#ff6565] text-white font-[900] text-xs uppercase tracking-wider rounded-xl sm:rounded-2xl shadow-md border-b-2 sm:border-b-4 border-[#b92b2b] cursor-pointer active:translate-y-0.5 transition-all shrink-0"
        >
          <Sparkles size={15} /> 
          <span className="hidden sm:inline">Gieo mầm AI</span>
          <span className="sm:hidden font-black">Soạn AI</span>
        </button>
      </div>

      {/* 2-COLUMN DUOLINGO LAYOUT */}
      <div className="flex gap-10 items-start justify-center w-full max-w-full">
        
        {/* CENTER / MAIN FEED: THE WINDING LEARNING PATH */}
        <div className="flex-1 max-w-[592px] w-full space-y-10 sm:space-y-16">
          {units.map((unit, uIdx) => {
            const isAiUnit = !!unit.isAiUnit || unit.id.startsWith('unit-ai-') || unit.id.startsWith('unit-');

            // Distinct unit color themes
            const unitTheme = isAiUnit
              ? { banner: 'bg-gradient-to-r from-[#00cd9c] to-[#1cb0f6] border-[#009b75]', accent: '#00cd9c', tag: '🌱 Chủ đề Gieo Mầm AI' }
              : uIdx === 0 
                ? { banner: 'bg-[#58cc02] border-[#46a302]', accent: '#58cc02', tag: 'Chương 1' }
                : uIdx === 1
                  ? { banner: 'bg-[#1cb0f6] border-[#0d95d6]', accent: '#1cb0f6', tag: 'Chương 2' }
                  : uIdx === 2
                    ? { banner: 'bg-[#ce82ff] border-[#a855f7]', accent: '#ce82ff', tag: 'Chương 3' }
                    : { banner: 'bg-[#ff9600] border-[#d97706]', accent: '#ff9600', tag: `Chương ${uIdx + 1}` };

            return (
              <div key={unit.id} className="space-y-6 sm:space-y-10 w-full max-w-full">
                {/* STICKY UNIT BANNER WITH GUIDEBOOK & ACTION BUTTONS */}
                <div className={`w-full p-3.5 sm:p-6 md:p-8 rounded-[20px] sm:rounded-[36px] text-white shadow-xl relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b-4 sm:border-b-8 ${unitTheme.banner}`}>
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                      <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest bg-black/20 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full inline-block">
                        {unitTheme.tag} • {unit.lessons.length} Bài học
                      </span>
                      {isAiUnit && (
                        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full text-white">
                          Có thể học lại
                        </span>
                      )}
                    </div>
                    <h2 className="text-lg sm:text-2xl md:text-3xl font-[900] tracking-tight leading-tight break-words">
                      {unit.title}
                    </h2>
                    <p className="text-xs md:text-sm font-bold opacity-90 max-w-sm line-clamp-2 sm:line-clamp-none">
                      {unit.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        playClickSound();
                        setSelectedGuidebookUnit(unit);
                      }}
                      className="px-3 py-2 sm:px-4 sm:py-3 rounded-xl sm:rounded-2xl bg-white/20 hover:bg-white/30 border-2 border-white/40 text-white font-[900] text-xs uppercase tracking-wider flex items-center gap-1.5 sm:gap-2 cursor-pointer transition-all active:scale-95 shrink-0 shadow-sm"
                    >
                      <BookOpen size={15} /> 
                      <span>Sổ tay</span>
                    </button>

                    {isAiUnit && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            startAiLesson(unit.lessons[0]);
                          }}
                          className="px-3 py-2 sm:px-4 sm:py-3 rounded-xl sm:rounded-2xl bg-white hover:bg-white/95 text-[#009b75] font-[900] text-xs uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-sm"
                        >
                          <Sparkles size={15} />
                          <span>Học tiếp</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteAiUnit(unit.id, unit.title, e)}
                          className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-black/20 hover:bg-[#ff4b4b] text-white/80 hover:text-white transition-colors cursor-pointer"
                          title="Xóa chủ đề AI này"
                        >
                          <Trash2 size={15} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* THE WINDING SERPENTINE SNAKE PATH */}
                <div className="flex flex-col items-center relative py-4 sm:py-6 w-full max-w-full overflow-x-hidden">
                  {unit.lessons.map((lesson, idx) => {
                    const isCompleted = stats.completedLessons?.includes(lesson.id);
                    
                    // The first uncompleted lesson is active, and ALL AI units are ALWAYS UNLOCKED
                    const isFirstLesson = uIdx === 0 && idx === 0;
                    const prevLesson = idx > 0 ? unit.lessons[idx - 1] : (uIdx > 0 ? units[uIdx - 1]?.lessons?.slice(-1)[0] : null);
                    const isUnlocked = isAiUnit || isFirstLesson || (prevLesson && stats.completedLessons?.includes(prevLesson.id));
                    const isActive = isUnlocked && !isCompleted;
                    const isLocked = !isUnlocked && !isCompleted;

                    const offsetClass = PATH_OFFSETS[idx % PATH_OFFSETS.length];

                    return (
                      <React.Fragment key={lesson.id}>
                        {/* Winding Circular Lesson Node */}
                        <div className={`relative ${offsetClass} flex flex-col items-center my-4 group`}>
                          
                          {/* Bouncing START tooltip for Active lesson */}
                          {isActive && (
                            <div className="absolute -top-12 z-20 animate-bounce pointer-events-none select-none">
                              <div className="bg-white border-2 border-[#e5e5e5] px-3.5 py-1.5 rounded-xl font-[900] text-xs uppercase tracking-wider text-[#58cc02] shadow-md flex items-center gap-1.5 whitespace-nowrap">
                                <span>BẮT ĐẦU</span>
                              </div>
                              <div className="w-2.5 h-2.5 bg-white border-b-2 border-r-2 border-[#e5e5e5] rotate-45 mx-auto -mt-1.5"></div>
                            </div>
                          )}

                          <div className="relative">
                            {/* Circular SVG Progress Ring for Active Lesson */}
                            {isActive && (
                              <svg className="absolute -inset-2 sm:-inset-2.5 w-[80px] h-[80px] sm:w-[96px] sm:h-[96px] -rotate-90 pointer-events-none" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="44" stroke="#e5e5e5" strokeWidth="6" fill="transparent" />
                                <circle 
                                  cx="50" 
                                  cy="50" 
                                  r="44" 
                                  stroke={unitTheme.accent} 
                                  strokeWidth="6" 
                                  fill="transparent" 
                                  strokeDasharray="276" 
                                  strokeDashoffset="75" 
                                  strokeLinecap="round" 
                                />
                              </svg>
                            )}

                            {/* 3D Circular Button */}
                            <button
                              type="button"
                              onClick={() => {
                                if (isLocked) {
                                  playIncorrectSound();
                                  return;
                                }
                                startAiLesson(lesson);
                              }}
                              title={isLocked ? "Hãy hoàn thành bài học trước để mở khóa" : lesson.title}
                              className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-all relative shadow-lg cursor-pointer ${
                                isCompleted
                                  ? 'bg-[#58cc02] border-b-[6px] sm:border-b-[8px] border-[#46a302] text-white active:translate-y-1 active:border-b-2 hover:brightness-105'
                                  : isActive
                                    ? 'bg-[#58cc02] border-b-[6px] sm:border-b-[8px] border-[#46a302] text-white active:translate-y-1 active:border-b-2 hover:brightness-105 ring-4 ring-[#58cc02]/30'
                                    : 'bg-[#e5e5e5] border-b-[6px] sm:border-b-[8px] border-[#d4d4d4] text-[#afafaf] cursor-not-allowed opacity-80'
                              }`}
                            >
                              {isCompleted ? (
                                <Check className="w-7 h-7 sm:w-9 sm:h-9" strokeWidth={3.5} />
                              ) : isActive ? (
                                <Star className="w-7 h-7 sm:w-8 sm:h-8" fill="white" />
                              ) : (
                                <Lock className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
                              )}
                            </button>
                          </div>

                          {/* Lesson Title Label */}
                          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-white px-3 py-1 rounded-full border border-[#f0f0f0] text-[10px] font-black uppercase tracking-wider text-[#777] whitespace-nowrap shadow-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none max-w-[140px] truncate">
                            {lesson.title}
                          </div>
                        </div>

                        {/* Chest Reward Node after lesson 1 in each unit */}
                        {idx === 1 && (
                          <div className={`relative ${PATH_OFFSETS[(idx + 1) % PATH_OFFSETS.length]} flex flex-col items-center my-4`}>
                            {(() => {
                              const chestId = `chest-${unit.id}`;
                              const isChestOpened = openedChests.includes(chestId);

                              return (
                                <div className="flex flex-col items-center">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenChest(chestId, 50, 25, `Rương Thần Kì: ${unit.title}`)}
                                    className={`w-14 h-14 sm:w-18 sm:h-18 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg ${
                                      isChestOpened
                                        ? 'bg-[#f7f7f7] border-b-[6px] sm:border-b-[8px] border-[#e5e5e5] text-[#afafaf]'
                                        : 'bg-[#ffc800] border-b-[6px] sm:border-b-[8px] border-[#b8860b] text-white hover:brightness-105 animate-pulse active:translate-y-1 active:border-b-2'
                                    }`}
                                  >
                                    <Gift className="w-6 h-6 sm:w-8 sm:h-8" />
                                  </button>
                                  <span className="text-[9px] sm:text-[10px] font-black uppercase text-[#afafaf] mt-1">
                                    {isChestOpened ? 'Đã nhận thưởng' : 'Rương Kho Báu'}
                                  </span>
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* RIGHT COLUMN: DESKTOP DUOLINGO WIDGETS */}
        <div className="hidden xl:flex flex-col w-84 shrink-0 space-y-6 pt-2">
          {/* Active Course Card */}
          <div className="bg-white p-5 rounded-[28px] border-4 border-[#f0f0f0] shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl drop-shadow-xs">{stats.activeCourseFlag || '🇬🇧'}</span>
              <div>
                <h4 className="font-black text-sm text-[#4b4b4b]">{stats.activeCourseTitle || 'Tiếng Anh Phổ Thông'}</h4>
                <span className="text-xs font-bold text-[#afafaf]">
                  {stats.studyMode === 'ielts' ? `IELTS Target ${stats.targetBand || '6.5'}` : `Lớp ${stats.grade || '10'}`}
                </span>
              </div>
            </div>
            <Link to="/courses" onClick={playClickSound} className="text-xs font-black text-[#58cc02] uppercase hover:underline cursor-pointer">
              Đổi
            </Link>
          </div>

          {/* Eng AI PRO Lifetime Card */}
          <div className="p-6 rounded-[28px] bg-gradient-to-br from-[#1cb0f6] to-[#ce82ff] text-white shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full flex items-center gap-1.5">
                <Sparkles size={14} /> PRO TRỌN ĐỜI (LIFETIME)
              </span>
              <InfinityIcon size={20} strokeWidth={2.5} />
            </div>
            <h4 className="font-[900] text-lg leading-tight">Eng AI PRO Trọn Đời</h4>
            <p className="text-xs font-bold opacity-90">Đã kích hoạt vĩnh viễn: Vô hạn Trái Tim, mở khóa toàn bộ đề thi AI và gia sư Alex AI sửa lỗi trọn đời!</p>
            <Link 
              to="/pro" 
              onClick={playClickSound}
              className="block w-full py-3 bg-white hover:bg-gray-100 text-[#1cb0f6] text-center font-[900] text-xs uppercase tracking-wider rounded-xl shadow-xs transition-colors"
            >
              Xem đặc quyền PRO Trọn Đời
            </Link>
          </div>

          {/* Daily Quests Widget */}
          <div className="bg-white p-5 rounded-[28px] border-4 border-[#f0f0f0] shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-[900] text-sm text-[#4b4b4b] uppercase tracking-wider flex items-center gap-2">
                <Target size={18} className="text-[#ff9600]" /> Nhiệm vụ hôm nay
              </h4>
              <Link to="/quests" onClick={playClickSound} className="text-xs font-black text-[#1cb0f6] uppercase hover:underline">
                Xem hết
              </Link>
            </div>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-black text-[#777]">
                  <span>Kiếm 50 EXP</span>
                  <span className="text-[#ff9600]">{Math.min(stats.exp || 0, 50)}/50</span>
                </div>
                <div className="h-2.5 bg-[#f0f0f0] rounded-full overflow-hidden">
                  <div className="bg-[#ff9600] h-full rounded-full transition-all" style={{ width: `${Math.min(((stats.exp || 0) / 50) * 100, 100)}%` }} />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-black text-[#777]">
                  <span>Hoàn thành 1 bài học</span>
                  <span className="text-[#58cc02]">{Math.min((stats.completedLessons || []).length, 1)}/1</span>
                </div>
                <div className="h-2.5 bg-[#f0f0f0] rounded-full overflow-hidden">
                  <div className="bg-[#58cc02] h-full rounded-full transition-all" style={{ width: `${Math.min(((stats.completedLessons || []).length / 1) * 100, 100)}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Learning Progress Widget */}
          <div className="bg-white p-5 rounded-[28px] border-4 border-[#f0f0f0] shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-[900] text-sm text-[#4b4b4b] uppercase tracking-wider flex items-center gap-2">
                <BookOpen size={18} className="text-[#58cc02]" /> Tiến độ học tập
              </h4>
              <Link to="/vocabulary" onClick={playClickSound} className="text-xs font-black text-[#58cc02] uppercase hover:underline">
                Sổ tay
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-3 bg-[#f0fff0] rounded-2xl border border-[#58cc02]/20 flex flex-col items-center text-center">
                <span className="text-xl font-[900] text-[#58cc02]">
                  {(stats.learnedWords || []).length}
                </span>
                <span className="text-[10px] font-black uppercase text-[#777] mt-0.5">
                  Từ vựng ghi nhớ
                </span>
              </div>
              <div className="p-3 bg-[#f0f9ff] rounded-2xl border border-[#1cb0f6]/20 flex flex-col items-center text-center">
                <span className="text-xl font-[900] text-[#1cb0f6]">
                  {(stats.completedLessons || []).length}
                </span>
                <span className="text-[10px] font-black uppercase text-[#777] mt-0.5">
                  Bài hoàn thành
                </span>
              </div>
            </div>
            <Link
              to="/vocabulary"
              onClick={playClickSound}
              className="block w-full py-2.5 bg-[#f7f7f7] hover:bg-[#eef2f5] text-[#4b4b4b] text-center font-[900] text-xs uppercase tracking-wider rounded-xl transition-colors border border-[#e5e5e5]"
            >
              Mở Sổ Tay & Luyện Phản Xạ
            </Link>
          </div>
        </div>

      </div>

      {/* GUIDEBOOK MODAL (ĐỒNG NHẤT VỚI CHỦ ĐỀ 100%) */}
      {selectedGuidebookUnit && (() => {
        const lesson = selectedGuidebookUnit.lessons[0];
        const grammar = lesson?.grammarPoint;
        
        // Lấy danh sách từ vựng chuẩn xác theo chủ đề, lọc bỏ từ vựng chung chung không đúng chủ đề
        let highlights = lesson?.readingContent?.highlights || [];
        const isGeneric = highlights.some((h: any) => ['perspective', 'fundamental', 'fluency'].includes(h.word?.toLowerCase()));
        if (!highlights || highlights.length === 0 || isGeneric) {
          const fallback = generateTopicFallbackLesson(selectedGuidebookUnit.topic || selectedGuidebookUnit.title);
          highlights = fallback.readingContent?.highlights || [];
        }

        const phrases = (grammar?.examples && grammar.examples.length > 0)
          ? grammar.examples
          : (lesson?.videoContext?.script
              ? lesson.videoContext.script
                  .split('\n')
                  .filter((l: string) => l.trim().length > 0)
                  .slice(0, 4)
                  .map((l: string) => ({
                    en: l.replace(/^[AB]:\s*/, ''),
                    vi: `Mẫu câu đàm thoại về ${selectedGuidebookUnit.title.replace('Chủ đề: ', '')}`
                  }))
              : []);

        return (
          <div className="fixed inset-0 bg-black/60 z-[300] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white w-full max-w-xl rounded-[36px] p-6 md:p-8 space-y-6 shadow-2xl relative border-4 border-[#f0f0f0] max-h-[88vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b-2 border-[#f0f0f0]">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-[#f0fff0] border border-[#58cc02]/30 text-[#58cc02] flex items-center justify-center">
                    <BookOpen size={22} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-[#58cc02] tracking-wider block">
                      {selectedGuidebookUnit.isAiUnit ? '🌱 Sổ tay Gieo Mầm AI' : 'Sổ tay bài học'}
                    </span>
                    <h3 className="text-lg md:text-xl font-[900] text-[#4b4b4b] leading-tight">
                      {selectedGuidebookUnit.title}
                    </h3>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedGuidebookUnit(null)}
                  className="text-[#afafaf] hover:text-[#ff4b4b] p-2 rounded-full hover:bg-gray-100 cursor-pointer transition-colors"
                >
                  <X size={22} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-6 custom-scrollbar pr-2">
                {/* Grammar Focus */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase text-[#1cb0f6] tracking-wider flex items-center gap-1.5">
                    <Sparkles size={16} /> Ngữ pháp cốt lõi
                  </h4>
                  <div className="p-4 bg-[#f0f9ff] rounded-2xl border-2 border-[#1cb0f6]/20 space-y-2">
                    <p className="text-sm font-black text-[#4b4b4b]">
                      {grammar?.title || `Cấu trúc Ngữ Pháp chính về ${selectedGuidebookUnit.title}`}
                    </p>
                    {grammar?.formula && (
                      <p className="text-xs font-mono font-bold text-[#1cb0f6] bg-white px-2.5 py-1 rounded-lg border border-[#1cb0f6]/20 inline-block">
                        {grammar.formula}
                      </p>
                    )}
                    <p className="text-xs text-[#555] font-bold leading-relaxed">
                      {grammar?.rule || grammar?.usage || `Sử dụng các mẫu câu thông dụng để biểu đạt ý tưởng mạch lạc về chủ đề này.`}
                    </p>
                  </div>
                </div>

                {/* Key Vocabulary Highlights */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase text-[#58cc02] tracking-wider flex items-center gap-1.5">
                      <BookMarked size={16} /> Từ vựng quan trọng ({highlights.length} từ)
                    </h4>
                    <button
                      type="button"
                      onClick={() => handleSaveAllWordsToNotebook(highlights, selectedGuidebookUnit.title)}
                      className="text-[11px] font-black text-[#58cc02] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={14} /> Lưu tất cả vào Sổ tay
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {highlights.map((v: any, i: number) => {
                      const isAlreadyInNotebook = (stats.learnedWords || []).some(w => w.word.toLowerCase() === v.word.toLowerCase());

                      return (
                        <div key={i} className="p-3.5 bg-[#f0fff0] rounded-2xl border border-[#58cc02]/20 flex items-start justify-between gap-2 shadow-xs hover:border-[#58cc02] transition-colors">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-black text-sm text-[#46a302]">{v.word}</span>
                              {v.phonetic && (
                                <span className="text-[10px] text-[#888] font-mono">{v.phonetic}</span>
                              )}
                              {v.type && (
                                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 bg-black/5 rounded text-[#777]">
                                  {v.type}
                                </span>
                              )}
                            </div>
                            <span className="text-xs font-bold text-[#4b4b4b] block">{v.meaning}</span>
                            {v.example && (
                              <p className="text-[11px] text-[#777] italic font-medium line-clamp-2">
                                "{v.example}"
                              </p>
                            )}
                          </div>

                          <div className="flex flex-col gap-1 items-end shrink-0 pt-0.5">
                            <button
                              type="button"
                              onClick={() => playTTS(v.word)}
                              className="p-1.5 text-[#58cc02] hover:bg-white rounded-lg transition-colors cursor-pointer"
                              title="Nghe phát âm"
                            >
                              <Volume2 size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAddSingleWordToNotebook(v, selectedGuidebookUnit.title)}
                              className={`p-1 rounded-lg transition-colors cursor-pointer ${
                                isAlreadyInNotebook 
                                  ? 'text-[#58cc02] bg-white shadow-xs' 
                                  : 'text-[#1cb0f6] hover:bg-white'
                              }`}
                              title={isAlreadyInNotebook ? "Đã có trong Sổ tay cá nhân" : "Lưu vào Sổ tay"}
                            >
                              {isAlreadyInNotebook ? <Check size={14} strokeWidth={3} /> : <Plus size={14} strokeWidth={3} />}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Key Phrases in Context */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase text-[#ce82ff] tracking-wider flex items-center gap-1.5">
                    <MessageSquare size={16} /> Mẫu câu phản xạ giao tiếp
                  </h4>
                  <div className="space-y-2">
                    {phrases.map((phrase: any, i: number) => (
                      <div key={i} className="p-3 bg-white rounded-xl border-2 border-[#f0f0f0] flex items-center justify-between shadow-xs">
                        <div className="space-y-0.5">
                          <p className="font-black text-sm text-[#4b4b4b]">"{phrase.en}"</p>
                          <p className="text-xs font-bold text-[#afafaf]">{phrase.vi}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => playTTS(phrase.en)}
                          className="p-2 text-[#ce82ff] hover:bg-[#fbf0ff] rounded-xl transition-colors cursor-pointer shrink-0 ml-2"
                          title="Nghe mẫu câu"
                        >
                          <Volume2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Action Buttons */}
              <div className="space-y-2 pt-2 border-t border-[#f0f0f0]">
                <button
                  type="button"
                  onClick={() => {
                    startAiLesson(selectedGuidebookUnit.lessons[0]);
                    setSelectedGuidebookUnit(null);
                  }}
                  className="w-full py-4 bg-[#58cc02] hover:bg-[#46a302] text-white font-[900] text-sm uppercase tracking-wider rounded-2xl shadow-md border-b-4 border-[#3b8a01] active:translate-y-0.5 cursor-pointer transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles size={18} />
                  <span>VÀO HỌC / LUYỆN TẬP CHỦ ĐỀ NÀY</span>
                </button>
                <Link
                  to="/vocabulary"
                  onClick={() => {
                    playClickSound();
                    setSelectedGuidebookUnit(null);
                  }}
                  className="w-full py-3 bg-[#f0f9ff] hover:bg-[#e0f2fe] text-[#0284c7] font-[900] text-xs uppercase tracking-wider rounded-2xl border-2 border-[#bae6fd] flex items-center justify-center gap-2 transition-all"
                >
                  <BookOpen size={16} />
                  <span>Mở Sổ Tay Thông Minh (Luyện Phát Âm & Đặt Câu)</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setSelectedGuidebookUnit(null)}
                  className="w-full py-2.5 text-xs font-black text-[#afafaf] hover:text-[#4b4b4b] uppercase tracking-wider cursor-pointer"
                >
                  Đóng sổ tay
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* CHEST REWARD MODAL */}
      {chestReward && (
        <div className="fixed inset-0 bg-black/60 z-[300] flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm animate-in zoom-in">
          <div className="bg-white w-full max-w-sm rounded-[28px] sm:rounded-[36px] p-5 sm:p-8 text-center space-y-4 sm:space-y-6 shadow-2xl relative border-2 sm:border-4 border-[#f0f0f0]">
            <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto bg-gradient-to-b from-[#ffc800] to-[#e68500] rounded-2xl sm:rounded-[32px] flex items-center justify-center text-white shadow-xl animate-bounce">
              <Gift className="w-8 h-8 sm:w-12 sm:h-12" />
            </div>
            <div>
              <span className="text-[10px] sm:text-xs font-black uppercase text-[#ffc800] tracking-widest bg-[#fffbf0] px-3 py-1 rounded-full border border-[#ffc800]/25">
                Mở Rương Thành Công
              </span>
              <h3 className="text-xl sm:text-2xl font-[900] text-[#4b4b4b] mt-1.5 sm:mt-2">
                {chestReward.title}
              </h3>
              <p className="text-xs font-bold text-[#afafaf] mt-1">
                Phần thưởng học tập chăm chỉ dành cho bạn!
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              <div className="p-3 sm:p-4 bg-[#f0f9ff] rounded-2xl border-2 border-[#1cb0f6]/20 flex flex-col items-center">
                <span className="text-[10px] sm:text-[11px] font-black uppercase text-[#afafaf]">Nhận Đá Quý</span>
                <span className="text-xl sm:text-2xl font-[900] text-[#1cb0f6]">+{chestReward.gems} 💎</span>
              </div>
              <div className="p-3 sm:p-4 bg-[#fff0f0] rounded-2xl border-2 border-[#ff4b4b]/20 flex flex-col items-center">
                <span className="text-[10px] sm:text-[11px] font-black uppercase text-[#afafaf]">Kinh nghiệm</span>
                <span className="text-xl sm:text-2xl font-[900] text-[#ff4b4b]">+{chestReward.exp} EXP</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setChestReward(null)}
              className="w-full py-3.5 sm:py-4 bg-[#58cc02] hover:bg-[#46a302] text-white font-[900] text-sm uppercase tracking-wider rounded-xl sm:rounded-2xl shadow-md border-b-4 border-[#3b8a01] active:translate-y-0.5 cursor-pointer"
            >
              TUYỆT VỜI
            </button>
          </div>
        </div>
      )}

      {/* AI LESSON GENERATOR MODAL */}
      {showAiModal && (
        <div className="fixed inset-0 bg-black/50 z-[300] flex items-center justify-center p-3 sm:p-6 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[28px] sm:rounded-[40px] p-5 sm:p-8 md:p-10 space-y-4 sm:space-y-6 shadow-2xl relative border-2 sm:border-4 border-[#f0f0f0]">
            <button 
              onClick={() => setShowAiModal(false)} 
              className="absolute top-4 right-4 sm:top-6 sm:right-6 text-[#afafaf] hover:text-[#ff4b4b] cursor-pointer p-1"
            >
              <X size={24} />
            </button>
            <div className="text-center space-y-2 pt-2 sm:pt-0">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[#fff0f0] text-[#ff4b4b] rounded-2xl flex items-center justify-center mx-auto mb-1 sm:mb-2">
                <Sparkles size={24} />
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-[900] text-[#4b4b4b] uppercase tracking-tight">Gieo Mầm Bài Học</h2>
              <p className="font-bold text-xs sm:text-sm text-[#afafaf]">
                Alex AI sẽ soạn hội thoại tự nhiên và 20 câu hỏi chuyên sâu theo chủ đề bạn chọn.
              </p>
            </div>
            <input 
              type="text" 
              placeholder="VD: Food, Travel, Jobs, Music..." 
              className="w-full p-3.5 sm:p-5 bg-[#f7f7f7] rounded-xl sm:rounded-[24px] border-2 sm:border-4 border-transparent focus:border-[#ff4b4b] outline-none font-black text-base sm:text-lg text-center" 
              value={aiTopic} 
              onChange={(e) => setAiTopic(e.target.value)} 
            />
            <button 
              onClick={handleCreateAiLesson} 
              disabled={!aiTopic.trim() || isGenerating} 
              className="w-full py-3.5 sm:py-5 bg-[#ff4b4b] hover:bg-[#d33030] text-white font-[900] rounded-xl sm:rounded-[28px] text-base sm:text-lg shadow-xl border-b-4 sm:border-b-[6px] border-[#d33030] cursor-pointer disabled:opacity-50 transition-all"
            >
              {isGenerating ? <Loader2 className="animate-spin mx-auto" size={24} /> : 'BẮT ĐẦU SOẠN BÀI'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
