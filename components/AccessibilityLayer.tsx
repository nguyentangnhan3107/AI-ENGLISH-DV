import React, { useEffect, useMemo, useState } from 'react';
import {
  Eye,
  Keyboard,
  RotateCcw,
  Settings2,
  Square,
  Volume2,
  VolumeX
} from 'lucide-react';
import {
  announceAccessibility,
  cleanTextForSpeech,
  getAccessibilitySpeechRate,
  isAccessibilityMode,
  playTTS,
  repeatLastSpeech,
  setAccessibilitySpeechRate,
  setAccessibilityMode,
  stopTTS
} from '../services/ttsService';

interface AccessibilityLayerProps {
  enabled: boolean;
  onToggle: (next: boolean) => void;
}

const INTERACTIVE_SELECTOR = 'a, button, input, select, textarea, [role="button"], [tabindex]:not([tabindex="-1"])';

function getAccessibleLabel(element: HTMLElement): string {
  const ariaLabel = cleanTextForSpeech(element.getAttribute('aria-label') || '');
  if (ariaLabel) return ariaLabel;

  const labelledBy = element.getAttribute('aria-labelledby');
  if (labelledBy) {
    const label = cleanTextForSpeech(labelledBy
      .split(/\s+/)
      .map(id => document.getElementById(id)?.textContent?.trim())
      .filter(Boolean)
      .join(' '));
    if (label) return label;
  }

  const title = cleanTextForSpeech(element.getAttribute('title') || '');
  if (title) return title;

  const placeholder = cleanTextForSpeech(element.getAttribute('placeholder') || '');
  if (placeholder) return placeholder;

  const text = cleanTextForSpeech(element.textContent || '');
  return text || 'Điều khiển không có nhãn';
}

function isVisible(element: HTMLElement): boolean {
  if (element.hidden) return false;
  const style = window.getComputedStyle(element);
  if (style.display === 'none' || style.visibility === 'hidden') return false;
  return element.getClientRects().length > 0;
}

function getCurrentPageText(): string {
  const main = document.getElementById('main-content');
  if (!main) return 'Không tìm thấy nội dung chính của trang.';

  const parts: string[] = [];
  const seen = new Set<string>();

  const add = (value: string) => {
    const clean = cleanTextForSpeech(value);
    if (!clean || clean.length < 2 || seen.has(clean)) return;
    seen.add(clean);
    parts.push(clean);
  };

  main.querySelectorAll('h1, h2, h3, p, [role="button"], button, a, input, select, textarea').forEach(node => {
    const element = node as HTMLElement;
    if (!isVisible(element)) return;

    const label = getAccessibleLabel(element);
    const tag = element.tagName.toLowerCase();

    if (tag === 'h1') add(`Tiêu đề: ${label}`);
    else if (tag === 'h2' || tag === 'h3') add(`Mục: ${label}`);
    else if (tag === 'button' || element.getAttribute('role') === 'button') add(`Nút: ${label}`);
    // Speak the visible link label only, never the extra phrase "Liên kết" or its URL.
    else if (tag === 'a') add(label);
    else if (tag === 'input' || tag === 'select' || tag === 'textarea') add(`Trường nhập: ${label}`);
    else add(label);
  });

  return parts.join('. ').slice(0, 2600);
}

export default function AccessibilityLayer({ enabled, onToggle }: AccessibilityLayerProps) {
  const [isOn, setIsOn] = useState(enabled);
  const [liveMessage, setLiveMessage] = useState('');
  const [speechRate, setSpeechRate] = useState(() => getAccessibilitySpeechRate());

  useEffect(() => {
    setIsOn(enabled);
  }, [enabled]);

  useEffect(() => {
    const handleModeChange = (event: Event) => {
      const detail = (event as CustomEvent<{ enabled?: boolean }>).detail;
      if (typeof detail?.enabled === 'boolean') {
        setIsOn(detail.enabled);
      }
    };

    window.addEventListener('accessibility_mode_change', handleModeChange);
    return () => window.removeEventListener('accessibility_mode_change', handleModeChange);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('accessibility-mode', isOn);
    document.documentElement.dataset.accessibility = isOn ? 'on' : 'off';

    return () => {
      document.body.classList.remove('accessibility-mode');
      delete document.documentElement.dataset.accessibility;
    };
  }, [isOn]);

  useEffect(() => {
    const handleFocus = (event: FocusEvent) => {
      if (!isOn) return;

      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (!target.matches(INTERACTIVE_SELECTOR)) return;
      if (target.closest('[aria-hidden="true"]')) return;

      const label = getAccessibleLabel(target);
      const tag = target.tagName.toLowerCase();
      const role = target.getAttribute('role') || (
        tag === 'button' ? 'nút' :
        tag === 'a' ? '' :
        tag === 'input' || tag === 'textarea' || tag === 'select' ? 'trường nhập' :
        'điều khiển'
      );
      // Don't announce the word "liên kết"; the visible label is enough here.
      const spokenLabel = role ? `${role}: ${label}` : label;
      setLiveMessage(spokenLabel);
      announceAccessibility(spokenLabel);
    };

    document.addEventListener('focusin', handleFocus);
    return () => document.removeEventListener('focusin', handleFocus);
  }, [isOn]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        stopTTS();
        setLiveMessage('Đã dừng đọc giọng nói.');
        return;
      }

      const target = event.target as HTMLElement | null;
      const editing = !!target?.closest('input, textarea, [contenteditable="true"]');

      if (!editing && event.altKey && !event.ctrlKey && !event.metaKey && event.key.toLowerCase() === 'v') {
        event.preventDefault();
        const next = !isOn;
        setAccessibilityMode(next);
        onToggle(next);
        setIsOn(next);
        setLiveMessage(next ? 'Đã bật trợ năng khiếm thị.' : 'Đã tắt trợ năng khiếm thị.');
        return;
      }

      if (isOn && !editing && event.altKey && !event.ctrlKey && !event.metaKey && event.key.toLowerCase() === 'r') {
        event.preventDefault();
        repeatLastSpeech();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOn, onToggle]);

  const speedLabel = useMemo(() => {
    if (speechRate <= 0.8) return 'Chậm';
    if (speechRate >= 1.2) return 'Nhanh';
    return 'Chuẩn';
  }, [speechRate]);

  const toggle = () => {
    const next = !isOn;
    setAccessibilityMode(next);
    onToggle(next);
    setIsOn(next);
    setLiveMessage(next ? 'Đã bật trợ năng khiếm thị.' : 'Đã tắt trợ năng khiếm thị.');
  };

  const readPage = () => {
    const text = getCurrentPageText();
    setLiveMessage('Đang đọc nội dung trang.');
    // Let the speech service switch voices for English words and Vietnamese labels.
    playTTS(text, { rate: speechRate });
  };

  const changeSpeed = (next: number) => {
    setSpeechRate(next);
    setAccessibilitySpeechRate(next);
    playTTS(`Tốc độ giọng đọc: ${next < 1 ? 'chậm' : next > 1 ? 'nhanh' : 'chuẩn'}`, {
      forceVietnamese: true,
      rate: next
    });
  };

  return (
    <>
      <a
        href="#main-content"
        className="fixed left-3 top-3 z-[300] -translate-y-32 rounded-xl bg-[#4b4b4b] px-4 py-3 text-sm font-black text-white shadow-xl transition-transform focus:translate-y-0"
      >
        Bỏ qua điều hướng, đến nội dung chính
      </a>

      <div
        id="screen-reader-live-region"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {liveMessage}
      </div>

      {isOn && (
        <aside
          aria-label="Bảng điều khiển trợ năng khiếm thị"
          className="fixed bottom-5 right-5 z-[250] w-[min(360px,calc(100vw-24px))] rounded-3xl border-2 border-[#1cb0f6]/30 bg-white p-4 shadow-2xl"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eaf7ff] text-[#1cb0f6]">
                <Eye size={24} strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-sm font-black uppercase tracking-wide text-[#4b4b4b]">
                  Trợ năng khiếm thị
                </h2>
                <p className="text-[11px] font-bold text-[#888]">
                  Bàn phím + giọng nói · Alt+V bật/tắt
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={toggle}
              aria-label="Tắt trợ năng khiếm thị"
              className="rounded-xl border-2 border-[#e5e5e5] p-2 text-[#666] hover:bg-[#f7f7f7] focus-visible:ring-4 focus-visible:ring-[#1cb0f6]/30"
            >
              <VolumeX size={18} />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={readPage}
              className="flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-[#e5e5e5] bg-white px-2 text-center text-[11px] font-black text-[#4b4b4b] hover:bg-[#f7f7f7] focus-visible:ring-4 focus-visible:ring-[#1cb0f6]/30"
            >
              <Volume2 size={20} />
              Đọc trang
            </button>
            <button
              type="button"
              onClick={repeatLastSpeech}
              className="flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-[#e5e5e5] bg-white px-2 text-center text-[11px] font-black text-[#4b4b4b] hover:bg-[#f7f7f7] focus-visible:ring-4 focus-visible:ring-[#1cb0f6]/30"
            >
              <RotateCcw size={20} />
              Đọc lại
            </button>
            <button
              type="button"
              onClick={() => {
                stopTTS();
                setLiveMessage('Đã dừng đọc.');
              }}
              className="flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-[#e5e5e5] bg-white px-2 text-center text-[11px] font-black text-[#4b4b4b] hover:bg-[#f7f7f7] focus-visible:ring-4 focus-visible:ring-[#1cb0f6]/30"
            >
              <Square size={18} />
              Dừng đọc
            </button>
          </div>

          <div className="mt-3 rounded-2xl bg-[#f7faff] p-3">
            <div className="mb-2 flex items-center gap-2">
              <Settings2 size={16} className="text-[#1cb0f6]" />
              <span className="text-[11px] font-black uppercase tracking-wider text-[#666]">
                Tốc độ đọc: {speedLabel}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[0.8, 1.0, 1.2].map(rate => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => changeSpeed(rate)}
                  aria-pressed={speechRate === rate}
                  className={`rounded-xl border-2 px-2 py-2 text-xs font-black focus-visible:ring-4 focus-visible:ring-[#1cb0f6]/30 ${
                    speechRate === rate
                      ? 'border-[#1cb0f6] bg-[#1cb0f6] text-white'
                      : 'border-[#e5e5e5] bg-white text-[#666]'
                  }`}
                >
                  {rate === 0.8 ? 'Chậm' : rate === 1 ? 'Chuẩn' : 'Nhanh'}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 rounded-2xl border border-[#e5e5e5] bg-white p-3 text-[11px] font-bold text-[#777]">
            <Keyboard size={16} className="shrink-0 text-[#1cb0f6]" />
            <span>
              Tab: di chuyển · Enter: chọn · Esc: dừng đọc · Alt+R: đọc lại
            </span>
          </div>
        </aside>
      )}
    </>
  );
}
