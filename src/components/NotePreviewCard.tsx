import { useState } from "react";
import {
  X,
  Copy,
  Check,
  FileText,
  Sparkles,
  CalendarDays,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useNotes } from "../hooks/useNotes";

interface NotePreviewCardProps {
  title: string;
  description: string;
}

function NotePreviewCard({
  title,
  description,
}: NotePreviewCardProps) {
  const { setIsPreview } = useNotes();

  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(description);

      setCopied(true);

      toast.success("متن یادداشت کپی شد", {
        duration: 1800,
      });

      setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch {
      toast.error("خطا در کپی متن");
    }
  };

  return (
    <>
      <div
        dir="rtl"
        className="relative overflow-hidden rounded-[34px] border border-white/[0.08] bg-[#0b1220]/90 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,.16),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,.12),transparent_24%)]" />

        <div className="relative border-b border-white/[0.06] px-6 py-5 sm:px-8">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-medium text-cyan-300">
                  <Sparkles size={12} />
                  پیش‌نمایش یادداشت
                </span>

                <span className="inline-flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-[11px] text-slate-300">
                  <CalendarDays size={12} />
                  مشاهده کامل محتوا
                </span>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300 shadow-lg shadow-cyan-500/10">
                  <FileText size={22} strokeWidth={2.2} />
                </div>

                <div className="min-w-0">
                  <h2 className="line-clamp-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                    {title}
                  </h2>

                  <p className="mt-1 text-sm text-slate-400">
                    محتوای کامل یادداشت شما
                  </p>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={handleCopy}
                type="button"
                className={`flex h-11 w-11 items-center justify-center rounded-2xl border transition-all duration-300 active:scale-90 ${
                  copied
                    ? "border-green-400/30 bg-green-500/15 text-green-300"
                    : "border-white/[0.08] bg-white/[0.04] text-slate-300 hover:border-cyan-400/30 hover:bg-cyan-400/10 hover:text-cyan-200"
                }`}
                title="کپی متن"
              >
                {copied ? (
                  <Check size={19} strokeWidth={2.7} />
                ) : (
                  <Copy size={18} strokeWidth={2.4} />
                )}
              </button>

              <button
                onClick={() => setIsPreview(false)}
                type="button"
                aria-label="بستن مودال"
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04] text-slate-300 transition-all duration-300 hover:border-red-400/30 hover:bg-red-500/10 hover:text-red-300 active:scale-90"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>

        <div className="relative px-6 py-6 sm:px-8 sm:py-7">
          <div className="custom-scrollbar max-h-[65vh] overflow-y-auto rounded-3xl border border-white/[0.06] bg-black/[0.14] p-5 shadow-inner shadow-black/20 sm:p-7">
            <p className="whitespace-pre-wrap break-words text-[15px] leading-9 text-slate-200 sm:text-[17px]">
              {description}
            </p>
          </div>

          <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/[0.05] pt-5">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <div className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,.7)]" />

              <span>یادداشت با موفقیت بارگذاری شد</span>
            </div>

            <div className="text-xs text-slate-500">
              برای بستن، بیرون پنجره کلیک کنید
            </div>
          </div>
        </div>
      </div>

      <Toaster
        position="top-center"
        reverseOrder={false}
        gutter={10}
        toastOptions={{
          duration: 2400,
          style: {
            background: "rgba(15,23,42,.92)",
            color: "#f8fafc",
            border: "1px solid rgba(255,255,255,.08)",
            borderRadius: "18px",
            padding: "14px 18px",
            backdropFilter: "blur(14px)",
            boxShadow: "0 20px 60px rgba(0,0,0,.45)",
            fontSize: "13px",
            fontWeight: 500,
          },
          success: {
            iconTheme: {
              primary: "#22c55e",
              secondary: "#0f172a",
            },
            style: {
              border: "1px solid rgba(34,197,94,.18)",
            },
          },
          error: {
            iconTheme: {
              primary: "#ef4444",
              secondary: "#0f172a",
            },
            style: {
              border: "1px solid rgba(239,68,68,.18)",
            },
          },
        }}
      />
    </>
  );
}

export default NotePreviewCard;
