// Native browser Text-to-Speech (TTS) + visually impaired accessibility helpers.
// Uses the Web Speech API and selects a voice based on the language of each segment.

const ACCESSIBILITY_STORAGE_KEY = 'eng_ai_accessibility_mode';
const ACCESSIBILITY_SPEED_KEY = 'eng_ai_accessibility_speed';

type SpeechSegment = { text: string; lang: string };

let cachedVoices: SpeechSynthesisVoice[] = [];
let lastSpokenText = '';
let lastSpokenOptions: Pick<TTSOptions, 'lang' | 'rate' | 'pitch' | 'volume' | 'forceVietnamese'> | undefined;
let playbackGeneration = 0;

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  const updateVoices = () => {
    try {
      cachedVoices = window.speechSynthesis.getVoices();
    } catch {
      cachedVoices = [];
    }
  };

  updateVoices();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.addEventListener?.('voiceschanged', updateVoices);
  }
}

/** True when text contains characters commonly used in written Vietnamese. */
export function hasVietnameseDiacritics(text: string): boolean {
  return /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđĐ]/i.test(text);
}

/**
 * Remove non-spoken UI decoration before TTS. URLs are deliberately omitted;
 * Markdown links keep their visible label but never read the destination URL.
 */
export function cleanTextForSpeech(text: string): string {
  if (!text) return '';

  return text
    // Keep the user-facing label in a Markdown link, but drop its URL.
    .replace(/\[([^\]]+)\]\((?:https?:\/\/|www\.)?[^)]+\)/giu, '$1')
    .replace(/<https?:\/\/[^>]+>/giu, ' ')
    .replace(/\b(?:https?:\/\/|www\.)[^\s<>]+/giu, ' ')
    .replace(/\b(?:liên\s+kết|hyperlink|link)\s*:\s*/giu, ' ')
    // Remove keycap-style emoji such as 1️⃣ before removing individual marks.
    .replace(/[#*0-9]\uFE0F?\u20E3/gu, ' ')
    // Modern emoji, flags, modifiers, joiners, variation selectors and keycap marks.
    .replace(/[\p{Extended_Pictographic}\p{Regional_Indicator}\p{Emoji_Modifier}\uFE0E\uFE0F\u200D\u20E3]/gu, '')
    // Remove common text decoration and simple HTML tags.
    .replace(/<[^>]*>/gu, ' ')
    .replace(/[*_#`~>]/g, '')
    .replace(/\[\.\.\.\]/g, 'blank')
    .replace(/_{2,}/g, 'blank')
    .replace(/[\u200B-\u200F\u2060\uFEFF]/gu, '')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.!?;:])/g, '$1')
    .trim();
}

function languageForText(text: string): string {
  return hasVietnameseDiacritics(text) ? 'vi-VN' : 'en-US';
}

// Vietnamese words that are normally written without tone marks or can be
// mistaken for English UI labels. This keeps phrases such as "Tiếng Anh" in
// one Vietnamese voice while allowing English vocabulary inside a Vietnamese sentence.
const COMMON_UNACCENTED_VIETNAMESE = new Set(
  'anh em cho trong qua hay theo thu tu la toi ta ma ve de do den day dang dung can ban minh mot hai ba bon nam sau bay tam chin muoi cung nhu khi neu thi voi vao ra len xuong tren duoi ngoai giua hoac vi nen co khong duoc se da dang lam noi noi dung cai cac nhung moi rieng rat hon it nhieu tat ca vao xin vui mot hai'.split(' ')
);

function languageForWord(word: string): string {
  if (hasVietnameseDiacritics(word)) return 'vi-VN';
  const normalized = word.toLocaleLowerCase('vi-VN').replace(/[’']/g, '');
  if (COMMON_UNACCENTED_VIETNAMESE.has(normalized)) return 'vi-VN';
  return 'en-US';
}

/**
 * Split at sentence boundaries, language-changing labels (colon/dash), and
 * word boundaries when a single sentence genuinely mixes Vietnamese and English.
 * Adjacent words in the same language remain together to avoid choppy TTS.
 */
function splitMixedChunk(chunk: string): SpeechSegment[] {
  const cleanChunk = chunk.trim();
  if (!cleanChunk) return [];
  if (!hasVietnameseDiacritics(cleanChunk)) {
    return [{ text: cleanChunk, lang: 'en-US' }];
  }

  const tokens = cleanChunk.match(/[\p{L}\p{M}]+(?:[’'][\p{L}\p{M}]+)*|\d+(?:[.,]\d+)*|[^\p{L}\d]+/gu) || [cleanChunk];
  const segments: SpeechSegment[] = [];
  let activeLang = '';
  let activeText = '';

  for (const token of tokens) {
    const isWord = /^[\p{L}\p{M}]+(?:[’'][\p{L}\p{M}]+)*$/u.test(token);
    if (!isWord) {
      // Keep spaces and punctuation with the previous phrase so pauses survive.
      activeText += token;
      continue;
    }

    const nextLang = languageForWord(token);
    if (!activeLang) {
      activeLang = nextLang;
      activeText = token;
      continue;
    }

    if (nextLang === activeLang) {
      activeText += token;
    } else {
      const ready = activeText.trim();
      if (ready) segments.push({ text: ready, lang: activeLang });
      activeLang = nextLang;
      activeText = token;
    }
  }

  const ready = activeText.trim();
  if (ready) segments.push({ text: ready, lang: activeLang || languageForText(ready) });
  return segments.length ? segments : [{ text: cleanChunk, lang: languageForText(cleanChunk) }];
}

function splitIntoLanguageSegments(text: string): SpeechSegment[] {
  const sentenceParts = text.match(/[^.!?\n]+[.!?\n]*/gu) || [text];
  const result: SpeechSegment[] = [];

  const append = (segment: SpeechSegment) => {
    const nextText = segment.text.trim();
    if (!nextText) return;
    const last = result[result.length - 1];
    // Coalesce same-language runs so the voice does not switch unnecessarily.
    if (last && last.lang === segment.lang) last.text = `${last.text} ${nextText}`;
    else result.push({ text: nextText, lang: segment.lang });
  };

  const addChunk = (rawChunk: string) => {
    const chunk = rawChunk.trim();
    if (!chunk) return;

    // First split explicit labels like "Đáp án đúng là: Hello, world!".
    const boundary = chunk.match(/^(.+?)([:—–])\s*(.+)$/u);
    if (boundary) {
      const prefix = boundary[1].trim() + boundary[2];
      const suffix = boundary[3].trim();
      if (/[\p{L}]/u.test(suffix) && languageForText(prefix) !== languageForText(suffix)) {
        splitMixedChunk(prefix).forEach(append);
        splitIntoLanguageSegments(suffix).forEach(append);
        return;
      }
    }

    // Token-level splitting handles mixed phrases without punctuation, e.g.
    // "Bạn chọn answer A". Common Vietnamese words without accents are kept Vietnamese.
    splitMixedChunk(chunk).forEach(append);
  };

  sentenceParts.forEach(addChunk);
  return result.length ? result : [{ text, lang: languageForText(text) }];
}

function getBestVoice(langCode: string): SpeechSynthesisVoice | null {
  if (!cachedVoices.length && typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      cachedVoices = window.speechSynthesis.getVoices();
    } catch {
      cachedVoices = [];
    }
  }

  if (!cachedVoices.length) return null;

  const normalized = langCode.toLowerCase().replace(/_/g, '-');
  const prefix = normalized.split('-')[0];
  const normalizedVoiceLang = (voice: SpeechSynthesisVoice) => voice.lang.toLowerCase().replace(/_/g, '-');
  const exactMatches = cachedVoices.filter(voice => normalizedVoiceLang(voice) === normalized);
  const prefixMatches = cachedVoices.filter(voice => normalizedVoiceLang(voice).startsWith(`${prefix}-`) || normalizedVoiceLang(voice) === prefix);
  const pool = exactMatches.length ? exactMatches : prefixMatches;
  if (!pool.length) return null;

  // Prefer recognizable high-quality voices in the correct language, but never
  // prefer a voice from a different language just because its name looks better.
  const preferred = pool.find(voice => /Natural|Google|Siri|Samantha|Premium|Online|Microsoft/i.test(voice.name));
  return preferred || pool.find(voice => voice.default) || pool[0];
}

export function getAccessibilitySpeechRate(): number {
  if (typeof window === 'undefined') return 1;

  try {
    const saved = Number(localStorage.getItem(ACCESSIBILITY_SPEED_KEY));
    if (Number.isFinite(saved) && saved >= 0.6 && saved <= 1.5) return saved;
  } catch {
    // Ignore storage errors and use the default speed.
  }

  return 1;
}

export function setAccessibilitySpeechRate(rate: number): void {
  const safeRate = Math.min(1.5, Math.max(0.6, rate));

  try {
    localStorage.setItem(ACCESSIBILITY_SPEED_KEY, String(safeRate));
  } catch {
    // Ignore storage errors.
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('accessibility_speed_change', { detail: { rate: safeRate } }));
  }
}

/** Immediately stop any active speech, including the remaining bilingual segments. */
export function stopTTS(): void {
  playbackGeneration += 1;
  try {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  } catch (error) {
    console.warn('stopTTS error:', error);
  }
}

export interface TTSOptions {
  /** Explicit language code, e.g. en-US or vi-VN. Overrides automatic detection. */
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  onStart?: () => void;
  onEnd?: () => void;
  /** Force the entire utterance to Vietnamese for known Vietnamese-only prompts. */
  forceVietnamese?: boolean;
  remember?: boolean;
}

/** Speak text using the language-appropriate voice; bilingual messages are read in segments. */
export function playTTS(text: string, options?: TTSOptions): void {
  const clean = cleanTextForSpeech(text);

  if (!clean) {
    options?.onEnd?.();
    return;
  }

  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    options?.onEnd?.();
    return;
  }

  // Cancel the previous utterance so speech never overlaps.
  stopTTS();
  const thisGeneration = playbackGeneration;

  if (options?.remember !== false) {
    lastSpokenText = clean;
    lastSpokenOptions = {
      lang: options?.lang,
      rate: options?.rate,
      pitch: options?.pitch,
      volume: options?.volume,
      forceVietnamese: options?.forceVietnamese
    };
  }

  const segments: SpeechSegment[] = options?.lang
    ? [{ text: clean, lang: options.lang }]
    : options?.forceVietnamese
      ? [{ text: clean, lang: 'vi-VN' }]
      : splitIntoLanguageSegments(clean);

  let index = 0;
  let started = false;
  let finished = false;

  const finish = () => {
    if (finished || thisGeneration !== playbackGeneration) return;
    finished = true;
    options?.onEnd?.();
  };

  const speakNext = () => {
    if (thisGeneration !== playbackGeneration) return;
    if (index >= segments.length) {
      finish();
      return;
    }

    const segment = segments[index];
    const utterance = new SpeechSynthesisUtterance(segment.text);
    utterance.lang = segment.lang;
    utterance.rate = options?.rate ?? (
      isAccessibilityMode()
        ? getAccessibilitySpeechRate()
        : (segment.lang.toLowerCase().startsWith('vi') ? 1.05 : 0.95)
    );
    utterance.pitch = options?.pitch ?? 1;
    utterance.volume = options?.volume ?? 1;

    const matchedVoice = getBestVoice(segment.lang);
    if (matchedVoice) utterance.voice = matchedVoice;

    utterance.onstart = () => {
      if (thisGeneration !== playbackGeneration) return;
      if (!started) {
        started = true;
        options?.onStart?.();
      }
    };

    utterance.onend = () => {
      if (thisGeneration !== playbackGeneration) return;
      index += 1;
      speakNext();
    };

    utterance.onerror = event => {
      if (thisGeneration !== playbackGeneration) return;
      const error = (event as SpeechSynthesisErrorEvent).error;
      if (error !== 'canceled' && error !== 'interrupted') {
        console.warn('TTS utterance error:', error);
      }
      index += 1;
      speakNext();
    };

    try {
      if (window.speechSynthesis.paused) window.speechSynthesis.resume();
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Native playTTS error:', error);
      index += 1;
      speakNext();
    }
  };

  speakNext();
}

export function repeatLastSpeech(): void {
  if (!lastSpokenText) {
    announceAccessibility('Chưa có nội dung nào để đọc lại.');
    return;
  }

  playTTS(lastSpokenText, {
    ...(lastSpokenOptions || {}),
    rate: getAccessibilitySpeechRate()
  });
}

export function isAccessibilityMode(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    return localStorage.getItem(ACCESSIBILITY_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setAccessibilityMode(enabled: boolean): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(ACCESSIBILITY_STORAGE_KEY, enabled ? 'true' : 'false');
    window.dispatchEvent(new CustomEvent('accessibility_mode_change', { detail: { enabled } }));

    if (enabled) {
      announceAccessibility(
        'Chế độ trợ năng cho người khiếm thị đã được bật. Dùng Tab để di chuyển, Enter để chọn, Esc để dừng đọc và Alt cộng R để đọc lại.',
        true
      );
    } else {
      announceAccessibility('Đã tắt trợ năng khiếm thị.', true);
    }
  } catch (error) {
    console.warn('setAccessibilityMode error:', error);
  }
}

export function toggleAccessibilityMode(): boolean {
  const next = !isAccessibilityMode();
  setAccessibilityMode(next);
  return next;
}

/** Announce a message using automatic language detection, including bilingual text. */
export function announceAccessibility(text: string, force = false): void {
  if (!force && !isAccessibilityMode()) return;

  const clean = cleanTextForSpeech(text);
  if (!clean) return;

  // Do not force Vietnamese merely because a message contains a Vietnamese word:
  // accessibility announcements often include English answer choices or vocabulary.
  playTTS(clean, {
    rate: getAccessibilitySpeechRate(),
    remember: true
  });
}
