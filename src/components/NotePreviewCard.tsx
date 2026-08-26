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
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useNotes } from "../hooks/useNotes";
import type { NoteImage } from "../types/nots";
import NoteImageView from "./NoteImageView";

interface NotePreviewCardProps {
  title: string;
  description: string;
  image?: NoteImage;
}

function NotePreviewCard({
  title,
  description,
  image,
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
        className="relative flex max-h-[calc(100dvh-1.5rem)] flex-col overflow-hidden rounded-[24px] border border-[#093cc8]/20 bg-[#0a0a0a]  backdrop-blur-2xl sm:max-h-[calc(100dvh-3rem)] sm:rounded-[34px]"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(9,60,200,.12),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(9,60,200,.08),transparent_24%)]" />

        <div className="relative shrink-0 border-b border-[#093cc8]/10 px-4 py-4 sm:px-8 sm:py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full border border-[#093cc8]/20 bg-[#093cc8]/10 px-3 py-1 text-[11px] font-medium text-[#093cc8]">
                  <Sparkles size={12} />
                  پیش‌نمایش یادداشت
                </span>

                <span className="inline-flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-[11px] text-slate-300">
                  <CalendarDays size={12} />
                  مشاهده کامل محتوا
                </span>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#093cc8]/20 bg-[#093cc8]/10 text-[#093cc8] shadow-lg shadow-[#093cc8]/10">
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
                    ? "border-[#093cc8]/30 bg-[#093cc8]/15 text-[#093cc8]"
                    : "border-white/[0.08] bg-white/[0.04] text-slate-300 hover:border-[#093cc8]/30 hover:bg-[#093cc8]/10 hover:text-[#093cc8]"
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

        <div className="relative flex min-h-0 flex-1 flex-col px-4 py-4 sm:px-8 sm:py-7">
          <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto rounded-2xl border border-[#093cc8]/10 bg-black/60 p-4 shadow-inner shadow-black/20 sm:rounded-3xl sm:p-7">
            {image && (
              <div className="mb-5">
                <NoteImageView image={image} />
              </div>
            )}
            <div className="ai-markdown note-preview-markdown break-words text-[15px] leading-9 text-slate-200 sm:text-[17px]">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  table: ({ children }) => (
                    <div className="ai-markdown-table-wrapper">
                      <table>{children}</table>
                    </div>
                  ),
                }}
              >
                {description}
              </ReactMarkdown>
            </div>
          </div>

          <div className="mt-4 flex shrink-0 flex-col items-start justify-between gap-2 border-t border-[#093cc8]/10 pt-4 sm:mt-5 sm:flex-row sm:items-center sm:gap-3 sm:pt-5">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <div className="h-2 w-2 rounded-full bg-[#093cc8] shadow-[0_0_12px_rgba(9,60,200,.5)]" />

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
            background: "rgba(10,10,10,.95)",
            color: "#f8fafc",
            border: "1px solid rgba(9,60,200,.2)",
            borderRadius: "18px",
            padding: "14px 18px",
            backdropFilter: "blur(14px)",
            boxShadow: "0 20px 60px rgba(0,0,0,.45)",
            fontSize: "13px",
            fontWeight: 500,
          },
          success: {
            iconTheme: {
              primary: "#093cc8",
              secondary: "#0a0a0a",
            },
            style: {
              border: "1px solid rgba(9,60,200,.3)",
            },
          },
          error: {
            iconTheme: {
              primary: "#ef4444",
              secondary: "#0a0a0a",
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
