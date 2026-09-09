import { cn } from "../../utils/nexdo";
import { useNexdo } from "../../contexts/NexdoContext";
import type { Page } from "../../types/nexdo";
import { Icon } from "./Icon";
import { Button } from "./ui";

interface NavEntry {
  page: Page;
  label: string;
  icon: string;
  shortcut?: string;
}

const mainNav: NavEntry[] = [
  { page: "dashboard", label: "داشبورد", icon: "space_dashboard", shortcut: "D" },
  { page: "tasks", label: "وظایف من", icon: "check_circle", shortcut: "T" },
  { page: "calendar", label: "تقویم", icon: "calendar_month", shortcut: "C" },
  { page: "projects", label: "پروژه‌ها", icon: "folder_special", shortcut: "P" },
  { page: "notes", label: "یادداشت‌ها", icon: "sticky_note_2" },
  { page: "analytics", label: "تحلیل‌ها", icon: "query_stats", shortcut: "A" },
];

const projectSections = ["کار", "دانشگاه", "شخصی", "سفارشی"];

export function Logo() {
  return (
    <div className="flex items-center gap-2.5 px-4 py-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-container shadow-glow">
        <Icon name="grid_view" size="md" filled className="text-on-primary-container" />
      </div>
      <div className="leading-none">
        <div className="font-headline-sm font-bold tracking-tight text-text-primary">NEXDO</div>
        <div className="mt-0.5 font-label-xs text-text-muted">ایستگاه کاری</div>
      </div>
    </div>
  );
}

function NavItem({
  entry,
  active,
  onClick,
  indent = false,
}: {
  entry: NavEntry | { page: null; label: string; icon: string };
  active: boolean;
  onClick: () => void;
  indent?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group flex w-full items-center gap-3 rounded-full py-2 px-3 text-label-xs font-semibold transition-all duration-200 focus:outline-none",
        indent && "ps-9",
        active
          ? "bg-primary-container/20 text-accent-glow"
          : "text-text-muted hover:bg-surface-container hover:text-text-primary",
      )}
    >
      <Icon name={entry.icon} size="sm" className={cn(!active && "group-hover:text-text-secondary")} />
      <span className="flex-1 text-right">{entry.label}</span>
      {entry.page && active && (
        <span className="text-right text-[10px] font-medium text-accent-glow/70">●</span>
      )}
    </button>
  );
}

export function Sidebar({ onNavigate }: { onNavigate?: (page: Page) => void }) {
  const {
    page,
    setPage,
    projects,
    openCreateTask,
    user,
    pushToast,
  } = useNexdo();

  const navigate = (target: Page) => {
    setPage(target);
    onNavigate?.(target);
  };

  const archivedCount = projects.filter((p) => !p.archived).length;

  return (
    <aside className="sticky top-0 flex h-[100dvh] w-sidebar-width flex-col bg-surface-intermediate/60 backdrop-blur-2xl">
      <Logo />

      <div className="px-4 pb-2">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={() => openCreateTask()}
          label="ایجاد تسک جدید"
        >
          <Icon name="add" size="xs" filled />
          تسک جدید
          <kbd className="me-auto rounded bg-black/20 px-1.5 py-0.5 text-[10px] font-bold text-on-primary-container/80">
            N
          </kbd>
        </Button>
      </div>

      <nav className="mt-2 flex-1 space-y-1 overflow-y-auto px-4">
        <NavItem
          entry={mainNav[0]}
          active={page === mainNav[0].page}
          onClick={() => navigate(mainNav[0].page)}
        />
        <NavItem
          entry={mainNav[1]}
          active={page === mainNav[1].page}
          onClick={() => navigate(mainNav[1].page)}
        />
        <NavItem
          entry={mainNav[2]}
          active={page === mainNav[2].page}
          onClick={() => navigate(mainNav[2].page)}
        />

        <div className="flex items-center justify-between px-3 pt-4 pb-1">
          <span className="font-label-xs font-bold uppercase tracking-widest text-text-muted">
            پروژه‌ها
          </span>
          <button
            onClick={() => navigate("projects")}
            className="icon-btn icon-btn-sm text-text-muted hover:text-text-primary hover:bg-surface-container"
            aria-label="مشاهده همه پروژه‌ها"
          >
            <Icon name="chevron_right" size="xs" />
          </button>
        </div>

        {archivedCount > 0 &&
          projectSections.map((section) => {
            const projectNames = projects
              .filter((p) => !p.archived && p.category === section)
              .map((p) => p.name);
            if (projectNames.length === 0 && section !== "کار") return null;
            return (
              <div key={section} className="relative">
                <NavItem
                  entry={{ page: null, label: section, icon: section === "کار" ? "work" : section === "دانشگاه" ? "school" : section === "شخصی" ? "spa" : "folder" }}
                  active={false}
                  onClick={() => navigate("projects")}
                  indent
                />
                {projectNames.length > 0 && (
                  <div className="ms-11 space-y-0.5 pb-1">
                    {projectNames.map((name) => {
                      const project = projects.find((p) => p.name === name);
                      return (
                        <button
                          key={name}
                          onClick={() => {
                            navigate("projects");
                          }}
                          className="group flex w-full items-center gap-2 rounded-full py-1 ps-3 text-label-xs font-medium text-text-muted transition-colors hover:text-text-primary"
                        >
                          <span
                            className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              project ? `bg-${project.color}` : "bg-accent-electric",
                            )}
                          />
                          {name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
      </nav>

      <div className="px-4 pb-3">
        <div className="rounded-xl bg-surface-card border border-border-precision p-3">
          <div className="flex items-center gap-2">
            <Icon name="local_fire_department" size="sm" className="text-priority-high" filled />
            <span className="font-label-xs font-bold uppercase tracking-wide text-text-secondary">
              {user ? user.name.split(" ")[0] : "مهمان"} · ثبات ۱۲ روزه
            </span>
            <Icon name="arrow_forward_ios" size="xs" className="me-auto text-text-muted" />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 border-t border-border-precision px-4 py-3">
        <button
          onClick={() => navigate("settings")}
          className="icon-btn icon-btn-sm text-text-muted hover:bg-surface-container hover:text-text-primary"
          aria-label="تنظیمات"
        >
          <Icon name="settings" size="sm" />
        </button>
        <button
          onClick={() => {
            navigate("help");
          }}
          className="icon-btn icon-btn-sm text-text-muted hover:bg-surface-container hover:text-text-primary"
          aria-label="راهنما"
        >
          <Icon name="help" size="sm" />
        </button>
        <div className="mx-1 h-4 w-px bg-border-precision" />
        <button
          onClick={() => {
            pushToast({ type: "info", title: "همگام‌سازی متوقف است", message: "حالت آفلاین فعال است." });
          }}
          className="flex flex-1 items-center gap-2 rounded-full px-2 py-1 text-label-xs text-text-muted hover:bg-surface-container hover:text-text-primary"
        >
          <span className="flex h-2 w-2 rounded-full bg-priority-low" />
          فضای کاری محلی
        </button>
        <div className="icon-btn icon-btn-sm text-text-muted cursor-default">
          <Icon name="cloud_off" size="xs" />
        </div>
      </div>
    </aside>
  );
}