import { Plus, X, Calendar, Settings2, RefreshCw } from "lucide-react";
import { useNotes } from "../hooks/useNotes";
import { useState } from "react";
import DatePicker, { DateObject } from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persianFa from "react-date-object/locales/persian_fa";
import type { NotesType } from "../types/nots";

const resolveComponent = (comp: any) => {
  let c = comp;
  while (c && typeof c === "object" && !c.$$typeof && c.default) {
    c = c.default;
  }
  return c;
};

const DatePickerComponent = resolveComponent(DatePicker);

const getLocalDateValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseLocalDate = (dateValue: string) => {
  const [year, month, day] = dateValue.split("-").map(Number);
  return new Date(year, month - 1, day);
};

export default function AddNoteModal() {
  const {
    isOpen,
    description,
    setDescription,
    setTitle,
    title,
    setIsOpen,
    setNotes,
  } = useNotes();

  const [recurrence, setRecurrence] = useState<NotesType["recurrence"]>("none");
  const [isPermanent, setIsPermanent] = useState(false);
  const [customDate, setCustomDate] = useState(getLocalDateValue(new Date()));
  const [dayOfWeek, setDayOfWeek] = useState(new Date().getDay());
  const [dayOfMonth, setDayOfMonth] = useState(new Date().getDate());

  if (!isOpen) return null;

  const handleClose = () => {
    setTitle("");
    setDescription("");
    setRecurrence("none");
    setIsPermanent(false);
    setCustomDate(getLocalDateValue(new Date()));
    setDayOfWeek(new Date().getDay());
    setDayOfMonth(new Date().getDate());
    setIsOpen(false);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim() || !description.trim()) return;

    const newNote = {
      title: title.trim(),
      description: description.trim(),
      id: crypto.randomUUID(),
      date: new Date(),
      recurrence: isPermanent ? "none" : recurrence,
      isPermanent,
      customDate:
        !isPermanent && recurrence === "none" ? customDate : undefined,
      dayOfWeek:
        !isPermanent && recurrence === "weekly" ? dayOfWeek : undefined,
      dayOfMonth:
        !isPermanent && recurrence === "monthly" ? dayOfMonth : undefined,
    };

    setNotes((prevNotes) => {
      const isAlreadyExists = prevNotes.some((note) => note.id === newNote.id);
      if (isAlreadyExists) {
        return prevNotes;
      }
      return [...prevNotes, newNote];
    });

    handleClose();
  };

  const weekdays = [
    { value: 6, label: "شنبه" },
    { value: 0, label: "یکشنبه" },
    { value: 1, label: "دوشنبه" },
    { value: 2, label: "سه‌شنبه" },
    { value: 3, label: "چهارشنبه" },
    { value: 4, label: "پنجشنبه" },
    { value: 5, label: "جمعه" },
  ];

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 px-4 py-6 backdrop-blur-md transition-all duration-300">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-note-title"
        className="flex max-h-[calc(100vh-3rem)] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#070b13]/90 shadow-[0_25px_70px_-10px_rgba(0,0,0,0.8)] backdrop-blur-xl animate-fadeInUp"
      >
        <header className="relative flex shrink-0 items-center justify-between border-b border-white/5 bg-gradient-to-b from-white/[0.04] to-transparent px-6 py-4.5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-400">
              <Plus size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h2
                id="add-note-title"
                className="text-lg font-bold tracking-tight text-white/95"
              >
                ایجاد یادداشت جدید
              </h2>
              <p className="text-[11px] text-slate-400">
                ایده‌ها و اهداف روزانه خود را ثبت کنید
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close modal"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.02] text-slate-400 transition-all duration-200 hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-400"
          >
            <X size={18} strokeWidth={2.2} />
          </button>
        </header>

        <form
          onSubmit={handleSubmit}
          className="custom-scrollbar min-h-0 flex-1 space-y-4.5 overflow-y-auto p-6"
        >
          <div className="space-y-1.5">
            <label
              htmlFor="note-title"
              className="text-xs font-semibold text-slate-300"
            >
              عنوان یادداشت
            </label>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              id="note-title"
              name="title"
              type="text"
              placeholder="یک عنوان جذاب انتخاب کنید..."
              autoFocus
              className="h-11 w-full rounded-xl border border-white/10 bg-[#04070d]/60 px-4 text-sm text-white outline-none placeholder:text-slate-500 transition-all duration-200 focus:border-cyan-500/40 focus:bg-[#04070d]/90 focus:ring-2 focus:ring-cyan-500/10"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="note-description"
              className="text-xs font-semibold text-slate-300"
            >
              توضیحات
            </label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              id="note-description"
              name="description"
              placeholder="جزییات، برنامه‌ها یا نکات مهم..."
              className="min-h-32 w-full resize-none rounded-xl border border-white/10 bg-[#04070d]/60 p-4 text-sm text-white outline-none placeholder:text-slate-500 transition-all duration-200 focus:border-cyan-500/40 focus:bg-[#04070d]/90 focus:ring-2 focus:ring-cyan-500/10"
            />
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-amber-500/10 bg-amber-500/[0.03] p-4 transition-all duration-200 hover:border-amber-500/25">
            <div className="absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b from-amber-400 to-transparent" />
            <label className="flex cursor-pointer items-center justify-between gap-4">
              <div className="min-w-0">
                <span className="block text-xs font-bold text-amber-300">
                  نگهداری همیشگی و ثابت
                </span>
                <span className="mt-0.5 block text-[10px] leading-5 text-slate-400">
                  این یادداشت فاقد تاریخ انقضا بوده و همیشه در لیست روزانه نمایش داده می‌شود.
                </span>
              </div>
              <input
                type="checkbox"
                checked={isPermanent}
                onChange={(event) => setIsPermanent(event.target.checked)}
                className="h-4.5 w-4.5 shrink-0 cursor-pointer rounded border-white/20 bg-transparent text-amber-500 focus:ring-0 focus:ring-offset-0"
              />
            </label>
          </div>

          {!isPermanent && (
            <div className="space-y-4 rounded-2xl border border-white/5 bg-white/[0.01] p-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                  <Settings2 size={13} className="text-slate-400" />
                  <span>برنامه‌ریزی و زمان‌بندی نمایش</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "none", label: "یکبار (خاص)" },
                    { value: "weekly", label: "هفتگی" },
                    { value: "monthly", label: "ماهانه" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        setRecurrence(option.value as NotesType["recurrence"])
                      }
                      className={`flex h-9 items-center justify-center rounded-xl border text-xs font-medium transition-all duration-200 active:scale-95 ${
                        recurrence === option.value
                          ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-300"
                          : "border-white/5 bg-[#04070d]/40 text-slate-400 hover:border-white/10 hover:text-slate-200"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {recurrence === "none" && (
                <div className="space-y-1.5 animate-fadeInUp">
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Calendar size={12} />
                    <span>انتخاب روز خاص</span>
                  </div>
                  <DatePickerComponent
                    value={
                      customDate
                        ? new DateObject({
                            date: parseLocalDate(customDate),
                            calendar: persian,
                            locale: persianFa,
                          })
                        : null
                    }
                    onChange={(value: DateObject | null) => {
                      if (!value) return;
                      setCustomDate(getLocalDateValue(value.toDate()));
                    }}
                    calendar={persian}
                    locale={persianFa}
                    format="YYYY/MM/DD"
                    calendarPosition="bottom-right"
                    inputClass="persian-date-input"
                    className="persian-dark-calendar"
                    containerClassName="w-full"
                  />
                </div>
              )}

              {recurrence === "weekly" && (
                <div className="space-y-1.5 animate-fadeInUp">
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <RefreshCw size={11} />
                    <span>روزهای نمایش در هفته</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {weekdays.map((day) => (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => setDayOfWeek(day.value)}
                        className={`h-8 min-w-[56px] flex-1 rounded-lg border text-[10px] font-medium transition-all duration-150 ${
                          dayOfWeek === day.value
                            ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300"
                            : "border-white/5 bg-[#04070d]/30 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {recurrence === "monthly" && (
                <div className="space-y-1.5 animate-fadeInUp">
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <RefreshCw size={11} />
                    <span>روز مشخص در ماه</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={2}
                      value={dayOfMonth}
                      onChange={(event) => {
                        const value = event.target.value;
                        if (
                          value === "" ||
                          (/^\d{1,2}$/.test(value) && Number(value) <= 31)
                        ) {
                          setDayOfMonth(Number(value));
                        }
                      }}
                      onBlur={() => {
                        const value = Number.parseInt(String(dayOfMonth), 10);
                        if (!value || value < 1) {
                          setDayOfMonth(1);
                          return;
                        }
                        if (value > 31) {
                          setDayOfMonth(31);
                        }
                      }}
                      className="h-10 w-20 rounded-xl border border-white/10 bg-[#04070d]/50 px-2 text-center text-sm font-semibold text-white outline-none focus:border-cyan-500/40"
                    />
                    <span className="text-[11px] text-slate-400">
                      ام هر ماه شمسی
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              disabled={!title.trim() || !description.trim()}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-6 text-xs font-semibold text-cyan-300 transition-all duration-200 hover:border-cyan-500/50 hover:bg-cyan-500/20 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-cyan-500/30 disabled:hover:bg-cyan-500/10"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>ثبت یادداشت</span>
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
