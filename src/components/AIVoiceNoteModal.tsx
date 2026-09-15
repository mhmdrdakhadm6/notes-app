import { useEffect, useRef, useState } from "react";
import { Bot, CheckCircle2, Languages, Mic, MicOff, Sparkles, X } from "lucide-react";
import toast from "react-hot-toast";
import { useVoiceSearch } from "../hooks/useVoiceSearch";
import { useAIChat } from "../contexts/AIChatContext";
import { useNexdo } from "../contexts/NexdoContext";
import {
  applyLineBreaks,
  findBestTaskMatch,
  matchPageLabel,
  parseAIMessageCommand,
  parseFullscreenCommand,
  parseNavigateCommand,
  parseSayCommand,
  parseTaskActionCommand,
} from "../utils/noteMatch";
import { classifyVoiceIntent, hasAIApiKey } from "../utils/aiIntent";
import { useWakeWord } from "../hooks/useWakeWord";
import { useLocalStorage } from "../hooks/useLocalStorage";
import type { Page } from "../types/nexdo";

const MAX_TITLE_LENGTH = 20;
const SILENCE_TIMEOUT = 3000;

const PAGE_TITLES: Record<Page, string> = {
  dashboard: "داشبورد",
  tasks: "وظایف من",
  calendar: "تقویم",
  projects: "پروژه‌ها",
  notes: "یادداشت‌ها",
  analytics: "تحلیل‌ها",
  settings: "تنظیمات",
  help: "راهنما و پشتیبانی",
  profile: "پروفایل",
};

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
  const { addTask, tasks, deleteTask, toggleComplete, setPage } = useNexdo();
  const [isOpen, setIsOpen] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");
  const [selectedLang, setSelectedLang] = useState("fa-IR");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [wakeEnabled, setWakeEnabled] = useLocalStorage("nexdo-wakeword", false);

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

  const handleVoiceAction = (command: { action: string; spokenTitle: string }) => {
    if (!command.spokenTitle.trim()) {
      setError(
        command.action === "delete"
          ? "لطفاً نام تسک را هم بگویید؛ مثلاً «تسک خرید نان را حذف کن»."
          : "لطفاً نام تسک را هم بگویید؛ مثلاً «خرید نان را انجام دادم».",
      );
      return;
    }

    const matchedTask = findBestTaskMatch(tasks, command.spokenTitle);

    if (!matchedTask) {
      setError(`تسکی با عنوان «${command.spokenTitle}» پیدا نشد. دوباره تلاش کنید.`);
      toast.error("تسکی با این عنوان پیدا نشد");
      return;
    }

    if (command.action === "delete") {
      deleteTask(matchedTask.id);
      toast.success(`تسک «${matchedTask.title}» حذف شد`, { duration: 2600 });
    } else {
      if (matchedTask.status === "completed") {
        toast("این تسک قبلاً انجام شده", { duration: 2200 });
        resetAndClose();
        return;
      }
      toggleComplete(matchedTask.id);
      toast.success(`تسک «${matchedTask.title}» انجام شد ✓`, { duration: 2600 });
    }
    resetAndClose();
  };

  const handleFullscreen = async (request: "enter" | "exit") => {
    const el = document.fullscreenElement || (document as any).webkitFullscreenElement || null;
    try {
      if (request === "enter") {
        if (el) {
          toast("هم‌اکنون در حالت تمام صفحه هستید", { duration: 2200 });
        } else {
          const root = document.documentElement;
          if (root?.requestFullscreen) {
            await root.requestFullscreen();
          } else if ((root as any)?.webkitRequestFullscreen) {
            await (root as any).webkitRequestFullscreen();
          } else {
            toast.error("حالت تمام صفحه در این مرورگر پشتیبانی نمی‌شود");
            resetAndClose();
            return;
          }
          toast.success("حالت تمام صفحه فعال شد", { duration: 2200 });
        }
      } else if (el) {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        }
        toast.success("حالت تمام صفحه بسته شد", { duration: 2200 });
      } else {
        toast("در حالت تمام صفحه نیستید", { duration: 2200 });
      }
    } catch {
      toast.error("تغییر حالت تمام صفحه ناموفق بود");
    }
    resetAndClose();
  };

  type RoutedCommand =
    | { kind: "ai_chat"; message: string }
    | { kind: "say"; message: string }
    | { kind: "fullscreen"; request: "enter" | "exit" }
    | { kind: "navigate"; page: Page }
    | { kind: "task_action"; action: "delete" | "complete"; spokenTitle: string }
    | { kind: "add"; text: string };

  const mapLocalCommand = (spokenText: string): RoutedCommand => {
    const aiMessage = parseAIMessageCommand(spokenText);
    if (aiMessage.isAIMessage) {
      return { kind: "ai_chat", message: aiMessage.message };
    }

    const sayCommand = parseSayCommand(spokenText);
    if (sayCommand.isSay) {
      return { kind: "say", message: sayCommand.message };
    }

    const fullscreenCommand = parseFullscreenCommand(spokenText);
    if (
      fullscreenCommand.isFullscreen &&
      fullscreenCommand.request !== "none"
    ) {
      return { kind: "fullscreen", request: fullscreenCommand.request };
    }

    const navigateCommand = parseNavigateCommand(spokenText);
    if (navigateCommand.isNavigate && navigateCommand.page) {
      return { kind: "navigate", page: navigateCommand.page };
    }

    const actionCommand = parseTaskActionCommand(spokenText);
    if (actionCommand.action !== "none") {
      return {
        kind: "task_action",
        action: actionCommand.action,
        spokenTitle: actionCommand.spokenTitle,
      };
    }

    return { kind: "add", text: spokenText };
  };

  const dispatchCommand = (command: RoutedCommand) => {
    setIsAnalyzing(false);

    switch (command.kind) {
      case "ai_chat": {
        if (!command.message.trim()) {
          setError(
            "لطفاً متن پیام را هم بگویید؛ سپس عبارت «پیام به AI» را بگویید.",
          );
          return;
        }
        sendToAI(command.message);
        resetAndClose();
        return;
      }
      case "say":
        sendToAI(command.message);
        resetAndClose();
        return;
      case "fullscreen":
        void handleFullscreen(command.request);
        return;
      case "navigate":
        setPage(command.page);
        toast.success(`به تب «${PAGE_TITLES[command.page]}» بردی`, {
          duration: 2000,
        });
        resetAndClose();
        return;
      case "task_action":
        handleVoiceAction(command);
        return;
      case "add":
        addTaskAndClose(command.text);
        return;
      default:
        return;
    }
  };

  const runVoiceCommand = async (spokenText: string) => {
    setIsAnalyzing(true);
    setError("");

    if (hasAIApiKey()) {
      const ai = await classifyVoiceIntent(spokenText);
      if (ai) {
        if (ai.action === "delete_task" || ai.action === "complete_task") {
          const localFallbackTitle =
            parseTaskActionCommand(spokenText).spokenTitle;
          dispatchCommand({
            kind: "task_action",
            action:
              ai.action === "delete_task" ? "delete" : "complete",
            spokenTitle: ai.title || localFallbackTitle,
          });
          return;
        }
        if (ai.action === "fullscreen_enter" || ai.action === "fullscreen_exit") {
          dispatchCommand({
            kind: "fullscreen",
            request: ai.action === "fullscreen_enter" ? "enter" : "exit",
          });
          return;
        }
        if (ai.action === "navigate") {
          const page = matchPageLabel(ai.title);
          if (page) {
            dispatchCommand({ kind: "navigate", page });
            return;
          }
        }
        if (ai.action === "ai_chat") {
          dispatchCommand({ kind: "ai_chat", message: ai.message });
          return;
        }
        if (ai.action === "say") {
          dispatchCommand({ kind: "say", message: ai.message });
          return;
        }
        if (ai.action === "add_task") {
          dispatchCommand({ kind: "add", text: ai.title || spokenText });
          return;
        }
      }
    }

    dispatchCommand(mapLocalCommand(spokenText));
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
      void runVoiceCommand(spokenText);
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

  const wakePaused = isOpen || isListening || isAnalyzing;
  const { isActive: wakeActive } = useWakeWord({
    enabled: wakeEnabled && !wakePaused,
    lang: selectedLang,
    onWake: () => {
      cancelRef.current = false;
      finalTextRef.current = "";
      setTranscript("");
      setError("");
      setIsOpen(true);
    },
    onError: (code) => {
      if (code === "not-allowed" || code === "service-not-allowed") {
        setWakeEnabled(false);
        toast.error("دسترسی میکروفون برای فرمان «هی مکس» داده نشد", {
          duration: 2600,
        });
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
                className="voice-stagger flex items-center justify-between rounded-xl border border-border-precision bg-surface-container-lowest p-2 px-3"
                style={{ animationDelay: "150ms" }}
              >
                <span className="flex items-center gap-2 text-[11px] font-semibold text-text-secondary">
                  <span className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-container/25 text-accent-glow">
                    <Mic size={14} strokeWidth={2.4} />
                    {isSupported && wakeEnabled && wakeActive && (
                      <span
                        aria-hidden
                        className="absolute -end-0.5 -top-0.5 h-2 w-2 animate-ping rounded-full bg-accent-electric"
                      />
                    )}
                  </span>
                  فرمان «هی مکس»
                </span>
                {isSupported ? (
                  <button
                    type="button"
                    role="switch"
                    aria-checked={wakeEnabled}
                    onClick={() => setWakeEnabled((v) => !v)}
                    className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${
                      wakeEnabled
                        ? "bg-accent-gradient shadow-glow"
                        : "bg-surface-container-highest"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-all duration-200 ${
                        wakeEnabled ? "start-[1.375rem]" : "start-0.5"
                      }`}
                    />
                  </button>
                ) : (
                  <span className="text-[10px] font-medium text-text-muted">
                    مرورگر پشتیبانی نمی‌کند
                  </span>
                )}
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
                  {isAnalyzing
                    ? "در حال تحلیل فرمان با هوش مصنوعی..."
                    : isListening
                      ? hasTranscript
                        ? "در حال شنیدن..."
                        : "در حال گوش دادن... صحبت کنید"
                      : "برای شروع دوباره، روی میکروفون بزنید"}
                </p>

                {isAnalyzing && (
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 animate-ping rounded-full bg-accent-glow" />
                    <span className="text-[10px] font-semibold text-text-muted">
                      تشخیص نیت و اجرای دقیق فرمان
                    </span>
                  </div>
                )}

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
                    disabled={!hasTranscript || isAnalyzing}
                    className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-accent-gradient px-4 text-sm font-bold text-on-primary-container shadow-glow transition hover:brightness-110 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Mic size={16} strokeWidth={2.4} />
                    پایان و اجرای فرمان
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleStartListening}
                    disabled={isAnalyzing}
                    className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-accent-gradient px-4 text-sm font-bold text-on-primary-container shadow-glow transition hover:brightness-110 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Mic size={16} strokeWidth={2.4} />
                    شروع صحبت
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isAnalyzing}
                  className="flex h-10 shrink-0 items-center justify-center rounded-xl border border-border-precision bg-surface-container px-4 text-sm font-semibold text-text-secondary transition hover:border-outline-variant hover:text-text-primary active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  انصراف
                </button>
              </div>

              <p
                className="voice-stagger flex items-center justify-center gap-1.5 text-center text-[10px] leading-4 text-text-muted"
                style={{ animationDelay: "320ms" }}
              >
                <Bot size={12} className="text-accent-glow" />
                «حذف تسک» · «انجام شد» · «تمام‌صفحه» · «پیام به AI» · «... اضافه کن»
              </p>
            </div>
          </section>
        </div>
      )}
    </>
  );
}