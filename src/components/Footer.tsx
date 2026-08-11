import {
  ArrowUp,
  CalendarClock,
  FileText,
  Image,
  Pin,
  Plus,
} from "lucide-react";
import { useNotes } from "../hooks/useNotes";

function Footer() {
  const { notes, setIsOpen } = useNotes();
  const permanentNotes = notes.filter((note) => note.isPermanent).length;
  const scheduledNotes = notes.length - permanentNotes;
  const imageNotes = notes.filter((note) => Boolean(note.image)).length;

  const stats = [
    {
      label: "کل یادداشت‌ها",
      value: notes.length,
      icon: FileText,
      color: "text-blue-300",
      background: "bg-blue-500/10",
    },
    {
      label: "یادداشت ثابت",
      value: permanentNotes,
      icon: Pin,
      color: "text-violet-300",
      background: "bg-violet-500/10",
    },
    {
      label: "زمان‌دار",
      value: scheduledNotes,
      icon: CalendarClock,
      color: "text-amber-300",
      background: "bg-amber-500/10",
    },
    {
      label: "تصویردار",
      value: imageNotes,
      icon: Image,
      color: "text-emerald-300",
      background: "bg-emerald-500/10",
    },
  ];

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer
      dir="rtl"
      className="relative overflow-hidden rounded-b-[32px] border-t border-white/[0.07] bg-[#07090f] px-4 py-5 sm:px-6"
    >
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-[radial-gradient(circle_at_bottom_right,_rgba(9,60,200,0.15),_transparent_60%)]" />

      <div className="relative flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-4">
          {stats.map(({ label, value, icon: Icon, color, background }) => (
            <div
              key={label}
              className="flex min-w-0 items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-3 transition hover:border-white/10 hover:bg-white/[0.045]"
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${background} ${color}`}
              >
                <Icon size={18} strokeWidth={2} />
              </span>
              <span className="min-w-0">
                <strong className="block text-lg font-black leading-none text-white">
                  {value.toLocaleString("fa-IR")}
                </strong>
                <span className="mt-1.5 block truncate text-[10px] font-medium text-slate-500">
                  {label}
                </span>
              </span>
            </div>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#093cc8] px-5 text-sm font-bold text-white transition hover:bg-[#174ed8] hover:shadow-lg hover:shadow-blue-900/30 xl:flex-none"
          >
            <Plus size={18} />
            یادداشت جدید
          </button>

          <button
            type="button"
            onClick={scrollToTop}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04] text-slate-400 transition hover:border-[#093cc8]/30 hover:bg-[#093cc8]/10 hover:text-blue-300"
            aria-label="بازگشت به بالای صفحه"
            title="بازگشت به بالا"
          >
            <ArrowUp size={18} />
          </button>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
