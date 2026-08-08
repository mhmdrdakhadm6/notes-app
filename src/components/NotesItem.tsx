import { Pencil, X, Calendar, RefreshCw, Pin } from "lucide-react";
import { useNotes } from "../hooks/useNotes";

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
}

const parseLocalDate = (dateValue: string) => {
  return new Date(`${dateValue}T00:00:00`);
};

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
}: NotesItemProps) {
  const {
    handelDelete,
    setIsEdit,
    setEditingNote,
    handleAddToNotesPerview,
  } = useNotes();

  const handleEditClick = (event: React.MouseEvent) => {
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
    });

    setIsEdit(true);
  };

  const handleDeleteClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    handelDelete(id);
  };

  const displayText =
    description.length > 40
      ? `${description.substring(0, 40)}...`
      : description;

  const weekdaysLabels: Record<number, string> = {
    6: "شنبه",
    0: "یکشنبه",
    1: "دوشنبه",
    2: "سه‌شنبه",
    3: "چهارشنبه",
    4: "پنجشنبه",
    5: "جمعه",
  };

  const getDisplayDateInfo = () => {
    if (isPermanent) {
      return "همیشه";
    }

    if (recurrence === "weekly" && dayOfWeek !== undefined) {
      return `هر هفته ${weekdaysLabels[dayOfWeek] || ""}`;
    }

    if (recurrence === "monthly" && dayOfMonth !== undefined) {
      return `${dayOfMonth}ام هر ماه ${''}`;
    }

    if (recurrence === "none" && customDate) {
      return parseLocalDate(customDate).toLocaleDateString("fa-IR", {
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

  const getRecurrenceText = () => {
    if (recurrence === "weekly") return "تکرار هفتگی";
    if (recurrence === "monthly") return "تکرار ماهانه";
    return "";
  };

  return (
    <li
      onClick={() => handleAddToNotesPerview(id)}
      className="w-full cursor-pointer rounded-2xl border border-zinc-800 bg-gradient-to-br from-indigo-950/30 to-zinc-900 p-5 shadow-lg shadow-indigo-500/5 transition-all duration-300 hover:border-indigo-500/30 hover:from-indigo-900/35 hover:to-zinc-800 hover:shadow-indigo-500/15"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="truncate text-lg font-semibold text-zinc-100">
            {title}
          </h3>

          <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
            <div className="flex items-center gap-1">
              <Calendar size={14} />
              <span>{getDisplayDateInfo()}</span>
            </div>

            {recurrence !== "none" && (
              <span className="flex items-center gap-1 rounded border border-indigo-500/20 bg-indigo-500/10 px-1.5 py-0.5 text-[10px] font-medium text-indigo-300">
                <RefreshCw size={10} />
                {getRecurrenceText()}
              </span>
            )}

            {isPermanent && (
              <span className="flex items-center gap-1 rounded border border-amber-400/20 bg-amber-400/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-200">
                <Pin size={10} />
                دائمی
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleEditClick}
            type="button"
            aria-label="Edit note"
            className="rounded-lg p-2 text-zinc-400 transition hover:bg-blue-500/10 hover:text-blue-400"
          >
            <Pencil size={18} />
          </button>

          <button
            onClick={handleDeleteClick}
            type="button"
            aria-label="Delete note"
            className="rounded-lg p-2 text-zinc-400 transition hover:bg-red-500/10 hover:text-red-400"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-indigo-500/15 bg-zinc-950/70 p-4 shadow-inner shadow-indigo-500/5">
        <p className="leading-7 text-zinc-300">{displayText}</p>
      </div>
    </li>
  );
}

export default NotesItem;
