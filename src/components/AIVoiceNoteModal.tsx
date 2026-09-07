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
                    برای حذف: «... حذف از یادداشت‌ها» · برای AI: «... پیام به AI» · خط جدید: «بعدی»
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
              <div className="flex items-center justify-between rounded-2xl border border-[#093cc8]/10 bg-black/40 p-3 px-4">
                <span className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                  <Languages size={14} className="text-[#093cc8]" />
                  زبان گفتار
                </span>
                <div className="flex gap-1 rounded-xl border border-white/10 bg-black/60 p-1">
                  {LANGUAGES.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      disabled={isListening}
                      onClick={() => setSelectedLang(option.value)}
                      className={`flex h-8 items-center justify-center rounded-lg px-4 text-xs font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${
                        selectedLang === option.value
                          ? "bg-[#093cc8] text-white shadow-lg shadow-[#093cc8]/20"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

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
                    onClick={stopListening}
                    disabled={!hasTranscript}
                    className="flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#093cc8] px-5 text-sm font-bold text-white transition hover:bg-[#0730a0] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Mic size={17} strokeWidth={2.4} />
                    پایان و ثبت
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleStartListening}
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

              <p className="flex items-center justify-center gap-1.5 text-center text-[10px] leading-5 text-slate-500">
                <Bot size={12} className="text-[#093cc8]" />
                «... پیام به AI» ارسال به AI · «... حذف از یادداشت‌ها» حذف نوت · «بعدی» خط جدید
              </p>
            </div>
          </section>
        </div>
      )}
    </>
  );
}