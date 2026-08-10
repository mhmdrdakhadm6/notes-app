import { Pencil, X, Calendar, Settings2, RefreshCw } from "lucide-react";
import { useState } from "react";
import DatePicker, { DateObject } from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persianFa from "react-date-object/locales/persian_fa";
import { useNotes } from "../hooks/useNotes";
import type { NoteImage, NotesType } from "../types/nots";
import NoteImagePicker from "./NoteImagePicker";

const resolveComponent = <T,>(component: T): T => {
  let resolved: unknown = component;

  while (
    resolved &&
    typeof resolved === "object" &&
    !("$$typeof" in resolved) &&
    "default" in resolved
  ) {
    resolved = resolved.default;
  }

  return resolved as T;
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

interface EditModalContentProps {
  editingNote: NotesType;
}

function EditModalContent({ editingNote }: EditModalContentProps) {
  const { setEditingNote, ToggleEdit, setIsEdit } = useNotes();

  const [newTitle, setNewTitle] = useState(editingNote.title);
  const [newDescription, setNewDescription] = useState(
    editingNote.description,
  );
  const [newRecurrence, setNewRecurrence] =
    useState<NotesType["recurrence"]>(editingNote.recurrence || "none");
  const [newIsPermanent, setNewIsPermanent] = useState(
    editingNote.isPermanent ?? false,
  );
  const [newCustomDate, setNewCustomDate] = useState(
    editingNote.customDate || getLocalDateValue(new Date()),
  );
  const [newDayOfWeek, setNewDayOfWeek] = useState(
    editingNote.dayOfWeek ?? new Date().getDay(),
  );
  const [newDayOfMonth, setNewDayOfMonth] = useState(
    editingNote.dayOfMonth ?? new Date().getDate(),
  );
  const [newImage, setNewImage] = useState<NoteImage | undefined>(
    editingNote.image,
  );

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const title = newTitle.trim();
    const description = newDescription.trim();

    if (!title || !description) return;

    ToggleEdit({
      ...editingNote,
      title,
      description,
      recurrence: newIsPermanent ? "none" : newRecurrence,
      isPermanent: newIsPermanent,
      customDate:
        !newIsPermanent && newRecurrence === "none"
          ? newCustomDate
          : undefined,
      dayOfWeek:
        !newIsPermanent && newRecurrence === "weekly"
          ? newDayOfWeek
          : undefined,
      dayOfMonth:
        !newIsPermanent && newRecurrence === "monthly"
          ? newDayOfMonth
          : undefined,
      image: newImage,
    });

    setEditingNote(null);
    setIsEdit(false);
  };

  const handleClose = () => {
    setEditingNote(null);
    setIsEdit(false);
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
        aria-labelledby="edit-note-title"
        className="flex max-h-[calc(100vh-3rem)] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#070b13]/90 shadow-[0_25px_70px_-10px_rgba(0,0,0,0.8)] backdrop-blur-xl animate-fadeInUp"
      >
        <header className="relative flex shrink-0 items-center justify-between border-b border-white/5 bg-gradient-to-b from-white/[0.04] to-transparent px-6 py-4.5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-400">
              <Pencil size={19} strokeWidth={2.4} />
            </div>

            <div>
              <h2
                id="edit-note-title"
                className="text-lg font-bold tracking-tight text-white/95"
              >
                ویرایش یادداشت
              </h2>

              <p className="text-[11px] text-slate-400">
                اطلاعات یادداشت خود را به‌روزرسانی کنید
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="بستن پنجره ویرایش"
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
              htmlFor="edit-note-title-input"
              className="text-xs font-semibold text-slate-300"
            >
              عنوان یادداشت
            </label>

            <input
              id="edit-note-title-input"
              name="title"
              type="text"
              value={newTitle}
              onChange={(event) => setNewTitle(event.target.value)}
              placeholder="یک عنوان جذاب انتخاب کنید..."
              autoFocus
              required
              className="h-11 w-full rounded-xl border border-white/10 bg-[#04070d]/60 px-4 text-sm text-white outline-none placeholder:text-slate-500 transition-all duration-200 focus:border-cyan-500/40 focus:bg-[#04070d]/90 focus:ring-2 focus:ring-cyan-500/10"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="edit-note-description"
              className="text-xs font-semibold text-slate-300"
            >
              توضیحات
            </label>

            <textarea
              id="edit-note-description"
              name="description"
              value={newDescription}
              onChange={(event) => setNewDescription(event.target.value)}
              placeholder="جزئیات، برنامه‌ها یا نکات مهم..."
              required
              className="min-h-32 w-full resize-none rounded-xl border border-white/10 bg-[#04070d]/60 p-4 text-sm text-white outline-none placeholder:text-slate-500 transition-all duration-200 focus:border-cyan-500/40 focus:bg-[#04070d]/90 focus:ring-2 focus:ring-cyan-500/10"
            />
          </div>

          <NoteImagePicker image={newImage} onChange={setNewImage} />

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
                checked={newIsPermanent}
                onChange={(event) => setNewIsPermanent(event.target.checked)}
                className="h-4.5 w-4.5 shrink-0 cursor-pointer rounded border-white/20 bg-transparent text-amber-500 focus:ring-0 focus:ring-offset-0"
              />
            </label>
          </div>

          {!newIsPermanent && (
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
                        setNewRecurrence(
                          option.value as NotesType["recurrence"]
                        )
                      }
                      className={`flex h-9 items-center justify-center rounded-xl border text-xs font-medium transition-all duration-200 active:scale-95 ${
                        newRecurrence === option.value
                          ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-300"
                          : "border-white/5 bg-[#04070d]/40 text-slate-400 hover:border-white/10 hover:text-slate-200"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {newRecurrence === "none" && (
                <div className="space-y-1.5 animate-fadeInUp">
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Calendar size={12} />
                    <span>انتخاب روز خاص</span>
                  </div>

                  <DatePickerComponent
                    value={
                      newCustomDate
                        ? new DateObject({
                            date: parseLocalDate(newCustomDate),
                            calendar: persian,
                            locale: persianFa,
                          })
                        : null
                    }
                    onChange={(value: DateObject | null) => {
                      if (!value) return;
                      setNewCustomDate(getLocalDateValue(value.toDate()));
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

              {newRecurrence === "weekly" && (
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
                        onClick={() => setNewDayOfWeek(day.value)}
                        className={`h-8 min-w-[56px] flex-1 rounded-lg border text-[10px] font-medium transition-all duration-150 ${
                          newDayOfWeek === day.value
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

              {newRecurrence === "monthly" && (
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
                      value={newDayOfMonth === 0 ? "" : newDayOfMonth}
                      onChange={(event) => {
                        const value = event.target.value;

                        if (value === "") {
                          setNewDayOfMonth(0);
                        } else if (
                          /^\d{1,2}$/.test(value) &&
                          Number(value) <= 31
                        ) {
                          setNewDayOfMonth(Number(value));
                        }
                      }}
                      onBlur={() => {
                        const value = Number.parseInt(
                          String(newDayOfMonth),
                          10
                        );

                        if (!value || value < 1) {
                          setNewDayOfMonth(1);
                          return;
                        }

                        if (value > 31) {
                          setNewDayOfMonth(31);
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
              disabled={!newTitle.trim() || !newDescription.trim()}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-6 text-xs font-semibold text-cyan-300 transition-all duration-200 hover:border-cyan-500/50 hover:bg-cyan-500/20 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-cyan-500/30 disabled:hover:bg-cyan-500/10"
            >
              <span>ذخیره تغییرات</span>
              <Pencil size={16} strokeWidth={2.5} />
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function EditModal() {
  const { EditingNote, isEdit } = useNotes();

  if (!EditingNote || !isEdit) return null;

  return <EditModalContent key={EditingNote.id} editingNote={EditingNote} />;
}

export default EditModal;
