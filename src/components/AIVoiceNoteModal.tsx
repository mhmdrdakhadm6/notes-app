import { useEffect, useRef, useState } from "react";
import { Bot, Mic, MicOff, Sparkles, X } from "lucide-react";
import toast from "react-hot-toast";
import { useNotes } from "../hooks/useNotes";

const MAX_TITLE_LENGTH = 20;
const SILENCE_OVER_TIMEOUT = 2400;
const NO_SPEECH_TIMEOUT = 10000;

interface SpeechRecognitionEventLike {
  results?: ArrayLike<ArrayLike<{ transcript?: string | undefined } | undefined>>;
}

interface SpeechRecognitionErrorEventLike {
  error?: string;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  const browserWindow = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return browserWindow.SpeechRecognition ?? browserWindow.webkitSpeechRecognition ?? null;
}

function buildNoteTitle(text: string): string {
  const normalized = text.trim().replace(/\s+/g, " ");
  if (normalized.length <= MAX_TITLE_LENGTH) {
    return normalized;
  }
  return `${normalized.slice(0, MAX_TITLE_LENGTH)}...`;
}

export default function AIVoiceNoteModal() {
  const { setNotes } = useNotes();
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const silenceTimerRef = useRef<number | null>(null);
  const transcriptRef = useRef("");
  const saveOnStopRef = useRef(false);
  const isMountedRef = useRef(true);

  const clearSilenceTimer = () => {
    if (silenceTimerRef.current !== null) {
      window.clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  };

  const stopRecognition = () => {
    clearSilenceTimer();
    try {
      recognitionRef.current?.stop();
    } catch {
      /* empty */
    }
  };

  const resetAndClose = () => {
    transcriptRef.current = "";
    saveOnStopRef.current = false;
    recognitionRef.current = null;
    setIsListening(false);
    setTranscript("");
    setError("");
    setIsOpen(false);
  };

  const addNoteAndClose = (spokenText: string) => {
    const description = spokenText.trim();
    if (!description) return;

    setNotes((currentNotes) => [
      ...currentNotes,
      {
        id: crypto.randomUUID(),
        title: buildNoteTitle(description),
        description,
        date: new Date(),
        recurrence: "none",
        isPermanent: true,
      },
    ]);

    toast.success("یادداشت صوتی به نوت‌ها اضافه شد", {
      duration: 2600,
    });

    resetAndClose();
  };

  const handleCancel = () => {
    saveOnStopRef.current = false;
    clearSilenceTimer();
    try {
      recognitionRef.current?.abort();
    } catch {
      /* empty */
    }
    resetAndClose();
  };

  const startListening = () => {
    const SpeechRecognition = getSpeechRecognition();

    if (!SpeechRecognition) {
      setError(
        "مرورگر شما تبدیل گفتار به متن را پشتیبانی نمی‌کند. لطفاً از Chrome یا Edge استفاده کنید.",
      );
      return;
    }

    clearSilenceTimer();
    transcriptRef.current = "";
    saveOnStopRef.current = true;
    setTranscript("");
    setError("");

    const recognition = new SpeechRecognition();
    recognition.lang = "fa-IR";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      if (!isMountedRef.current) return;
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      if (!isMountedRef.current) return;

      let result = "";
      const resultsLength = event.results?.length ?? 0;
      for (let index = 0; index < resultsLength; index += 1) {
        const alternative = event.results?.[index]?.[0];
        if (alternative?.transcript) {
          result += alternative.transcript;
        }
      }
      result = result.trim();

      transcriptRef.current = result;
      setTranscript(result);

      clearSilenceTimer();

      if (result) {
        silenceTimerRef.current = window.setTimeout(() => {
          if (transcriptRef.current.trim()) {
            stopRecognition();
          }
        }, SILENCE_OVER_TIMEOUT);
      }
    };

    recognition.onerror = (event) => {
      if (!isMountedRef.current) return;

      if (event.error === "aborted") {
        return;
      }

      if (event.error === "not-allowed") {
        saveOnStopRef.current = false;
        setError(
          "دسترسی میکروفون داده نشد. لطفاً اجازه استفاده از میکروفون را در تنظیمات مرورگر فعال کنید.",
        );
        return;
      }

      if (event.error === "no-speech") {
        saveOnStopRef.current = false;
        setError("صدایی شنیده نشد. دوباره تلاش کنید.");
        return;
      }

      saveOnStopRef.current = false;
      setError("تبدیل گفتار به متن متوقف شد. لطفاً دوباره تلاش کنید.");
    };

    recognition.onend = () => {
      if (!isMountedRef.current) return;

      setIsListening(false);
      clearSilenceTimer();

      const spokenText = transcriptRef.current.trim();
      if (saveOnStopRef.current) {
        saveOnStopRef.current = false;
        if (spokenText) {
          addNoteAndClose(spokenText);
          return;
        }
        setError("صدایی شنیده نشد. دوباره تلاش کنید.");
      }
    };

    recognitionRef.current = recognition;

    silenceTimerRef.current = window.setTimeout(() => {
      if (!transcriptRef.current.trim()) {
        saveOnStopRef.current = false;
        setError("صدایی شنیده نشد. دوباره تلاش کنید.");
        try {
          recognition.abort();
        } catch {
          /* empty */
        }
      }
    }, NO_SPEECH_TIMEOUT);

    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
      saveOnStopRef.current = false;
      setIsListening(false);
      setError("میکروفون شروع نشد. لطفاً دوباره تلاش کنید.");
    }
  };

  useEffect(() => {
    if (!isOpen) return undefined;

    const startTimer = window.setTimeout(startListening, 250);

    return () => {
      window.clearTimeout(startTimer);
      clearSilenceTimer();
      saveOnStopRef.current = false;
      try {
        recognitionRef.current?.abort();
      } catch {
        /* empty */
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      clearSilenceTimer();
      try {
        recognitionRef.current?.abort();
      } catch {
        /* empty */
      }
    };
  }, []);

  const hasTranscript = transcript.trim().length > 0;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="افزودن یادداشت صوتی با هوش مصنوعی"
        title="افزودن یادداشت صوتی با هوش مصنوعی"
        className="group fixed bottom-5 left-5 z-40 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#093cc8]/40 bg-gradient-to-br from-[#093cc8]/30 via-[#093cc8]/10 to-black text-[#093cc8] shadow-[0_0_28px_rgba(9,60,200,0.35)] transition-all duration-300 hover:scale-105 hover:border-[#093cc8]/70 hover:shadow-[0_0_45px_rgba(9,60,200,0.55)] active:scale-95"
      >
        <Bot size={26} strokeWidth={2.2} />
        <span className="pointer-events-none absolute -inset-2 rounded-[22px] border border-[#093cc8]/15 transition-all duration-300 group-hover:-inset-1.5 group-hover:border-[#093cc8]/35" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/90 px-4 py-6 backdrop-blur-xl">
          <section
            dir="rtl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ai-voice-title"
            className="flex w-full max-w-md flex-col overflow-hidden rounded-3xl border border-[#093cc8]/20 bg-[#0a0a0a] animate-fadeInUp"
          >
            <header className="relative flex shrink-0 items-center justify-between border-b border-[#093cc8]/10 bg-gradient-to-b from-[#093cc8]/5 to-transparent px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#093cc8]/30 bg-[#093cc8]/10 text-[#093cc8]">
                  <Sparkles size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <h2
                    id="ai-voice-title"
                    className="text-lg font-bold tracking-tight text-white"
                  >
                    یادداشت صوتی هوشمند
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    صحبت کنید، به نوت تبدیل می‌شود
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCancel}
                aria-label="بستن"
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.02] text-slate-400 transition-all duration-200 hover:border-[#093cc8]/30 hover:bg-[#093cc8]/10 hover:text-[#093cc8]"
              >
                <X size={18} strokeWidth={2.2} />
              </button>
            </header>

            <div className="custom-scrollbar flex flex-col gap-5 p-6">
              <div className="relative flex flex-col items-center gap-4 rounded-2xl border border-[#093cc8]/10 bg-black/40 p-6 pt-8">
                <div className="relative flex h-20 w-20 items-center justify-center">
                  {isListening && (
                    <span className="absolute inset-0 animate-ping rounded-full border border-[#093cc8]/40" />
                  )}
                  <span
                    className={`relative flex h-16 w-16 items-center justify-center rounded-full border transition-all duration-300 ${
                      isListening
                        ? "border-[#093cc8]/50 bg-[#093cc8]/15 text-[#093cc8] shadow-[0_0_35px_rgba(9,60,200,0.45)]"
                        : "border-white/10 bg-white/[0.04] text-slate-500"
                    }`}
                  >
                    {isListening ? (
                      <Mic size={28} strokeWidth={2.2} />
                    ) : (
                      <MicOff size={28} strokeWidth={2.2} />
                    )}
                  </span>
                </div>

                <p className="text-center text-sm font-medium text-slate-200">
                  {isListening
                    ? hasTranscript
                      ? "در حال شنیدن..."
                      : "در حال گوش دادن... صحبت کنید"
                    : "برای شروع دوباره، روی میکروفون بزنید"}
                </p>

                {hasTranscript && (
                  <div className="w-full rounded-xl border border-[#093cc8]/10 bg-black/60 p-3.5">
                    <p
                      dir="auto"
                      className="max-h-36 overflow-y-auto whitespace-pre-wrap text-[14px] leading-7 text-slate-100"
                    >
                      {transcript}
                    </p>
                  </div>
                )}

                {error && (
                  <p
                    role="alert"
                    className="w-full rounded-xl border border-red-400/15 bg-red-500/[0.06] p-3 text-center text-xs leading-5 text-red-300"
                  >
                    {error}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                {isListening ? (
                  <button
                    type="button"
                    onClick={stopRecognition}
                    disabled={!hasTranscript}
                    className="flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#093cc8] px-5 text-sm font-bold text-white transition hover:bg-[#0730a0] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Mic size={17} strokeWidth={2.4} />
                    پایان و ثبت
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={startListening}
                    className="flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#093cc8] px-5 text-sm font-bold text-white transition hover:bg-[#0730a0] active:scale-[0.98]"
                  >
                    <Mic size={17} strokeWidth={2.4} />
                    شروع صحبت
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex h-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-5 text-sm font-semibold text-slate-300 transition hover:border-white/20 hover:text-white active:scale-[0.98]"
                >
                  انصراف
                </button>
              </div>

              <p className="flex items-center justify-center gap-1.5 text-center text-[10px] text-slate-500">
                <Bot size={12} className="text-[#093cc8]" />
                عنوان از ۲۰ کاراکتر اول متن ساخته می‌شود
              </p>
            </div>
          </section>
        </div>
      )}
    </>
  );
}