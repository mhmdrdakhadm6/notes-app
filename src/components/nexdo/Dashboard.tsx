import { useMemo, useState } from "react";
import { cn, compareByDue, faDueShort, faLongDate, todayKey, toDateKey, weekdayShortLetter } from "../../utils/nexdo";
import { useNexdo } from "../../contexts/NexdoContext";
import type { Project, Task } from "../../types/nexdo";
import { Icon } from "./Icon";
import { TaskItem } from "./TaskItem";
import { Badge, Button, ProgressBar } from "./ui";

function Sparkline() {
  const points = "0,42 6,38 12,40 18,30 24,33 30,26 36,29 42,20 48,24 54,16 60,20 66,12 72,16 78,9 84,8";
  return (
    <svg viewBox="0 0 84 44" className="h-16 w-full" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="nexdo-spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,43 ${points} 84,43`} fill="url(#nexdo-spark-fill)" />
      <polyline
        points={points}
        fill="none"
        stroke="#3b82f6"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="84" cy="8" r="2.5" fill="#60a5fa" />
    </svg>
  );
}

function QuickAdd() {
  const { addTask, pushToast } = useNexdo();
  const [value, setValue] = useState("");

  const submit = () => {
    const title = value.trim();
    if (!title) return;
    addTask({ title, dueDate: todayKey() });
    setValue("");
    pushToast({ type: "success", title: "تسک اضافه شد", message: "به فهرست امروز اضافه شد." });
  };

  return (
    <div className="task-chip-card flex items-center gap-2.5 px-3 py-2.5">
      <Icon name="add" size="sm" className="text-accent-glow" />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="امروز چه کاری باید انجام بدهی؟"
        className="min-w-0 flex-1 bg-transparent font-body-md text-text-primary placeholder:text-text-muted focus:outline-none"
      />
      <button
        onClick={submit}
        disabled={!value.trim()}
        className={cn(
          "rounded-full px-3 py-1.5 font-label-xs font-bold uppercase tracking-wide transition-colors",
          value.trim()
            ? "bg-primary-container text-on-primary-container"
            : "bg-surface-container text-text-muted",
        )}
      >
        افزودن
      </button>
    </div>
  );
}

function ProgressCard() {
  const { tasks } = useNexdo();
  const todayTotal = tasks.filter((t) => t.dueDate === todayKey() && t.status !== "archived");
  const done = todayTotal.filter((t) => t.status === "completed").length;
  const remaining = todayTotal.length - done;
  const pct = todayTotal.length ? Math.round((done / todayTotal.length) * 100) : 0;

  return (
    <div className="task-card task-card-hover rounded-xl p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-label-xs font-bold uppercase tracking-wide text-text-muted">
            پیشرفت امروز
          </div>
          <div className="mt-1 font-mono-metric text-3xl font-bold text-text-primary">
            {pct}
            <span className="text-lg text-text-muted">٪</span>
          </div>
          <div className="mt-0.5 font-label-xs text-text-secondary">
            {done} از {todayTotal.length} تسک تکمیل شد · {remaining} باقی‌مانده
          </div>
        </div>
        <div className="flex items-start gap-2">
          <div className="flex flex-col items-center rounded-xl bg-surface-container px-3 py-2">
            <span className="font-mono-metric text-sm font-bold text-accent-glow">۲۲:۱۴</span>
            <span className="font-label-xs text-text-muted">تایمر تمرکز</span>
          </div>
          <div className="flex flex-col items-center rounded-xl bg-surface-container px-3 py-2">
            <span className="font-mono-metric text-sm font-bold text-priority-medium">۵:۰۰</span>
            <span className="font-label-xs text-text-muted">استراحت</span>
          </div>
        </div>
      </div>
      <ProgressBar value={pct} className="mt-3" />
    </div>
  );
}

function projectProgress(project: Project, tasks: Task[]): number {
  const all = tasks.filter((t) => t.projectId === project.id && t.status !== "archived");
  if (!all.length) return 0;
  const done = all.filter((t) => t.status === "completed").length;
  return Math.round((done / all.length) * 100);
}

function projectBarColor(color: string): string {
  return `bg-${color}`;
}

function FocusQueue() {
  const { tasks, openCreateTask } = useNexdo();
  const todayTasks = useMemo(
    () =>
      tasks
        .filter((t) => t.status === "in_progress" || t.status === "todo")
        .filter((t) => t.status === "in_progress" || (t.dueDate ?? null) === todayKey())
        .sort(compareByDue)
        .slice(0, 4),
    [tasks],
  );

  return (
    <div className="rounded-xl border border-border-precision bg-surface-intermediate/40 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-electric opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-electric" />
          </span>
          <h3 className="font-headline-sm text-text-primary">تمرکز با اولویت بالا</h3>
        </div>
        <Badge>
          <Icon name="bolt" size="xs" className="text-accent-glow" />
          {todayTasks.length} تسک
        </Badge>
      </div>

      <div className="mt-3 space-y-2">
        {todayTasks.map((task) => (
          <TaskItem key={task.id} task={task} compact />
        ))}
        {todayTasks.length === 0 && (
          <div className="py-6 text-center font-body-sm text-text-muted">
            همه‌چیز مرتب است — تسکی در صف تمرکز نیست.
          </div>
        )}
      </div>

      <button
        onClick={() => openCreateTask()}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border-precision py-2.5 font-label-xs font-bold uppercase tracking-wide text-text-muted transition-colors hover:border-primary-container/50 hover:text-accent-glow"
      >
        <Icon name="add" size="xs" />
        افزودن تسک
      </button>
    </div>
  );
}

function ActiveProjects() {
  const { projects, tasks, setPage } = useNexdo();
  const active = projects.filter((p) => !p.archived).slice(0, 3);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-headline-sm text-text-primary">پروژه‌های فعال</h3>
        <button
          onClick={() => setPage("projects")}
          className="flex items-center gap-1 font-label-xs font-semibold text-accent-glow hover:text-text-primary"
        >
          مشاهده همه <Icon name="arrow_back" size="xs" />
        </button>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {active.map((project) => {
          const progress = projectProgress(project, tasks);
          return (
            <button key={project.id} onClick={() => setPage("projects")}
              className="task-card task-card-hover flex flex-col items-start gap-2.5 rounded-xl p-4 text-right">
              <div className="flex w-full items-center justify-between">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-container">
                  <Icon name={project.icon} size="sm" className="text-accent-glow" />
                </span>
                <span className={cn("font-mono-metric font-bold", `text-${project.color}`)}>
                  {progress}%
                </span>
              </div>
              <span className="font-headline-sm text-text-primary">{project.name}</span>
              <ProgressBar value={progress} colorClass={projectBarColor(project.color)} />
              <span className="font-label-xs text-text-muted">
                {project.deadline
                  ? `مهلت ${faDueShort(new Date(project.deadline))}`
                  : "در جریان"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ScoreCard() {
  const { tasks } = useNexdo();
  const doneToday = tasks.filter((t) => t.dueDate === todayKey() && t.status === "completed").length;

  return (
    <div className="task-card flex flex-col rounded-xl bg-surface-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon name="verified" size="sm" className="text-accent-glow" filled />
          <span className="font-label-xs font-bold uppercase tracking-wide text-text-muted">
            امتیاز بهره‌وری
          </span>
        </div>
        <span className="font-label-xs text-priority-medium">۴+ این هفته ▲</span>
      </div>
      <div className="mt-2 flex items-end gap-2">
        <span className="font-mono-metric text-4xl font-bold text-text-primary">87</span>
        <span className="pb-1 font-label-xs text-text-muted">/100</span>
      </div>
      <div className="mt-3">
        <Sparkline />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border-precision pt-3">
        <Stat label="ثبات" value="۱۲ روز" />
        <Stat label="تکمیل‌شده" value={`${doneToday} امروز`} />
        <Stat label="زمان تمرکز" value="۳س ۲۰د" />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-label-md text-text-secondary">{value}</div>
      <div className="font-label-xs text-text-muted">{label}</div>
    </div>
  );
}

function StreakCard() {
  const { tasks, setPage } = useNexdo();
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return toDateKey(d);
  });
  const hasActivity = (key: string) =>
    tasks.some((t) => t.status === "completed" && toDateKey(new Date(t.completedAt ?? "")) === key);

  return (
    <div className="task-card rounded-xl p-4">
      <div className="flex items-center gap-2">
        <Icon name="local_fire_department" size="md" className="text-priority-high" filled />
        <span className="font-label-xs font-bold uppercase tracking-wide text-text-muted">ثبات</span>
      </div>
      <div className="mt-2 font-headline-sm text-text-primary">
        <span className="font-bold text-priority-high">۱۲ روز</span> متوالی
      </div>
      <div className="mt-3 flex justify-between gap-1">
        {week.map((key) => (
          <div key={key} className="flex flex-col items-center gap-1">
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                hasActivity(key) ? "bg-accent-electric" : "bg-surface-container",
              )}
            />
            <span className="font-label-xs text-text-muted">
              {weekdayShortLetter(new Date(key + "T00:00:00"))}
            </span>
          </div>
        ))}
      </div>
      <button
        onClick={() => setPage("analytics")}
        className="mt-3 w-full rounded-full bg-surface-container py-2 font-label-xs font-bold uppercase tracking-wide text-text-secondary hover:text-text-primary"
      >
        مشاهده تحلیل
      </button>
    </div>
  );
}

function ProTip() {
  return (
    <div className="task-card rounded-xl border-accent-electric/30 bg-accent-electric/5 p-4">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-container text-on-primary-container">
          <Icon name="lightbulb" size="sm" filled />
        </span>
        <span className="font-label-xs font-bold uppercase tracking-wide text-accent-glow">
          نکته حرفه‌ای گردش کار
        </span>
      </div>
      <p className="mt-2 font-body-sm leading-relaxed text-text-secondary">
        روز را با یک <span className="font-semibold text-text-primary">مرور روزانه</span> ۵ دقیقه‌ای تمام کن —
        موفقیت‌ها را مرور کن، برنامه فردا را شفاف‌تر کن و ثبات خود را زنده نگه دار.
      </p>
    </div>
  );
}

export function Dashboard() {
  const { user, openCreateTask } = useNexdo();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "صبح بخیر" : hour < 17 ? "ظهر بخیر" : hour < 21 ? "عصر بخیر" : "شب بخیر";
  const name = user?.name.split(" ")[0] ?? "رضا";

  return (
    <div className="animate-fade-in space-y-5 p-4 lg:p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="font-label-xs uppercase tracking-wide text-text-muted">
            {faLongDate(new Date())}
          </div>
          <h2 className="font-headline-lg text-text-primary">
            {greeting}, {name} 👋
          </h2>
        </div>
        <Button variant="primary" onClick={() => openCreateTask()} label="ایجاد تسک جدید">
          <Icon name="add" size="xs" filled />
          افزودن سریع
        </Button>
      </header>

      <QuickAdd />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <ProgressCard />
          <FocusQueue />
          <ActiveProjects />
        </div>
        <div className="space-y-4">
          <ScoreCard />
          <StreakCard />
          <ProTip />
        </div>
      </div>
    </div>
  );
}