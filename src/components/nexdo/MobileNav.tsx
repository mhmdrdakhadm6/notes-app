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
      className="flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl py-1 transition-transform active:scale-95"
    >
      <span
        className={cn(
          "flex h-8 w-12 items-center justify-center rounded-full transition-colors",
          active ? "bg-primary-container text-on-primary-container shadow-glow" : "text-text-muted",
        )}
      >
        <Icon name={item.icon} size="md" filled={active} />
      </span>
      <span className={cn("text-[10px] font-semibold", active ? "text-accent-glow" : "text-text-muted")}>
        {item.label}
      </span>
    </button>
  );
}

export function MobileNav() {
  const { openCreateTask } = useNexdo();

  return (
    <nav className="fixed inset-x-3 bottom-2 z-40 lg:hidden">
      <div className="nexdo-nav-glass mx-auto flex max-w-md items-stretch justify-around gap-0.5 rounded-[1.5rem] border border-white/10 px-1 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
        {items.map((item) => (
          <NavBtn key={item.page} item={item} />
        ))}

        <button
          onClick={() => openCreateTask()}
          className="relative -top-5 flex h-14 w-14 shrink-0 items-center justify-center self-start rounded-full bg-accent-gradient text-on-primary-container shadow-glow transition-transform active:scale-95"
          aria-label="ایجاد تسک جدید"
        >
          <Icon name="add" size="lg" filled />
        </button>

        {rightItems.map((item) => (
          <NavBtn key={item.page} item={item} />
        ))}
      </div>
    </nav>
  );
}