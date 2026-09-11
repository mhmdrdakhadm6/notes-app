import { cn } from "../../utils/nexdo";
import { useNexdo } from "../../contexts/NexdoContext";
import type { Page } from "../../types/nexdo";
import { Icon } from "./Icon";

const items: Array<{ page: Page; label: string; icon: string }> = [
  { page: "dashboard", label: "خانه", icon: "space_dashboard" },
  { page: "tasks", label: "وظایف", icon: "check_circle" },
];
const rightItems: Array<{ page: Page; label: string; icon: string }> = [
  { page: "calendar", label: "تقویم", icon: "calendar_month" },
  { page: "projects", label: "پروژه‌ها", icon: "folder_open" },
];

function NavBtn({ item }: { item: { page: Page; label: string; icon: string } }) {
  const { page, setPage } = useNexdo();
  const active = page === item.page;
  return (
    <button
      onClick={() => setPage(item.page)}
      className="group flex flex-1 flex-col items-center justify-center gap-1 rounded-xl py-1 transition-transform active:scale-95"
    >
      <span
        className={cn(
          "relative flex h-9 w-12 items-center justify-center rounded-full transition-all duration-300",
          active
            ? "bg-primary-container text-on-primary-container shadow-[0_5px_16px_rgba(37,99,235,0.45)]"
            : "text-text-muted group-hover:text-text-secondary",
        )}
      >
        {active && (
          <span className="absolute inset-0 -z-10 rounded-full bg-primary-container blur-md opacity-50" />
        )}
        <Icon name={item.icon} size="md" filled={active} />
      </span>
      <span
        className={cn(
          "text-[10px] font-semibold leading-3",
          active ? "text-accent-glow" : "text-text-muted",
        )}
      >
        {item.label}
      </span>
      <span
        className={cn(
          "h-1 w-1 rounded-full transition-all duration-300",
          active ? "bg-accent-glow shadow-[0_0_6px_rgba(96,165,250,0.9)]" : "bg-transparent",
        )}
      />
    </button>
  );
}

function CreateTaskBtn() {
  const { openCreateTask } = useNexdo();
  return (
    <button
      onClick={() => openCreateTask()}
      aria-label="ایجاد تسک جدید"
      className="group flex flex-1 flex-col items-center justify-center gap-1 rounded-xl py-1 transition-transform active:scale-95"
    >
      <span className="relative flex h-12 w-12 items-center justify-center">
        <span aria-hidden className="mnav-aura" />
        <span aria-hidden className="mnav-aura mnav-aura-rev" />
        <span aria-hidden className="mnav-ping" />
        <span
          aria-hidden
          className="mnav-spin absolute -inset-[3px] rounded-full border border-dashed border-white/20"
        />
        <span className="mnav-core relative flex h-12 w-12 items-center justify-center rounded-full text-on-primary-container shadow-[0_6px_20px_rgba(37,99,235,0.5),inset_0_1px_0_rgba(255,255,255,0.25)] ring-1 ring-white/25 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 group-active:scale-90">
          <Icon
            name="add"
            size="lg"
            filled
            className="transition-transform duration-500 group-hover:rotate-90"
          />
        </span>
      </span>
      <span className="text-[10px] font-semibold leading-3 text-text-muted">جدید</span>
      <span className="h-1 w-1 rounded-full bg-transparent" />
    </button>
  );
}

export function MobileNav() {
  return (
    <nav className="fixed inset-x-3 bottom-3 z-40 lg:hidden">
      <div className="relative mx-auto flex max-w-md items-stretch gap-0.5 rounded-[1.6rem] border border-white/10 bg-gradient-to-b from-surface-card/85 to-surface-container-lowest/95 px-1.5 py-1.5 shadow-[0_-6px_30px_rgba(0,0,0,0.35),0_10px_28px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.07)] backdrop-blur-2xl backdrop-saturate-150 pb-[calc(0.45rem+env(safe-area-inset-bottom))]">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent"
        />
        {items.map((item) => (
          <NavBtn key={item.page} item={item} />
        ))}
        <CreateTaskBtn />
        {rightItems.map((item) => (
          <NavBtn key={item.page} item={item} />
        ))}
      </div>
    </nav>
  );
}