import { Pencil, X } from "lucide-react";
import { useEffect, useState } from "react";
import DatePicker, { DateObject } from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persianFa from "react-date-object/locales/persian_fa";
import { useNotes } from "../hooks/useNotes";
import type { NotesType } from "../types/nots";

// تابع استخراج کامپوننت واقعی از آبجکت‌های ماژول Vite/CJS
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

function EditModal() {
  const { EditingNote, setEditingNote, ToggleEdit, isEdit, setIsEdit } =
    useNotes();

  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newRecurrence, setNewRecurrence] =
    useState<NotesType["recurrence"]>("none");
  const [newCustomDate, setNewCustomDate] = useState("");
  const [newDayOfWeek, setNewDayOfWeek] = useState(0);
  const [newDayOfMonth, setNewDayOfMonth] = useState(1);

  useEffect(() => {
    if (!EditingNote || !isEdit) return;

    setNewTitle(EditingNote.title);
    setNewDescription(EditingNote.description);
    setNewRecurrence(EditingNote.recurrence || "none");
    setNewCustomDate(EditingNote.customDate || getLocalDateValue(new Date()));
    setNewDayOfWeek(EditingNote.dayOfWeek ?? new Date().getDay());
    setNewDayOfMonth(EditingNote.dayOfMonth ?? new Date().getDate());
  }, [EditingNote, isEdit]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!EditingNote) return;

    const title = newTitle.trim();
    const description = newDescription.trim();

    if (!title || !description) return;

    ToggleEdit({
      ...EditingNote,
      title,
      description,
      recurrence: newRecurrence,
      customDate: newRecurrence === "none" ? newCustomDate : undefined,
      dayOfWeek: newRecurrence === "weekly" ? newDayOfWeek : undefined,
      dayOfMonth: newRecurrence === "monthly" ? newDayOfMonth : undefined,
    });

    setEditingNote(null);
    setIsEdit(false);
  };

  const handleClose = () => {
    setEditingNote(null);
    setIsEdit(false);
  };

  if (!EditingNote || !isEdit) return null;

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
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-4 py-6 backdrop-blur-sm">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-note-title"
        className="flex max-h-[calc(100vh-3rem)] w-full max-w-2xl flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#0c111b] shadow-[0_30px_100px_rgba(0,0,0,0.7)]"
      >
        <header className="flex shrink-0 items-center justify-between border-b border-white/10 bg-white/[0.025] px-6 py-5">
          <div>
            <h2
              id="edit-note-title"
              className="text-xl font-semibold tracking-tight text-white"
            >
              ویرایش نوت
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              اطلاعات یادداشت خود را به‌روزرسانی کنید.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Close edit modal"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 transition hover:bg-red-500/15 hover:text-red-300"
          >
            <X size={21} strokeWidth={2.4} />
          </button>
        </header>

        <form
          onSubmit={handleSubmit}
          className="custom-scrollbar min-h-0 flex-1 space-y-5 overflow-y-auto p-6"
        >
          <div>
            <label
              htmlFor="edit-note-title-input"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              عنوان
            </label>

            <input
              id="edit-note-title-input"
              name="title"
              type="text"
              value={newTitle}
              onChange={(event) => setNewTitle(event.target.value)}
              placeholder="عنوان..."
              autoFocus
              required
              className="h-12 w-full rounded-xl border border-white/10 bg-[#080c14] px-4 text-base text-white outline-none placeholder:text-slate-500 transition focus:border-cyan-400/60 focus:ring-4 focus:ring-cyan-400/10"
            />
          </div>

          <div>
            <label
              htmlFor="edit-note-description"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              توضیحات
            </label>

            <textarea
              id="edit-note-description"
              name="description"
              value={newDescription}
              onChange={(event) => setNewDescription(event.target.value)}
              placeholder="توضیحات..."
              required
              className="min-h-40 w-full resize-none rounded-xl border border-white/10 bg-[#080c14] p-4 text-base text-white outline-none placeholder:text-slate-500 transition focus:border-cyan-400/60 focus:ring-4 focus:ring-cyan-400/10"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              نوع تکرار یادداشت
            </label>

            <div className="grid grid-cols-3 gap-3">
              {[
                { value: "none", label: "یکبار (روز خاص)" },
                { value: "weekly", label: "تکرار هفتگی" },
                { value: "monthly", label: "تکرار ماهانه" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    setNewRecurrence(option.value as NotesType["recurrence"])
                  }
                  className={`flex h-12 items-center justify-center rounded-xl border text-sm font-medium transition active:scale-95 ${
                    newRecurrence === option.value
                      ? "border-cyan-400 bg-cyan-400/10 text-cyan-200"
                      : "border-white/10 bg-[#080c14] text-slate-400 hover:border-white/20 hover:text-white"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {newRecurrence === "none" && (
            <div className="transition-all duration-300">
              <label className="mb-2 block text-sm font-medium text-slate-300">
                تاریخ نمایش یادداشت
              </label>

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
            <div className="transition-all duration-300">
              <label className="mb-2 block text-sm font-medium text-slate-300">
                چه روزی در هفته نمایش داده شود؟
              </label>

              <div className="flex flex-wrap gap-2">
                {weekdays.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => setNewDayOfWeek(day.value)}
                    className={`h-10 min-w-[70px] flex-1 rounded-lg border text-xs font-medium transition ${
                      newDayOfWeek === day.value
                        ? "border-cyan-400 bg-cyan-400/10 text-cyan-200"
                        : "border-white/5 bg-[#080c14] text-slate-400 hover:text-white"
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {newRecurrence === "monthly" && (
            <div className="transition-all duration-300">
              <label className="mb-2 block text-sm font-medium text-slate-300">
                چه روزی در ماه نمایش داده شود؟
              </label>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
                    } else if (/^\d{1,2}$/.test(value) && Number(value) <= 31) {
                      setNewDayOfMonth(Number(value));
                    }
                  }}
                  onBlur={() => {
                    const value = Number.parseInt(String(newDayOfMonth), 10);

                    if (!value || value < 1) {
                      setNewDayOfMonth(1);
                      return;
                    }

                    if (value > 31) {
                      setNewDayOfMonth(31);
                    }
                  }}
                  className="h-12 w-full rounded-xl border border-white/10 bg-[#080c14] px-4 text-center text-base text-white outline-none focus:border-cyan-400/60 sm:w-24"
                />

                <span className="text-center text-sm text-slate-400 sm:text-right">
                  ام از هر ماه
                </span>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={!newTitle.trim() || !newDescription.trim()}
              className="inline-flex h-12 items-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-8 font-semibold text-cyan-200 transition hover:border-cyan-400/50 hover:bg-cyan-400/20 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-cyan-400/20 disabled:hover:bg-cyan-400/10"
            >
              <span>ویرایش</span>
              <Pencil size={18} />
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default EditModal;
