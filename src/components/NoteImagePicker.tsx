import { Camera, Images, LoaderCircle, Trash2 } from "lucide-react";
import { useState, type ChangeEvent } from "react";
import type { NoteImage } from "../types/nots";
import { prepareNoteImage } from "../utils/noteImage";

interface NoteImagePickerProps {
  image?: NoteImage;
  onChange: (image?: NoteImage) => void;
}

function NoteImagePicker({ image, onChange }: NoteImagePickerProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  const handleSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    setError("");
    setIsProcessing(true);

    try {
      onChange(await prepareNoteImage(file));
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "خطا در پردازش تصویر.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-slate-300">تصویر یادداشت</p>
          <p className="mt-1 text-[10px] text-slate-500">
            تصویر پیش از ذخیره بهینه می‌شود.
          </p>
        </div>

        {isProcessing && (
          <span className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 text-[11px] font-semibold text-slate-500">
            <LoaderCircle size={14} className="animate-spin" />
            پردازش تصویر
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label
          className={`inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border px-3 text-[11px] font-semibold transition ${
            isProcessing
              ? "cursor-wait border-white/10 bg-white/[0.03] text-slate-500"
              : "cursor-pointer border-cyan-500/25 bg-cyan-500/10 text-cyan-300 hover:border-cyan-500/45 hover:bg-cyan-500/15"
          }`}
        >
          <Camera size={15} />
          <span>گرفتن عکس</span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            disabled={isProcessing}
            onChange={handleSelect}
            className="sr-only"
          />
        </label>

        <label
          className={`inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border px-3 text-[11px] font-semibold transition ${
            isProcessing
              ? "cursor-wait border-white/10 bg-white/[0.03] text-slate-500"
              : "cursor-pointer border-violet-500/25 bg-violet-500/10 text-violet-300 hover:border-violet-500/45 hover:bg-violet-500/15"
          }`}
        >
          <Images size={15} />
          <span>{image ? "انتخاب عکس دیگر" : "انتخاب از گالری"}</span>
          <input
            type="file"
            accept="image/*"
            disabled={isProcessing}
            onChange={handleSelect}
            className="sr-only"
          />
        </label>
      </div>

      {image && (
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/20 p-2">
          <img
            src={image.dataUrl}
            alt={image.name || "تصویر یادداشت"}
            className="h-40 w-full rounded-xl object-cover"
          />
          <button
            type="button"
            onClick={() => {
              setError("");
              onChange(undefined);
            }}
            aria-label="حذف تصویر"
            className="absolute left-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-400/30 bg-slate-950/80 text-red-300 backdrop-blur transition hover:bg-red-500/20"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}

      {error && <p className="text-[11px] text-red-300">{error}</p>}
    </div>
  );
}

export default NoteImagePicker;
