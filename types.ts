
export interface UserStats {
  id: string;
  name?: string;
  email?: string;
  avatar?: string;
  level: number;
  exp: number;
  streak: number;
  hearts?: number;
  gems?: number;
  isPro?: boolean;
  lastActive: string;
  age?: number;
  grade?: string;
  studyMode?: 'regular' | 'ielts';
  targetBand?: string;
  activeCourseId?: string;
  activeCourseTitle?: string;
  activeCourseFlag?: string;
  stars?: number;
  learnedWords: VocabularyWord[];
  completedLessons: string[]; 
  isAdmin?: boolean;
  accessibilityMode?: boolean;
  accessibilityVoiceSpeed?: number;
}

export interface VocabularyWord {
  word: string;
  meaning: string;
  example: string;
  mastery: number; 
  phonetic?: string;
  topic?: string;
}

export interface MatchPair {
  en: string;
  vi: string;
}

export interface QuizQuestion {
  id?: string;
  type?: 'multiple_choice' | 'card_match' | 'word_order';
  question: string;
  options?: string[];
  correctAnswer?: number;
  explanation: string;
  category?: 'vocabulary' | 'part_of_speech' | 'pronunciation' | 'memory' | 'sentence_matching';
  categoryLabel?: string;
  audioPrompt?: string;
  
  // Dành cho dạng câu hỏi: Chọn thẻ để nhớ nghĩa của từ (Card Match)
  matchPairs?: MatchPair[];
  
  // Dành cho dạng câu hỏi: Ghép chữ để thành câu có nghĩa (Word Order / Sentence Builder)
  targetSentence?: string;
  wordsPool?: string[];
  translationHint?: string;
}

export interface Quiz {
  title: string;
  questions: QuizQuestion[];
}

export interface RichLesson {
  id: string;
  title: string;
  type: 'video' | 'music'; 
  videoContext?: {
    description: string;
    script: string;
    situationalQuestion: QuizQuestion;
  };
  musicContext?: {
    description: string;
    lyrics: string;
    situationalQuestion: QuizQuestion;
  };
  trueFalseQuestion: {
    statement: string;
    isTrue: boolean;
    explanation: string;
  };
  audioDrill: {
    text: string;
    translation: string;
  };
  grammarPoint: {
    title: string;
    formula?: string;
    usage?: string;
    rule: string;
    examples: { en: string; vi: string }[];
  };
  readingContent: {
    passage: string;
    highlights: { 
      word: string; 
      phonetic?: string;
      type?: string;
      meaning: string; 
      example: string; 
    }[];
  };
  quiz: Quiz;
}

export interface Unit {
  id: string;
  title: string;
  description: string;
  lessons: RichLesson[];
  isAiUnit?: boolean;
  topic?: string;
  createdAt?: string;
}

export interface CopyrightTicket {
  id: string;
  title: string;
  description: string; 
  type: 'video' | 'music';
  owner: string;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
}

export interface WritingGrade {
  score: number;
  cefrLevel: string;
  strengths: string[];
  weaknesses: string[];
  correctedText: string;
  overallFeedback: string;
  ieltsCriteria?: {
    taskResponse: number;
    coherence: number;
    lexicalResource: number;
    grammarRange: number;
  };
}

export interface CourseLesson {
  id: string;
  title: string;
  duration: string;
  type: string;
  completed: boolean;
  content?: string;
}

export interface Course {
  id: string;
  title: string;
  level: string;
  description: string;
  progress: number;
  lessons: CourseLesson[];
}
