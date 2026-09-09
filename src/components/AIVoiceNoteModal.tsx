import { useEffect, useRef, useState } from "react";
import { Bot, Languages, Mic, MicOff, Sparkles, X } from "lucide-react";
import toast from "react-hot-toast";
import { useNotes } from "../hooks/useNotes";
import { useVoiceSearch } from "../hooks/useVoiceSearch";
import { useAIChat } from "../contexts/AIChatContext";
import {
  applyLineBreaks,
  findBestNoteMatch,
  parseAIMessageCommand,
  parseDeleteCommand,
  parseSayCommand,
} from "../utils/noteMatch";

const MAX_TITLE_LENGTH = 20;
const SILENCE_TIMEOUT = 3000;

const LANGUAGES = [
  { value: "fa-IR", label: "فارسی" },
  { value: "en-US", label: "English" },
];

function buildNoteTitle(text: string): string {
  const normalized = text.trim().replace(/\s+/g, " ");
  if (normalized.length <= MAX_TITLE_LENGTH) {
    return normalized;
  }
  return `${normalized.slice(0, MAX_TITLE_LENGTH)}...`;
}

export default function AIVoiceNoteModal() {
  const { setNotes, notes, handelDelete } = useNotes();
  const { sendToAI } = useAIChat();
  const [isOpen, setIsOpen] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");
  const [selectedLang, setSelectedLang] = useState("fa-IR");

  const finalTextRef = useRef("");
  const cancelRef = useRef(false);

  const resetAndClose = () => {
    finalTextRef.current = "";
    setTranscript("");
    setError("");
    setIsOpen(false);
  };

  const addNoteAndClose = (spokenText: string) => {
    const description = applyLineBreaks(spokenText);
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

  const handleVoiceDelete = (spokenTitle: string) => {
    if (!spokenTitle.trim()) {
      setError(
        "لطفاً نام یادداشت را هم بگویید؛ سپس عبارت «حذف از یادداشت‌ها» را بگویید.",
      );
      return;
    }

    const matchedNote = findBestNoteMatch(notes, spokenTitle);

    if (!matchedNote) {
      setError(`یادداشتی با عنوان «${spokenTitle}» پیدا نشد. دوباره تلاش کنید.`);
      toast.error("یادداشت‌ای با این عنوان پیدا نشد");
      return;
    }

    handelDelete(matchedNote.id);
    toast.success(`یادداشت «${matchedNote.title}» حذف شد`, {
      duration: 2600,
    });
    resetAndClose();
  };

  const {
    isListening,
    isSupported,
    startListening,
    stopListening,
  } = useVoiceSearch({
    lang: selectedLang,
    silenceTimeout: SILENCE_TIMEOUT,
    onTranscript: (text) => {
      setTranscript(text);
    },
    onResult: (text) => {
      finalTextRef.current = text;
    },
    onEnd: () => {
      if (cancelRef.current) {
        cancelRef.current = false;
        return;
      }
      const spokenText = finalTextRef.current.trim();
      if (!spokenText) {
        setError("صدایی شنیده نشد. دوباره تلاش کنید.");
        return;
      }

      const aiMessage = parseAIMessageCommand(spokenText);
      if (aiMessage.isAIMessage) {
        if (!aiMessage.message.trim()) {
          setError(
            "لطفاً متن پیام را هم بگویید؛ سپس عبارت «پیام به AI» را بگویید.",
          );
          return;
        }
        sendToAI(aiMessage.message);
        resetAndClose();
        return;
      }

      const sayCommand = parseSayCommand(spokenText);
      if (sayCommand.isSay) {
        sendToAI(sayCommand.message);
        resetAndClose();
        return;
      }

      const deleteCommand = parseDeleteCommand(spokenText);
      if (deleteCommand.isDelete) {
        handleVoiceDelete(deleteCommand.spokenTitle);
        return;
      }

      addNoteAndClose(spokenText);
    },
    onError: (code) => {
      if (code === "not-allowed") {
        setError(
          "دسترسی میکروفون داده نشد. لطفاً اجازه استفاده از میکروفون را در تنظیمات مرورگر فعال کنید.",
        );
      } else if (code === "no-speech") {
        setError("صدایی شنیده نشد. دوباره تلاش کنید.");
      } else if (code !== "aborted") {
        setError("تبدیل گفتار به متن متوقف شد. لطفاً دوباره تلاش کنید.");
      }
    },
  });

  const handleStartListening = () => {
    if (!isSupported) {
      setError(
        "مرورگر شما تبدیل گفتار به متن را پشتیبانی نمی‌کند. لطفاً از Chrome یا Edge استفاده کنید.",
      );
      return;
    }

    cancelRef.current = false;
    finalTextRef.current = "";
    setTranscript("");
    setError("");

    startListening();
  };

  const handleCancel = () => {
    cancelRef.current = true;
    stopListening();
    resetAndClose();
  };

  useEffect(() => {
    if (!isOpen) return undefined;

    const openTimer = window.setTimeout(handleStartListening, 250);

    return () => {
      window.clearTimeout(openTimer);
      cancelRef.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const hasTranscript = transcript.trim().length > 0;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="افزودن یادداشت صوتی با هوش مصنوعی"
        title="افزودن یادداشت صوتی با هوش مصنوعی"
        className="bot-fab fixed left-5 top-auto z-40 bottom-24 lg:left-[17.5rem] lg:bottom-7"
      >
        <span aria-hidden className="bot-fab-aura" />
        <span aria-hidden className="bot-fab-aura bot-fab-aura-delay" />
        <span aria-hidden className="bot-fab-orb" />
        <span className="bot-fab-core">
          <Bot size={28} strokeWidth={2} className="bot-fab-icon" />
        </span>
        <span className="bot-fab-label">دستیار هوشمند صوتی</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-canvas-base/90 px-4 py-6 backdrop-blur-xl">
          <section
            dir="rtl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ai-voice-title"
            className="flex w-full max-w-md flex-col overflow-hidden rounded-3xl border border-border-precision bg-surface-card shadow-[0_30px_90px_rgba(0,0,0,0.65)] animate-fadeInUp"
          >
            <header className="relative flex shrink-0 items-center justify-between border-b border-border-precision bg-surface-intermediate/40 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-container text-on-primary-container shadow-glow">
                  <Sparkles size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <h2
                    id="ai-voice-title"
                    className="text-lg font-bold tracking-tight text-text-primary"
                  >
                    یادداشت صوتی هوشمند
                  </h2>
                  <p className="text-[11px] text-text-muted">
                    برای حذف: «... حذف از یادداشت‌ها» · برای AI: «... پیام به AI» · خط جدید: «بعدی»
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCancel}
                aria-label="بستن"
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border-precision bg-surface-container text-text-muted transition-all duration-200 hover:border-primary-container/40 hover:bg-primary-container/10 hover:text-accent-glow"
              >
                <X size={18} strokeWidth={2.2} />
              </button>
            </header>

            <div className="custom-scrollbar flex flex-col gap-5 p-6">
              <div className="flex items-center justify-between rounded-2xl border border-border-precision bg-surface-container-lowest p-3 px-4">
                <span className="flex items-center gap-2 text-xs font-semibold text-text-secondary">
                  <Languages size={14} className="text-accent-glow" />
                  زبان گفتار
                </span>
                <div className="flex gap-1 rounded-xl border border-border-precision bg-surface-intermediate p-1">
                  {LANGUAGES.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      disabled={isListening}
                      onClick={() => setSelectedLang(option.value)}
                      className={`flex h-8 items-center justify-center rounded-lg px-4 text-xs font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${
                        selectedLang === option.value
                          ? "bg-primary-container text-on-primary-container shadow-lg shadow-primary-container/30"
                          : "text-text-muted hover:text-text-primary"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative flex flex-col items-center gap-4 rounded-2xl border border-border-precision bg-surface-container-lowest p-6 pt-8">
                <div className="relative flex h-20 w-20 items-center justify-center">
                  {isListening && (
                    <span className="absolute inset-0 animate-ping rounded-full border border-accent-glow/40" />
                  )}
                  <span
                    className={`relative flex h-16 w-16 items-center justify-center rounded-full border transition-all duration-300 ${
                      isListening
                        ? "border-primary-container/60 bg-primary-container/15 text-accent-glow shadow-[0_0_35px_rgba(59,130,246,0.45)]"
                        : "border-border-precision bg-surface-container text-text-muted"
                    }`}
                  >
                    {isListening ? (
                      <Mic size={28} strokeWidth={2.2} />
                    ) : (
                      <MicOff size={28} strokeWidth={2.2} />
                    )}
                  </span>
                </div>

                <p className="text-center text-sm font-medium text-text-secondary">
                  {isListening
                    ? hasTranscript
                      ? "در حال شنیدن..."
                      : "در حال گوش دادن... صحبت کنید"
                    : "برای شروع دوباره، روی میکروفون بزنید"}
                </p>

                {hasTranscript && (
                  <div className="w-full rounded-xl border border-border-precision bg-surface-intermediate p-3.5">
                    <p
                      dir="auto"
                      className="max-h-36 overflow-y-auto whitespace-pre-wrap text-[14px] leading-7 text-text-primary"
                    >
                      {transcript}
                    </p>
                  </div>
                )}

                {error && (
                  <p
                    role="alert"
                    className="w-full rounded-xl border border-priority-urgent/25 bg-priority-urgent/10 p-3 text-center text-xs leading-5 text-priority-urgent"
                  >
                    {error}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                {isListening ? (
                  <button
                    type="button"
                    onClick={stopListening}
                    disabled={!hasTranscript}
                    className="flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-primary-container px-5 text-sm font-bold text-on-primary-container transition hover:bg-accent-electric active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Mic size={17} strokeWidth={2.4} />
                    پایان و ثبت
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleStartListening}
                    className="flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-primary-container px-5 text-sm font-bold text-on-primary-container transition hover:bg-accent-electric active:scale-[0.98]"
                  >
                    <Mic size={17} strokeWidth={2.4} />
                    شروع صحبت
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex h-11 shrink-0 items-center justify-center rounded-2xl border border-border-precision bg-surface-container px-5 text-sm font-semibold text-text-secondary transition hover:border-outline-variant hover:text-text-primary active:scale-[0.98]"
                >
                  انصراف
                </button>
              </div>

              <p className="flex items-center justify-center gap-1.5 text-center text-[10px] leading-5 text-text-muted">
                <Bot size={12} className="text-accent-glow" />
                «... پیام به AI» ارسال به AI · «... حذف از یادداشت‌ها» حذف نوت · «بعدی» خط جدید
              </p>
            </div>
          </section>
        </div>
      )}
    </>
  );
}