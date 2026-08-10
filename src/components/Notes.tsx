import {
  Plus,
  Search,
  SlidersHorizontal,
  CalendarDays,
  Layers,
  Sparkles,
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
import { toLocalDateOnly } from "../utils/date";
import ChatApp from "./ChatApp.jsx";

const isExpiredNote = (note: NotesType, today: Date) => {
  if (note.isPermanent || note.recurrence !== "none" || !note.customDate) {
    return false;
  }

  const selectedDate = toLocalDateOnly(note.customDate);

  if (!selectedDate) {
    return false;
  }

  selectedDate.setHours(0, 0, 0, 0);
  return selectedDate < today;
};

export default function Notes() {
  const { setIsOpen, notes, setNotes } = useNotes();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"today" | "all" | "ai">("today");

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
      if (hasQuery) {
        const title = (note.title || "").toLocaleLowerCase();
        const description = (note.description || "").toLocaleLowerCase();

        const matchesSearch =
          title.includes(normalizedQuery) ||
          description.includes(normalizedQuery);

        if (!matchesSearch) return false;
      }

      if (note.isPermanent) return true;

      let selectedDate = null as Date | null;
      if (isExpiredNote(note, today)) {
        return false;
      }

      if (note.recurrence === "none" && note.customDate) {
        selectedDate = toLocalDateOnly(note.customDate);
        if (!selectedDate) {
          return true;
        }
        selectedDate.setHours(0, 0, 0, 0);
      }

      if (filterMode === "all" || filterMode === "ai") return true;

      if (note.recurrence === "weekly") {
        return note.dayOfWeek === today.getDay();
      }

      if (note.recurrence === "monthly") {
        return note.dayOfMonth === today.getDate();
      }

      if (note.recurrence === "none" && note.customDate) {
        const d = selectedDate ?? toLocalDateOnly(note.customDate);
        if (!d) {
          return true;
        }

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
    <section
      dir="rtl"
      className="mx-auto w-full max-w-6xl overflow-hidden rounded-[32px] border border-[#093cc8]/20 bg-[#0a0a0a] text-white "
    >
      <div className="border-b border-[#093cc8]/20 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a] to-[#050b1d] px-8 py-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-1">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#093cc8]">پنل اختصاصی</p>
            <h2 className="text-3xl font-black tracking-tight text-white">
              مدیریت نوت‌ها
            </h2>
          </div>

          <label className="flex h-14 w-full max-w-xl items-center rounded-2xl border border-[#093cc8]/30 bg-black/60 px-4 shadow-lg focus-within:border-[#093cc8] lg:min-w-[500px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="جستجو در نوت‌ها..."
              className="h-full w-full bg-transparent px-2 text-[15px] text-white outline-none placeholder:text-slate-600"
            />
            <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#093cc8] text-white transition hover:bg-[#0730a0]">
              <Search size={18} />
            </button>
          </label>
        </div>
      </div>

      <div className="border-b border-[#093cc8]/20 bg-black/40 px-8 py-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-3">
            <button
              onClick={() => setIsOpen(true)}
              type="button"
              className="flex h-12 items-center gap-2 rounded-2xl bg-[#093cc8] px-6 text-[15px] font-bold text-white transition hover:bg-[#0730a0] hover:shadow-lg hover:shadow-[#093cc8]/20"
            >
              <Plus size={18} />
              <span>افزودن نوت</span>
            </button>

            <div className="flex h-12 items-center gap-2 rounded-2xl border border-[#093cc8]/20 bg-black/60 px-5 text-[15px] font-semibold text-slate-300">
              <SlidersHorizontal size={18} />
              <span>فیلتر</span>
            </div>
          </div>

          <div className="flex gap-1 rounded-2xl border border-[#093cc8]/20 bg-black/60 p-1.5">
            {[
              { id: "today", label: "امروز", icon: CalendarDays },
              { id: "all", label: "همه", icon: Layers },
              { id: "ai", label: "AI", icon: Sparkles },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setFilterMode(item.id as any)}
                className={`flex h-10 items-center gap-2 rounded-xl px-5 text-sm font-semibold transition ${
                  filterMode === item.id
                    ? "bg-[#093cc8] text-white shadow-lg shadow-[#093cc8]/20"
                    : "text-slate-500 hover:text-white"
                }`}
              >
                <item.icon size={16} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {filterMode === "ai" ? (
        <ChatApp />
      ) : (
        <>
          <div className="flex items-center justify-between bg-black/20 px-8 py-4">
            <span className="rounded-full bg-[#093cc8]/10 px-4 py-1 text-[11px] font-bold text-[#093cc8]">
              {notes.length} مجموع
            </span>
            <span className="text-[12px] font-medium text-slate-500">
              {filteredNotes.length} مورد فعال
            </span>
          </div>

          {notes.length === 0 ? (
            <Empty />
          ) : (
            <NotesMap
              notes={filteredNotes}
              searchQuery={searchQuery}
              totalNotes={notes.length}
              filterMode={filterMode}
            />
          )}
        </>
      )}

      <AddNoteModal />
      <EditModal />
      <NotePreview />
      {filterMode !== "ai" && <Footer />}
    </section>
  );
}