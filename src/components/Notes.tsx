import {
  Plus,
  Search,
  SlidersHorizontal,
  CalendarDays,
  Layers,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import AddNoteModal from "./AddNoteModal";
import Empty from "./Empty";
import { useNotes } from "../hooks/useNotes";
import NotesMap from "./NotesMap";
import Footer from "./Footer";
import EditModal from "./EditModal";
import NotePreview from "./NotePreview";
import type { NotesType } from "../types/nots";

const parseLocalDate = (dateValue: string) => {
  return new Date(`${dateValue}T00:00:00`);
};

const isExpiredNote = (note: NotesType, today: Date) => {
  if (note.isPermanent || note.recurrence !== "none" || !note.customDate) {
    return false;
  }

  const selectedDate = parseLocalDate(note.customDate);

  if (Number.isNaN(selectedDate.getTime())) {
    return false;
  }

  selectedDate.setHours(0, 0, 0, 0);
  return selectedDate < today;
};

export default function Notes() {
  const { setIsOpen, notes, setNotes } = useNotes();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"today" | "all">("today");

  const normalizedQuery = searchQuery.trim().toLocaleLowerCase();

  useEffect(() => {
    const removeExpiredNotes = () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      setNotes((currentNotes) => {
        const activeNotes = currentNotes.filter(
          (note) => !isExpiredNote(note, today),
        );

        return activeNotes.length === currentNotes.length
          ? currentNotes
          : activeNotes;
      });
    };

    const initialCleanupTimer = window.setTimeout(removeExpiredNotes, 0);
    let midnightCleanupTimer: number;

    const scheduleMidnightCleanup = () => {
      const now = new Date();
      const nextMidnight = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
      );

      midnightCleanupTimer = window.setTimeout(() => {
        removeExpiredNotes();
        scheduleMidnightCleanup();
      }, nextMidnight.getTime() - now.getTime());
    };

    scheduleMidnightCleanup();

    return () => {
      window.clearTimeout(initialCleanupTimer);
      window.clearTimeout(midnightCleanupTimer);
    };
  }, [notes, setNotes]);

  const filteredNotes = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const hasQuery = normalizedQuery && normalizedQuery.trim().length > 0;

    return notes.filter((note) => {
      // 1) Search filter (فقط اگر کوئری داریم)
      if (hasQuery) {
        const title = (note.title || "").toLocaleLowerCase();
        const description = (note.description || "").toLocaleLowerCase();

        const matchesSearch =
          title.includes(normalizedQuery) ||
          description.includes(normalizedQuery);

        if (!matchesSearch) return false;
      }

      if (note.isPermanent) return true;

      // 2) Rule: نوت منقضی تا زمان پاک‌سازی از رابط هم پنهان بماند
      let selectedDate = null;
      if (isExpiredNote(note, today)) {
        return false;
      }

      if (note.recurrence === "none" && note.customDate) {
        selectedDate = parseLocalDate(note.customDate);
        selectedDate.setHours(0, 0, 0, 0);
      }

      // 3) Mode filter
      if (filterMode === "all") return true;

      if (note.recurrence === "weekly") {
        return note.dayOfWeek === today.getDay();
      }

      if (note.recurrence === "monthly") {
        return note.dayOfMonth === today.getDate();
      }

      if (note.recurrence === "none" && note.customDate) {
        // reuse selectedDate اگر قبلاً ساختیم
        const d = selectedDate ?? parseLocalDate(note.customDate);

        return (
          d.getFullYear() === today.getFullYear() &&
          d.getMonth() === today.getMonth() &&
          d.getDate() === today.getDate()
        );
      }

      return true;
    });
  }, [notes, normalizedQuery, filterMode]);

  return (
    <section className="mx-auto w-full max-w-6xl rounded-[36px] border border-white/10 bg-[#0b0f19] text-white shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
      <div className="rounded-t-[36px] border-b border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] px-6 py-5 sm:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center">
            <h2 className="text-2xl font-semibold tracking-[0.24em] text-white/92">
              NOTES
            </h2>
          </div>

          <label className="group flex h-14 w-full max-w-xl items-center rounded-2xl border border-white/12 bg-[#111827] px-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-colors focus-within:border-cyan-400/50 focus-within:bg-[#131c2c] lg:min-w-[540px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="جستجو..."
              className="h-full w-full bg-transparent text-lg text-white outline-none placeholder:text-slate-400"
            />

            <button
              type="button"
              className="ml-3 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-cyan-400/10 hover:text-cyan-300"
              aria-label="Search notes"
            >
              <Search size={20} strokeWidth={2.2} />
            </button>
          </label>
        </div>
      </div>

      <div className="border-b border-white/10 px-6 py-4 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-3">
            <button
              onClick={() => setIsOpen(true)}
              type="button"
              className="inline-flex h-12 items-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-5 text-lg font-medium text-cyan-200 transition hover:border-cyan-300/40 hover:bg-cyan-400/15"
            >
              <Plus size={18} strokeWidth={2.2} />
              <span>نوت</span>
            </button>

            <button
              type="button"
              className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 text-lg font-medium text-slate-200 transition hover:bg-white/[0.08]"
            >
              <SlidersHorizontal size={18} strokeWidth={2.2} />
              <span>فیلتر</span>
            </button>
          </div>

          <div className="flex rounded-xl border border-white/5 bg-zinc-950/60 p-1">
            <button
              onClick={() => setFilterMode("today")}
              className={`inline-flex h-10 items-center gap-1.5 rounded-lg px-4 text-sm font-medium transition ${
                filterMode === "today"
                  ? "border border-cyan-400/20 bg-cyan-400/10 text-cyan-300"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <CalendarDays size={16} />
              <span>یادداشت‌های امروز</span>
            </button>

            <button
              onClick={() => setFilterMode("all")}
              className={`inline-flex h-10 items-center gap-1.5 rounded-lg px-4 text-sm font-medium transition ${
                filterMode === "all"
                  ? "border border-cyan-400/20 bg-cyan-400/10 text-cyan-300"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Layers size={16} />
              <span>همه یادداشت‌ها</span>
            </button>
          </div>
        </div>
      </div>

      {notes.length === 0 ? (
        <Empty />
      ) : (
        <NotesMap notes={filteredNotes} searchQuery={searchQuery} />
      )}

      <AddNoteModal />
      <EditModal />
      <NotePreview />
      <Footer />
    </section>
  );
}
