import { useState } from "react";
import { X, Copy, Check } from "lucide-react";
import { useNotes } from "../hooks/useNotes";
import toast, { Toaster } from "react-hot-toast";

interface NotePreviewCardProps {
  title: string;
  description: string;
}

export default function NotePreviewCard({
  title,
  description,
}: NotePreviewCardProps) {
  const { setIsPreview } = useNotes();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(description);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("copied", {
        duration: 1500,
        position: "top-center",
      });
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <div
      className="relative w-full rounded-[32px] border-2 border-blue-500/20 bg-zinc-900 p-6 shadow-2xl shadow-blue-500/10 transition-all duration-300 text-right"
      dir="rtl"
    >
      {/* دکمه‌های کنترل بالا */}
      <div className="absolute left-5 top-5 flex items-center gap-2">
        {/* دکمه کپی توضیحات */}
        <button
          onClick={handleCopy}
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-zinc-700 bg-zinc-800 text-zinc-300 transition hover:bg-zinc-700 hover:text-white"
          title="کپی کردن متن"
        >
          {copied ? (
            <Check size={18} className="text-green-400" strokeWidth={2.5} />
          ) : (
            <Copy size={18} strokeWidth={2.5} />
          )}
        </button>

        {/* دکمه بستن */}
        <button
          onClick={() => setIsPreview(false)}
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-zinc-700 bg-zinc-800 text-zinc-300 transition hover:bg-red-600 hover:text-white"
          aria-label="Close modal"
        >
          <X size={20} strokeWidth={2.5} />
        </button>
      </div>

      <div className="mb-6 flex items-center justify-start gap-3 pt-12">
        <h2 className="text-2xl font-semibold text-zinc-100 sm:text-3xl">
          {title}
        </h2>
      </div>

      <div className="min-h-[250px] rounded-[22px] border-2 border-zinc-800 bg-zinc-950 p-5 sm:p-6">
        <p className="text-right text-lg leading-8 text-zinc-300 sm:text-xl whitespace-pre-wrap">
          {description}
        </p>
      </div>
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={12}
        toastOptions={{
          duration: 2500,
          style: {
            background: "#18181b",
            color: "#f4f4f5",
            border: "1px solid #27272a",
            borderRadius: "16px",
            padding: "16px",
            boxShadow: "0 20px 50px rgba(0,0,0,.45)",
          },
          success: {
            iconTheme: {
              primary: "#22c55e",
              secondary: "#18181b",
            },
            style: {
              background: "#18181b",
              color: "#f4f4f5",
              border: "1px solid rgba(34,197,94,.25)",
            },
          },
          error: {
            iconTheme: {
              primary: "#ef4444",
              secondary: "#18181b",
            },
            style: {
              background: "#18181b",
              color: "#f4f4f5",
              border: "1px solid rgba(239,68,68,.25)",
            },
          },
          loading: {
            iconTheme: {
              primary: "#3b82f6",
              secondary: "#18181b",
            },
          },
        }}
      />
    </div>
  );
}
