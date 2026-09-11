import { useEffect, useRef, useState } from "react";
import { Bot, CheckCircle2, Languages, Mic, MicOff, Sparkles, X } from "lucide-react";
import toast from "react-hot-toast";
import { useVoiceSearch } from "../hooks/useVoiceSearch";
import { useAIChat } from "../contexts/AIChatContext";
import { useNexdo } from "../contexts/NexdoContext";
import {
  applyLineBreaks,
  findBestTaskMatch,
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

function buildTaskTitle(text: string): string {
  const normalized = text.trim().replace(/\s+/g, " ");
  if (normalized.length <= MAX_TITLE_LENGTH) {
    return normalized;
  }
  return `${normalized.slice(0, MAX_TITLE_LENGTH)}...`;
}

export default function AIVoiceNoteModal() {
  const { sendToAI } = useAIChat();
  const { addTask, tasks, deleteTask } = useNexdo();
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

  const addTaskAndClose = (spokenText: string) => {
    const description = applyLineBreaks(spokenText);
    if (!description) return;
    const title = buildTaskTitle(description);
    addTask({
      title,
      description,
      priority: "medium",
      dueDate: null,
      dueTime: null,
      projectId: null,
      tags: [],
    });
    toast.success(`تسک «${title}» ساخته شد و در تب «وظایف» است`, {
      duration: 2600,
    });
    resetAndClose();
  };

  const handleVoiceDelete = (spokenTitle: string) => {
    if (!spokenTitle.trim()) {
      setError(
        "لطفاً نام تسک را هم بگویید؛ سپس عبارت «حذف از تسک‌ها» را بگویید.",
      );
      return;
    }

    const matchedTask = findBestTaskMatch(tasks, spokenTitle);

    if (!matchedTask) {
      setError(`تسکی با عنوان «${spokenTitle}» پیدا نشد. دوباره تلاش کنید.`);
      toast.error("تسکی با این عنوان پیدا نشد");
      return;
    }

    deleteTask(matchedTask.id);
    toast.success(`تسک «${matchedTask.title}» حذف شد`, {
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

      addTaskAndClose(spokenText);
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
        aria-label="افزودن تسک صوتی با هوش مصنوعی"
        title="افزودن تسک صوتی با هوش مصنوعی"
        className="bot-fab fixed left-5 top-auto z-40 bottom-32 lg:left-[17.5rem] lg:bottom-7"
      >
        <span aria-hidden className="bot-fab-aura" />
        <span aria-hidden className="bot-fab-aura bot-fab-aura-delay" />
        <span aria-hidden className="bot-fab-orb" />
        <span aria-hidden className="bot-fab-silver" />
        <span className="bot-fab-core">
          <Bot size={28} strokeWidth={2} className="bot-fab-icon" />
        </span>
        <span className="bot-fab-label">دستیار هوشمند صوتی</span>
      </button>

      {isOpen && (
        <div className="voice-overlay-in fixed inset-0 z-50 flex items-end justify-center bg-canvas-base/80 backdrop-blur-xl md:items-center md:px-4 md:py-6">
          <section
            dir="rtl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ai-voice-title"
            className="voice-sheet-in relative flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-t-[28px] border border-border-precision bg-surface-card shadow-[0_-24px_70px_rgba(0,0,0,0.55)] md:max-h-[85vh] md:rounded-3xl md:shadow-[0_30px_90px_rgba(0,0,0,0.65)]"
          >
            <header className="relative shrink-0 border-b border-border-precision bg-gradient-to-b from-primary-container/15 via-primary-container/5 to-transparent">
              <div
                aria-hidden
                className="mx-auto mt-2 mb-1.5 h-1.5 w-12 cursor-grab rounded-full bg-outline-variant/60 md:hidden"
              />
              <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-0.5 md:px-6 md:pt-3">
                <div className="flex items-center gap-3">
                  <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-primary-container text-on-primary-container shadow-glow">
                    <Sparkles size={20} strokeWidth={2.5} />
                    <span
                      aria-hidden
                      className="voice-spin-slow absolute inset-0 rounded-xl border border-dashed border-accent-glow/40"
                    />
                  </div>
                  <div>
                    <h2
                      id="ai-voice-title"
                      className="text-lg font-bold tracking-tight text-text-primary"
                    >
                      تسک صوتی هوشمند
                    </h2>
                    <p className="text-[11px] leading-4 text-text-muted">
                      هر گفتاری به تسک تبدیل می‌شود · برای حذف: «... حذف از تسک‌ها»
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCancel}
                  aria-label="بستن"
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border-precision bg-surface-container text-text-muted transition-all duration-200 hover:border-primary-container/40 hover:bg-primary-container/10 hover:text-accent-glow active:scale-90"
                >
                  <X size={18} strokeWidth={2.2} />
                </button>
              </div>
            </header>

            <div className="custom-scrollbar flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain p-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:gap-4 md:p-5">
              <div
                className="voice-stagger flex items-center gap-2 rounded-xl border border-primary-container/30 bg-primary-container/10 p-2 px-3"
                style={{ animationDelay: "60ms" }}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-container/25 text-accent-glow">
                  <CheckCircle2 size={14} strokeWidth={2.4} />
                </span>
                <p className="text-[11px] font-semibold text-text-secondary">
                  این گفتار به‌صورت تسک در تب «وظایف» ثبت می‌شود
                </p>
              </div>

              <div
                className="voice-stagger flex items-center justify-between rounded-xl border border-border-precision bg-surface-container-lowest p-2 px-3"
                style={{ animationDelay: "120ms" }}
              >
                <span className="flex items-center gap-2 text-[11px] font-semibold text-text-secondary">
                  <Languages size={14} className="text-accent-glow" />
                  زبان گفتار
                </span>
                <div className="flex gap-1 rounded-lg border border-border-precision bg-surface-intermediate p-1">
                  {LANGUAGES.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      disabled={isListening}
                      onClick={() => setSelectedLang(option.value)}
                      className={`flex h-7 items-center justify-center rounded-md px-3.5 text-[11px] font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${
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

              <div
                className="voice-stagger relative flex flex-col items-center gap-2.5 overflow-hidden rounded-xl border border-border-precision bg-surface-container-lowest/70 px-4 pb-4 pt-5"
                style={{ animationDelay: "180ms" }}
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute -top-16 left-1/2 h-36 w-36 -translate-x-1/2 rounded-full bg-primary-container/25 blur-3xl"
                />
                <div className="relative flex h-20 w-20 items-center justify-center">
                  {isListening && (
                    <>
                      <span
                        aria-hidden
                        className="voice-mic-echo absolute inset-0 rounded-full bg-accent-glow/15"
                      />
                      <span
                        aria-hidden
                        className="voice-mic-echo absolute inset-0 rounded-full border border-accent-glow/50"
                        style={{ animationDelay: "0.45s" }}
                      />
                    </>
                  )}
                  <span
                    aria-hidden
                    className="voice-spin-slow absolute -inset-2.5 rounded-full border border-dashed border-accent-glow/30"
                  />
                  <span
                    className={`relative flex h-14 w-14 items-center justify-center rounded-full border transition-all duration-500 ${
                      isListening
                        ? "voice-shine border-primary-container/70 bg-primary-container/20 text-accent-glow shadow-[0_0_45px_rgba(59,130,246,0.55)]"
                        : "border-border-precision bg-surface-container text-text-muted"
                    }`}
                  >
                    {isListening ? (
                      <Mic size={24} strokeWidth={2.2} />
                    ) : (
                      <MicOff size={24} strokeWidth={2.2} />
                    )}
                  </span>
                </div>

                <p className="text-center text-[13px] font-semibold text-text-secondary">
                  {isListening
                    ? hasTranscript
                      ? "در حال شنیدن..."
                      : "در حال گوش دادن... صحبت کنید"
                    : "برای شروع دوباره، روی میکروفون بزنید"}
                </p>

                {isListening && !hasTranscript && (
                  <div className="flex h-5 items-end gap-1" aria-hidden>
                    {[0, 1, 2, 3, 4].map((index) => (
                      <span
                        key={index}
                        className="voice-eq-bar w-1 rounded-full bg-accent-glow/70"
                        style={{
                          height: `${10 + index * 5}px`,
                          animationDelay: `${index * 130}ms`,
                        }}
                      />
                    ))}
                  </div>
                )}

                {hasTranscript && (
                  <div className="voice-stagger w-full rounded-xl border border-border-precision bg-surface-intermediate p-3.5">
                    <p
                      dir="auto"
                      className="max-h-28 overflow-y-auto whitespace-pre-wrap text-[14px] leading-6 text-text-primary"
                    >
                      {transcript}
                    </p>
                  </div>
                )}

                {error && (
                  <p
                    role="alert"
                    className="voice-stagger w-full rounded-xl border border-priority-urgent/25 bg-priority-urgent/10 p-2.5 text-center text-[11px] leading-4 text-priority-urgent"
                  >
                    {error}
                  </p>
                )}
              </div>

              <div
                className="voice-stagger flex items-center gap-2"
                style={{ animationDelay: "260ms" }}
              >
                {isListening ? (
                  <button
                    type="button"
                    onClick={stopListening}
                    disabled={!hasTranscript}
                    className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-accent-gradient px-4 text-sm font-bold text-on-primary-container shadow-glow transition hover:brightness-110 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Mic size={16} strokeWidth={2.4} />
                    پایان و ثبت تسک
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleStartListening}
                    className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-accent-gradient px-4 text-sm font-bold text-on-primary-container shadow-glow transition hover:brightness-110 active:scale-[0.97]"
                  >
                    <Mic size={16} strokeWidth={2.4} />
                    شروع صحبت
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex h-10 shrink-0 items-center justify-center rounded-xl border border-border-precision bg-surface-container px-4 text-sm font-semibold text-text-secondary transition hover:border-outline-variant hover:text-text-primary active:scale-[0.97]"
                >
                  انصراف
                </button>
              </div>

              <p
                className="voice-stagger flex items-center justify-center gap-1.5 text-center text-[10px] leading-4 text-text-muted"
                style={{ animationDelay: "320ms" }}
              >
                <Bot size={12} className="text-accent-glow" />
                «... پیام به AI» ارسال به AI · «... حذف از تسک‌ها» حذف تسک · «بعدی» خط جدید
              </p>
            </div>
          </section>
        </div>
      )}
    </>
  );
}