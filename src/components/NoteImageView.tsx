import { Expand, X } from "lucide-react";
import { useState, type MouseEvent } from "react";
import type { NoteImage } from "../types/nots";

interface NoteImageViewProps {
  image: NoteImage;
  compact?: boolean;
}

function NoteImageView({ image, compact = false }: NoteImageViewProps) {
  const [isOpen, setIsOpen] = useState(false);

  const openImage = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setIsOpen(true);
  };

  const closeImage = (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setIsOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={openImage}
        className="group/image relative block w-full overflow-hidden rounded-xl border border-white/10 bg-black/20"
        aria-label="نمایش کامل تصویر"
      >
        <img
          src={image.dataUrl}
          alt={image.name || "تصویر یادداشت"}
          className={`w-full object-cover transition duration-300 group-hover/image:scale-[1.02] ${
            compact ? "h-32" : "max-h-[420px]"
          }`}
        />
        <span className="absolute inset-0 flex items-center justify-center bg-slate-950/0 text-white opacity-0 transition group-hover/image:bg-slate-950/35 group-hover/image:opacity-100">
          <span className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-slate-950/70 px-3 py-2 text-xs backdrop-blur">
            <Expand size={14} />
            نمایش تصویر
          </span>
        </span>
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="نمایش تصویر یادداشت"
          onClick={closeImage}
          className="fixed inset-0 z-[80] flex cursor-zoom-out items-center justify-center bg-slate-950/95 p-4 backdrop-blur-xl animate-fadeIn"
        >
          <button
            type="button"
            onClick={closeImage}
            aria-label="بستن تصویر"
            className="absolute left-5 top-5 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white transition hover:bg-red-500/20 hover:text-red-200"
          >
            <X size={22} />
          </button>
          <img
            src={image.dataUrl}
            alt={image.name || "تصویر یادداشت"}
            onClick={(event) => event.stopPropagation()}
            className="max-h-[calc(100vh-2rem)] max-w-full cursor-default rounded-2xl object-contain shadow-2xl"
          />
        </div>
      )}
    </>
  );
}

export default NoteImageView;
