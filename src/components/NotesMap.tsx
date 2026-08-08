import { ListTodo } from "lucide-react";
import type { NotesType } from "../types/nots";
import NotesItem from "./NotesItem";

interface NotesMapProps {
  notes: NotesType[];
  searchQuery: string;
  totalNotes: number;
  filterMode: "today" | "all";
}

function NotesMap({
  notes,
  searchQuery,
  totalNotes,
  filterMode,
}: NotesMapProps) {
  if (notes.length === 0) {
    const hasQuery = searchQuery.trim().length > 0;
    const emptyTitle = hasQuery
      ? `نتیجه‌ای برای "${searchQuery}" یافت نشد`
      : filterMode === "today"
        ? "برای امروز یادداشت فعالی ندارید"
        : "هنوز نوتی ثبت نشده";

    const emptyMessage = hasQuery
      ? "عبارت جستجو را تغییر دهید یا فیلتر را بررسی کنید."
      : filterMode === "today" && totalNotes > 0
        ? "برای امروز نوتی با زمان نمایش امروز وجود ندارد."
        : "برای شروع یک نوت جدید بسازید و برنامه‌ریزی‌تون رو ثبت کنید";

    return (
      <div className="flex min-h-[360px] flex-col items-center justify-center px-6 py-8 text-center">
        <div className="rounded-3xl border border-dashed border-white/15 bg-white/[0.03] px-10 py-12 backdrop-blur">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-cyan-300/25 bg-cyan-300/10">
            <ListTodo
              size={26}
              className="text-cyan-200"
              strokeWidth={1.8}
            />
          </div>
          <p className="text-lg text-slate-300">
            {emptyTitle}
          </p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
            {emptyMessage}
          </p>
        </div>
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-4 px-6 py-6 sm:px-8 md:grid-cols-2 xl:grid-cols-3">
      {notes.map((note, idx) => (
        <NotesItem key={note.id} {...note} index={idx} />
      ))}
    </ul>
  );
}

export default NotesMap;
