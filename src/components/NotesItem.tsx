import {
  Pencil,
  X,
  Calendar,
  RefreshCw,
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
    setIsEdit,
    setEditingNote,
    handleAddToNotesPerview,
    setDeletingNoteId,
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
    setDeletingNoteId(id);
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

  return (
    <li
      onClick={() => handleAddToNotesPerview(id)}
      style={{ animationDelay: `${index * 50}ms` }}
      className="group relative w-full cursor-pointer overflow-hidden rounded-2xl border border-[#093cc8]/10 bg-[#0a0a0a] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.5)] transition-all duration-300 animate-fadeInUp hover:-translate-y-1 hover:border-[#093cc8]/40 hover:shadow-[0_0_40px_rgba(9,60,200,0.15)]"
    >
      <div className="absolute inset-y-0 right-0 w-1.5 bg-[#093cc8] shadow-[0_0_20px_rgba(9,60,200,0.3)]" />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#093cc8]/10 text-[#093cc8]">
              <CircleDollarSign size={16} strokeWidth={2.5} />
            </span>

            <span className="rounded-lg border border-[#093cc8]/20 bg-[#093cc8]/5 px-2.5 py-1 text-[10px] font-bold text-[#093cc8]">
              {isPermanent ? "ثابت" : "زمان‌دار"}
            </span>
          </div>

          <h3 className="truncate text-[16px] font-black tracking-tight text-white">
            {title}
          </h3>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] font-semibold text-slate-400">
            <span className="flex items-center gap-1.5 rounded-lg border border-white/[0.05] bg-black/30 px-2.5 py-1">
              <Calendar size={11} className="text-[#093cc8]" />
              <span>{getDisplayDateInfo()}</span>
            </span>

            {recurrence !== "none" && (
              <span className="flex items-center gap-1.5 rounded-lg border border-[#093cc8]/20 bg-[#093cc8]/5 px-2.5 py-1 text-[#093cc8]">
                <RefreshCw size={11} />
                {getRecurrenceText()}
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 opacity-40 transition-opacity group-hover:opacity-100">
          <button
            onClick={handleEditClick}
            type="button"
            className="rounded-xl border border-white/[0.08] bg-black/40 p-2 text-white transition hover:bg-[#093cc8] hover:text-white hover:shadow-lg hover:shadow-[#093cc8]/20"
          >
            <Pencil size={15} />
          </button>

          <button
            onClick={handleDeleteClick}
            type="button"
            className="rounded-xl border border-white/[0.08] bg-black/40 p-2 text-white transition hover:bg-red-600 hover:text-white hover:shadow-lg hover:shadow-red-600/20"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {description && (
        <div className="relative mt-4 rounded-xl border border-white/[0.05] bg-black/20 p-3.5">
          <p className="text-[12px] leading-6 text-slate-300">{displayText}</p>
        </div>
      )}

      {image && (
        <div className="relative mt-4 w-fit">
          <NoteImageView image={image} compact />
        </div>
      )}

      <div className="mt-4 flex items-center justify-end gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#093cc8] opacity-0 transition-all group-hover:opacity-100">
        <span>جزئیات</span>
        <ChevronLeft size={12} strokeWidth={3} />
      </div>
    </li>
  );
}

export default NotesItem;
