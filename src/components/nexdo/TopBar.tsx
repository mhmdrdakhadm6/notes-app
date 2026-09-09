import { useEffect, useRef, useState } from "react";
import { cn, faLongDate } from "../../utils/nexdo";
import { useNexdo } from "../../contexts/NexdoContext";
import type { Page } from "../../types/nexdo";
import { Icon } from "./Icon";
import { CircleAvatar } from "./ui";
import { PRIORITY_META } from "../../types/nexdo";

const pageTitles: Record<Page, string> = {
  dashboard: "داشبورد",
  tasks: "وظایف من",
  calendar: "تقویم",
  projects: "پروژه‌ها",
  notes: "یادداشت‌ها",
  analytics: "تحلیل‌ها",
  settings: "تنظیمات",
  help: "راهنما و پشتیبانی",
  profile: "پروفایل",
};

export function GlobalSearch() {
  const { searchQuery, setSearchQuery, searchResults, setPage, openTaskDetails, projects, getTask } =
    useNexdo();
  const [focused, setFocused] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const hasResults =
    searchQuery.trim().length > 0 &&
    (searchResults.tasks.length > 0 ||
      searchResults.projects.length > 0 ||
      searchResults.tagsFiltered.length > 0);

  const open = focused && searchQuery.trim().length > 0;

  const goToTask = (id: string) => {
    const task = getTask(id);
    setFocused(false);
    setSearchQuery("");
    setPage(task?.projectId ? "projects" : "tasks");
    openTaskDetails(id);
  };

  const goProject = () => {
    setFocused(false);
    setSearchQuery("");
    setPage("projects");
  };

  return (
    <div ref={boxRef} className="relative w-full max-w-md">
      <div className="relative">
        <span className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-text-muted">
          <Icon name="search" size="sm" filled={false} />
        </span>
        <input
          id="nexdo-global-search"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          placeholder="جستجو در همه‌چیز"
          className="h-9 w-full rounded-full bg-text-field ps-9 pe-14 text-body-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-container/60"
        />
        {!focused && (
          <kbd className="absolute end-3 top-1/2 -translate-y-1/2 rounded border border-border-precision bg-surface-container px-1.5 py-0.5 font-label-xs text-text-muted">
            /
          </kbd>
        )}
      </div>

      {open && (
        <div className="animate-dropdown absolute left-0 right-0 top-11 z-50 overflow-hidden rounded-xl bg-surface-card shadow-soft border border-border-precision">
          {!hasResults ? (
            <div className="px-4 py-6 text-center font-body-sm text-text-muted">
              نتیجه‌ای برای «{searchQuery}» پیدا نشد
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {searchResults.tasks.length > 0 && (
                <div className="px-2 py-2">
                  <div className="px-2 pb-1 font-label-xs font-bold uppercase tracking-wide text-text-muted">
                    وظایف
                  </div>
                  {searchResults.tasks.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => goToTask(task.id)}
                      className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-right hover:bg-surface-container"
                    >
                      <span
                        className={cn(
                          "h-2 w-2 rounded-full",
                          PRIORITY_META[task.priority].dot,
                        )}
                      />
                      <span className="flex-1 truncate font-body-sm text-text-primary">
                        {task.title}
                      </span>
                      {task.projectId && (
                        <span className="font-label-xs text-text-muted">
                          {projects.find((p) => p.id === task.projectId)?.name ?? ""}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
              {searchResults.projects.length > 0 && (
                <div className="border-t border-border-precision px-2 py-2">
                  <div className="px-2 pb-1 font-label-xs font-bold uppercase tracking-wide text-text-muted">
                    پروژه‌ها
                  </div>
                  {searchResults.projects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => goProject()}
                      className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-right hover:bg-surface-container"
                    >
                      <Icon name={project.icon} size="sm" className="text-accent-electric" />
                      <span className="flex-1 truncate font-body-sm text-text-primary">
                        {project.name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {searchResults.tagsFiltered.length > 0 && (
                <div className="border-t border-border-precision px-2 py-2">
                  <div className="px-2 pb-1 font-label-xs font-bold uppercase tracking-wide text-text-muted">
                    برچسب‌ها
                  </div>
                  <div className="flex flex-wrap gap-1.5 px-2">
                    {searchResults.tagsFiltered.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => {
                          setFocused(false);
                          setSearchQuery("");
                          setPage("tasks");
                        }}
                        className="rounded-full bg-surface-container px-2.5 py-1 font-label-xs text-text-secondary hover:text-text-primary"
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { setSubview } = useNexdo();

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const notifications = [
    {
      icon: "check_circle",
      color: "text-accent-electric",
      title: "هات‌فیکس v2.4 تکمیل شد",
      meta: "وب‌اپلیکیشن — ۱۲ دقیقه پیش",
    },
    {
      icon: "event_upcoming",
      color: "text-priority-high",
      title: "انتشار نسخه v2.5 فرداست",
      meta: "تأیید نهایی QA الزامی است",
    },
    {
      icon: "task_alt",
      color: "text-priority-low",
      title: "۴ تسک تا ساعت ۱۸:۰۰ امروز",
      meta: "تکمیل احراز هویت React، مطالعه و ارائه دمو",
    },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="icon-btn icon-btn-sm text-text-muted hover:bg-surface-container hover:text-text-primary"
        aria-label="اعلان‌ها"
      >
        <Icon name="notifications_none" size="sm" />
        <span className="absolute end-1.5 top-1.5 h-2 w-2 rounded-full bg-priority-urgent" />
      </button>
      {open && (
        <div className="animate-dropdown absolute left-0 top-11 z-50 w-80 overflow-hidden rounded-xl bg-surface-card shadow-soft border border-border-precision">
          <div className="flex items-center justify-between border-b border-border-precision px-4 py-3">
            <span className="font-label-xs font-bold uppercase tracking-wide text-text-secondary">
              اعلان‌ها
            </span>
            <span className="rounded-full bg-surface-container px-2 py-0.5 font-label-xs text-accent-glow">
              ۳ جدید
            </span>
          </div>
          <div className="py-1">
            {notifications.map((n, i) => (
              <button
                key={i}
                onClick={() => {
                  setOpen(false);
                  setSubview("today");
                }}
                className="flex w-full items-start gap-3 px-4 py-3 text-right hover:bg-surface-container"
              >
                <Icon name={n.icon} size="sm" className={cn("mt-0.5", n.color)} />
                <span>
                  <span className="block font-body-sm text-text-primary">{n.title}</span>
                  <span className="block font-label-xs text-text-muted">{n.meta}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { user, setPage, logout, pushToast } = useNexdo();

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full p-1 pe-2 hover:bg-surface-container transition-colors"
      >
        <CircleAvatar name={user?.name ?? "مهمان"} size="sm" />
        <Icon name="expand_more" size="xs" className="text-text-muted" />
      </button>
      {open && (
        <div className="animate-dropdown absolute left-0 top-11 z-50 w-56 overflow-hidden rounded-xl bg-surface-card shadow-soft border border-border-precision">
          <div className="border-b border-border-precision px-4 py-3">
            <div className="font-body-sm font-semibold text-text-primary">{user?.name}</div>
            <div className="font-label-xs text-text-muted">{user?.email}</div>
          </div>
          <div className="py-1">
            <button
              onClick={() => {
                setOpen(false);
                setPage("profile");
              }}
              className="flex w-full items-center gap-2.5 px-4 py-2 text-right font-body-sm text-text-secondary hover:bg-surface-container hover:text-text-primary"
            >
              <Icon name="person" size="sm" /> پروفایل
            </button>
            <button
              onClick={() => {
                setOpen(false);
                setPage("settings");
              }}
              className="flex w-full items-center gap-2.5 px-4 py-2 text-right font-body-sm text-text-secondary hover:bg-surface-container hover:text-text-primary"
            >
              <Icon name="settings" size="sm" /> تنظیمات
            </button>
            <button
              onClick={() => {
                setOpen(false);
                pushToast({ type: "info", title: "خروج از حساب", message: "هر زمانی می‌توانید دوباره وارد شوید." });
                logout();
              }}
              className="flex w-full items-center gap-2.5 px-4 py-2 text-right font-body-sm text-priority-urgent hover:bg-surface-container"
            >
              <Icon name="logout" size="sm" /> خروج
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ScorePill() {
  const { setPage } = useNexdo();
  return (
    <button
      onClick={() => setPage("analytics")}
      className="hidden items-center gap-1.5 rounded-full bg-surface-card border border-border-precision px-3 py-1.5 font-mono-metric text-text-secondary hover:border-accent-electric/50 hover:text-text-primary transition-colors sm:flex"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-priority-low" />
      <span className="font-bold">87</span>
      <span className="font-label-xs text-text-muted">/100</span>
      <Icon name="local_fire_department" size="xs" className="text-priority-high" />
    </button>
  );
}

export function TopBar() {
  const { page } = useNexdo();

  return (
    <header className="navbar-blur sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-border-precision bg-surface-intermediate/55 px-4 lg:px-6">
      <div className="flex items-center gap-2 lg:hidden">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-container">
          <Icon name="grid_view" size="sm" filled className="text-on-primary-container" />
        </span>
      </div>

      <div className="hidden shrink-0 items-center gap-2 lg:flex">
        <h1 className="font-headline-sm text-text-primary">{pageTitles[page]}</h1>
      </div>

      <div className="flex flex-1 items-center justify-end gap-3">
        <div className="hidden flex-1 justify-center md:flex">
          <GlobalSearch />
        </div>
        <span className="shrink-0 whitespace-nowrap font-body-sm font-semibold text-text-primary">
          {faLongDate(new Date())}
        </span>
        <ScorePill />
        <NotificationsBell />
        <ProfileMenu />
      </div>
    </header>
  );
}