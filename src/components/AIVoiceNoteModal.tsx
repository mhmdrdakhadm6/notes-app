import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Bot, Mic, MicOff, Sparkles, X } from "lucide-react";
import toast from "react-hot-toast";
import { useVoiceSearch } from "../hooks/useVoiceSearch";
import { useAIChat } from "../contexts/AIChatContext";
import { useNexdo } from "../contexts/NexdoContext";
import {
  applyLineBreaks,
  findBestProjectMatch,
  findBestTaskMatch,
  matchPageLabel,
  parseAIMessageCommand,
  parseFullscreenCommand,
  parseNavigateCommand,
  parseProjectReference,
  parseSayCommand,
  parseTaskActionCommand,
} from "../utils/noteMatch";
import { classifyVoiceIntent, hasAIApiKey } from "../utils/aiIntent";
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

function buildTaskTitle(text: string): string {
  const normalized = text.trim().replace(/\s+/g, " ");
  if (normalized.length <= MAX_TITLE_LENGTH) {
    return normalized;
  }
  return `${normalized.slice(0, MAX_TITLE_LENGTH)}...`;
}

export default function AIVoiceNoteModal() {
  const { sendToAI } = useAIChat();
  const { addTask, tasks, deleteTask, toggleComplete, setPage, projects } =
    useNexdo();
  const [isOpen, setIsOpen] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");
  const selectedLang = "fa-IR";
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [closing, setClosing] = useState(false);
  const [entered, setEntered] = useState(false);
  const [dragY, setDragY] = useState(0);

  const finalTextRef = useRef("");
  const cancelRef = useRef(false);
  const closingRef = useRef(false);

  const CLOSE_TIMEOUT_MS = 340;
  const DRAG_CLOSE_THRESHOLD = 120;
  const closeTimerRef = useRef<number | null>(null);
  const dragStartYRef = useRef<number | null>(null);

  const finalizeClose = () => {
    finalTextRef.current = "";
    setTranscript("");
    setError("");
    setClosing(false);
    setDragY(0);
    setIsOpen(false);
    closingRef.current = false;
    closeTimerRef.current = null;
  };

  const resetAndClose = () => {
    if (closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    closeTimerRef.current = window.setTimeout(finalizeClose, CLOSE_TIMEOUT_MS);
  };

  useEffect(
    () => () => {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
      }
    },
    [],
  );

  const addTaskAndClose = (spokenText: string, opts?: { raw?: string }) => {
    const raw = opts?.raw || spokenText;
    const ref = parseProjectReference(raw);
    const titleText =
      ref.hasProject && raw === spokenText ? ref.cleanTranscript : spokenText;
    const description = applyLineBreaks(titleText);
    if (!description) return;
    const title = buildTaskTitle(description);
    const project = ref.hasProject
      ? findBestProjectMatch(projects, ref.projectName)
      : null;
    addTask({
      title,
      description,
      priority: "medium",
      dueDate: null,
      dueTime: null,
      projectId: project?.id ?? null,
      tags: [],
    });
    toast.success(
      project
        ? `تسک «${title}» به پروژه «${project.name}» اضافه شد`
        : `تسک «${title}» ساخته شد و در تب «وظایف» است`,
      { duration: 2600 },
    );
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
    | { kind: "add"; text: string; raw?: string };

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

    return { kind: "add", text: spokenText, raw: spokenText };
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
        addTaskAndClose(command.text, { raw: command.raw });
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
          dispatchCommand({
            kind: "add",
            text: ai.title || spokenText,
            raw: spokenText,
          });
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

  const isMobileView = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(max-width: 767px)").matches;

  const handleDragStart = (event: ReactPointerEvent<HTMLElement>) => {
    if (!isMobileView() || closingRef.current) return;
    if (event.pointerType !== "touch") return;
    dragStartYRef.current = event.clientY;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleDragMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (dragStartYRef.current === null || closingRef.current) return;
    if (event.pointerType !== "touch") return;
    const dy = event.clientY - dragStartYRef.current;
    if (dy <= 0) {
      setDragY(0);
      return;
    }
    const resisted = Math.pow(dy, 0.75) * 1.4;
    setDragY(Math.round(resisted));
  };

  const handleDragEnd = () => {
    if (dragStartYRef.current === null || closingRef.current) return;
    const shouldClose = dragY >= DRAG_CLOSE_THRESHOLD;
    dragStartYRef.current = null;
    setDragY(0);
    if (shouldClose) {
      cancelRef.current = true;
      stopListening();
      resetAndClose();
    }
  };

  useEffect(() => {
    if (!isOpen) return undefined;

    setEntered(false);
    const openTimer = window.setTimeout(handleStartListening, 250);
    const enteredTimer = window.setTimeout(() => setEntered(true), 680);

    return () => {
      window.clearTimeout(openTimer);
      window.clearTimeout(enteredTimer);
      cancelRef.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const hasTranscript = transcript.trim().length > 0;

  return (
    <>
      <svg aria-hidden="true" width="0" height="0" className="pointer-events-none absolute">
        <defs>
          <filter id="glass-distortion-voice" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.025 0.025" numOctaves="2" seed="92" result="noise" />
            <feGaussianBlur in="noise" stdDeviation="2" result="blurred" />
            <feDisplacementMap in="SourceGraphic" in2="blurred" scale="65" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>
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
        <div
          className={`fixed inset-0 z-50 flex items-end justify-center bg-canvas-base/80 backdrop-blur-xl md:items-center md:px-4 md:py-6 ${
            closing ? "voice-overlay-out" : "voice-overlay-in"
          }`}
        >
          <section
            dir="rtl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ai-voice-title"
            style={{
              transform: dragY > 0 ? `translateY(${dragY}px)` : undefined,
              transition:
                dragY > 0
                  ? "none"
                  : "transform 260ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
            className={`relative flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-t-[28px] border border-white/20 bg-transparent shadow-[0_-24px_70px_rgba(0,0,0,0.55)] md:max-h-[85vh] md:rounded-3xl md:shadow-[0_30px_90px_rgba(0,0,0,0.65)] notifications-glass-panel voice-glass-panel ${
              closing
                ? "voice-sheet-out"
                : dragY > 0
                  ? ""
                  : entered
                    ? ""
                    : "voice-sheet-in"
            }`}
          >
            <header
              onPointerDown={handleDragStart}
              onPointerMove={handleDragMove}
              onPointerUp={handleDragEnd}
              onPointerCancel={handleDragEnd}
              style={{ touchAction: isMobileView() ? "none" : undefined }}
              className="voice-glass-header relative shrink-0 select-none border-b border-white/10"
            >
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
                className="voice-glass-card voice-stagger relative flex flex-col items-center gap-2.5 overflow-hidden rounded-2xl px-4 pb-4 pt-5"
                style={{ animationDelay: "60ms" }}
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
                  <div className="voice-glass-inset voice-stagger w-full rounded-xl p-3.5">
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
                    className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-accent-gradient px-4 text-sm font-bold text-on-primary-container shadow-glow transition hover:brightness-110 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Mic size={16} strokeWidth={2.4} />
                    پایان و اجرای فرمان
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleStartListening}
                    disabled={isAnalyzing}
                    className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-accent-gradient px-4 text-sm font-bold text-on-primary-container shadow-glow transition hover:brightness-110 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Mic size={16} strokeWidth={2.4} />
                    شروع صحبت
                  </button>
                )}
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