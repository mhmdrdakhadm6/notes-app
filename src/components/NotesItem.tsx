import {
  Pencil,
  X,
  Calendar,
  RefreshCw,
  Pin,
  ChevronLeft,
  CircleDollarSign,
} from "lucide-react";
import type { MouseEvent } from "react";
import { useNotes } from "../hooks/useNotes";
import { toLocalDateOnly } from "../utils/date";
import type { NoteImage } from "../types/nots";
import NoteImageView from "./NoteImageView";

interface NotesItemProps {
  title: string;
  description: string;
  id: string;
  date: Date | string;
  recurrence?: "none" | "weekly" | "monthly";
  isPermanent?: boolean;
  customDate?: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
  image?: NoteImage;
  index?: number;
}

function NotesItem({
  title,
  description,
  id,
  date,
  recurrence = "none",
  isPermanent = false,
  customDate,
  dayOfWeek,
  dayOfMonth,
  image,
  index = 0,
}: NotesItemProps) {
  const {
    handelDelete,
    setIsEdit,
    setEditingNote,
    handleAddToNotesPerview,
  } = useNotes();

  const handleEditClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    setEditingNote({
      id,
      title,
      description,
      date: new Date(date),
      recurrence,
      isPermanent,
      customDate,
      dayOfWeek,
      dayOfMonth,
      image,
    });

    setIsEdit(true);
  };

  const handleDeleteClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    handelDelete(id);
  };

  const displayText =
    description.length > 80
      ? `${description.substring(0, 80)}...`
      : description;

  const weekdaysLabels: Record<number, string> = {
    6: "شنبه",
    0: "یک‌شنبه",
    1: "دوشنبه",
    2: "سه‌شنبه",
    3: "چهارشنبه",
    4: "پنجشنبه",
    5: "جمعه",
  };

  const getDisplayDateInfo = (): string => {
    if (isPermanent) return "همیشه نمایش داده می‌شود";

    if (recurrence === "weekly" && dayOfWeek !== undefined) {
      return `هفتگی · ${weekdaysLabels[dayOfWeek] || ""}`;
    }

    if (recurrence === "monthly" && dayOfMonth !== undefined) {
      return `ماهانه · روز ${dayOfMonth}`;
    }

    if (recurrence === "none" && customDate) {
      const displayDate = toLocalDateOnly(customDate);

      if (!displayDate) {
        return new Date(date).toLocaleDateString("fa-IR", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      }

      return displayDate.toLocaleDateString("fa-IR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }

    return new Date(date).toLocaleDateString("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getRecurrenceText = (): string => {
    if (recurrence === "weekly") return "هفتگی";
    if (recurrence === "monthly") return "ماهانه";
    return "";
  };

  const getAccent = (): string => {
    if (isPermanent) {
      return "from-amber-500/12 via-amber-500/4 to-transparent";
    }

    if (recurrence === "weekly") {
      return "from-violet-500/12 via-violet-500/4 to-transparent";
    }

    if (recurrence === "monthly") {
      return "from-rose-500/12 via-rose-500/4 to-transparent";
    }

    return "from-cyan-500/12 via-cyan-500/4 to-transparent";
  };

  const getAccentLine = (): string => {
    if (isPermanent) return "from-amber-400";
    if (recurrence === "weekly") return "from-violet-400";
    if (recurrence === "monthly") return "from-rose-400";
    return "from-cyan-400";
  };

  return (
    <li
      onClick={() => handleAddToNotesPerview(id)}
      style={{ animationDelay: `${index * 50}ms` }}
      className="group relative w-full cursor-pointer overflow-hidden rounded-xl border border-white/10 bg-[#0a101d]/80 p-3.5 shadow-md backdrop-blur-md transition-all duration-300 [animation-fill-mode:forwards] animate-fadeInUp hover:-translate-y-0.5 hover:border-white/20 hover:shadow-lg"
    >
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300 ${getAccent()} group-hover:opacity-100`}
      />

      <div
        className={`pointer-events-none absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b ${getAccentLine()} to-transparent`}
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-2">
            <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-200">
              <CircleDollarSign size={14} strokeWidth={2} />
            </span>

            <span className="inline-flex items-center rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-slate-300">
              {isPermanent ? "ثابت" : "زمان‌دار"}
            </span>
          </div>

          <h3 className="truncate text-base font-semibold tracking-tight text-white/95">
            {title}
          </h3>

          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px]">
            <span className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 text-slate-300">
              <Calendar size={11} className="text-slate-400" />
              <span>{getDisplayDateInfo()}</span>
            </span>

            {recurrence !== "none" && (
              <span className="inline-flex items-center gap-1 rounded-md border border-violet-400/20 bg-violet-500/10 px-2 py-0.5 font-medium text-violet-300">
                <RefreshCw size={10} />
                {getRecurrenceText()}
              </span>
            )}

            {isPermanent && (
              <span className="inline-flex items-center gap-1 rounded-md border border-amber-400/20 bg-amber-500/10 px-2 py-0.5 font-medium text-amber-300">
                <Pin size={10} />
                همیشه
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1 opacity-100 transition-opacity duration-200 sm:opacity-0 sm:group-hover:opacity-100">
          <button
            onClick={handleEditClick}
            type="button"
            aria-label="ویرایش یادداشت"
            className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 p-1.5 text-slate-300 transition hover:border-cyan-400/40 hover:bg-cyan-400/20 hover:text-cyan-200"
          >
            <Pencil size={14} strokeWidth={2} />
          </button>

          <button
            onClick={handleDeleteClick}
            type="button"
            aria-label="حذف یادداشت"
            className="rounded-lg border border-red-400/20 bg-red-400/10 p-1.5 text-slate-300 transition hover:border-red-400/40 hover:bg-red-400/20 hover:text-red-200"
          >
            <X size={14} strokeWidth={2} />
          </button>
        </div>
      </div>

      {description && (
        <div className="relative mt-2.5 rounded-lg border border-white/5 bg-white/[0.02] p-2.5">
          <p className="text-xs leading-5 text-slate-300">{displayText}</p>
        </div>
      )}

      {image && (
        <div className="relative mt-2.5">
          <NoteImageView image={image} compact />
        </div>
      )}

      <div className="mt-2 flex items-center justify-end gap-1 text-[10px] font-medium text-slate-400 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <span>نمایش جزئیات</span>
        <ChevronLeft size={11} strokeWidth={2} />
      </div>
    </li>
  );
}

export default NotesItem;
