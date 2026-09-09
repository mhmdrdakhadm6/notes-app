import { useMemo, useState } from "react";
import { cn, compareByDue, faJMonthYear, faLongDate, isOverdue, parseDueDate, todayKey } from "../../utils/nexdo";
import { jalaliMonthCells, jalaliMonthStartOffset, keyForJalaliDay, toJalali } from "../../utils/persianDate";
import { useNexdo } from "../../contexts/NexdoContext";
import type { Task, TasksSubview } from "../../types/nexdo";
import { Icon } from "./Icon";
import { TaskItem } from "./TaskItem";
import { Badge } from "./ui";

type Filter = "all" | TasksSubview;

const tabs: Array<{ id: Filter; label: string }> = [
  { id: "all", label: "همه" },
  { id: "today", label: "امروز" },
  { id: "upcoming", label: "پیش‌رو" },
  { id: "overdue", label: "عقب‌افتاده" },
  { id: "completed", label: "تکمیل‌شده" },
];

type TimeSlot = "Morning" | "Afternoon" | "Evening";

const slotLabel: Record<TimeSlot, string> = {
  Morning: "صبح",
  Afternoon: "بعدازظهر",
  Evening: "شب",
};

const slotOf = (task: Task): TimeSlot => {
  const h = Number.parseInt(task.dueTime ?? "12", 10);
  if (h < 12) return "Morning";
  if (h < 18) return "Afternoon";
  return "Evening";
};

const slotIcon: Record<TimeSlot, string> = {
  Morning: "wb_sunny",
  Afternoon: "sunny",
  Evening: "nights_stay",
};

function MiniCalendar() {
  const { tasks } = useNexdo();
  const now = new Date();
  const today = toJalali(now);
  const startOffset = jalaliMonthStartOffset(today.jy, today.jm);
  const days = jalaliMonthCells(today.jy, today.jm);
  const dayTasks = useMemo(() => {
    const map = new Map<string, number>();
    for (const task of tasks) {
      if (!task.dueDate || task.status === "archived") continue;
      map.set(task.dueDate, (map.get(task.dueDate) ?? 0) + 1);
    }
    return map;
  }, [tasks]);

  return (
    <div className="task-card rounded-xl p-4">
      <div className="flex items-center justify-between">
        <span className="font-label-xs font-bold uppercase tracking-wide text-text-muted">
          {faJMonthYear(today.jy, today.jm)}
        </span>
        <span className="flex gap-1">
          <button className="icon-btn icon-btn-sm text-text-muted hover:text-text-primary" aria-label="ماه قبل">
            <Icon name="chevron_right" size="xs" />
          </button>
          <button className="icon-btn icon-btn-sm text-text-muted hover:text-text-primary" aria-label="ماه بعد">
            <Icon name="chevron_left" size="xs" />
          </button>
        </span>
      </div>
      <div className="mt-3 grid grid-cols-7 gap-1 text-center">
        {["ش", "ی", "د", "س", "چ", "پ", "ج"].map((d, i) => (
          <span key={i} className="font-label-xs text-text-muted">{d}</span>
        ))}
        {Array.from({ length: startOffset }).map((_, i) => (
          <span key={`ph-${i}`} />
        ))}
        {days.map(({ jd }) => {
          const key = keyForJalaliDay(today.jy, today.jm, jd);
          const count = dayTasks.get(key) ?? 0;
          const isToday = jd === today.jd;
          return (
            <button
              key={jd}
              className={cn(
                "relative flex h-8 items-center justify-center rounded-lg font-mono-metric text-xs transition-colors",
                isToday
                  ? "bg-primary-container font-bold text-on-primary-container"
                  : "text-text-secondary hover:bg-surface-container",
              )}
            >
              {jd}
              {count > 0 && (
                <span
                  className={cn(
                    "absolute bottom-0.5 h-1 w-1 rounded-full",
                    isToday ? "bg-on-primary-container" : "bg-accent-glow",
                  )}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TagCloud() {
  const { tags, tasks, setSubview } = useNexdo();
  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of tags) map.set(t.name, 0);
    for (const task of tasks) {
      for (const tag of task.tags) map.set(tag, (map.get(tag) ?? 0) + 1);
    }
    return map;
  }, [tags, tasks]);

  return (
    <div className="task-card rounded-xl p-4">
      <div className="font-label-xs font-bold uppercase tracking-wide text-text-muted">برچسب‌ها</div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {Array.from(counts.entries())
          .sort((a, b) => b[1] - a[1])
          .map(([name, count]) => (
            <button
              key={name}
              onClick={() => setSubview("today")}
              className="rounded-full bg-surface-container px-2.5 py-1 font-label-xs text-text-secondary transition-colors hover:text-accent-glow"
            >
              #{name}
              <span className="ms-1 text-text-muted">{count}</span>
            </button>
          ))}
        {Array.from(counts.keys()).length === 0 && (
          <span className="font-body-sm text-text-muted">هنوز برچسبی نیست.</span>
        )}
      </div>
    </div>
  );
}

function GroupHeader({
  slot,
  count,
  onAdd,
}: {
  slot: TimeSlot;
  count: number;
  onAdd: () => void;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon name={slotIcon[slot]} size="sm" className="text-accent-glow" />
      <h3 className="font-headline-sm text-text-primary">{slotLabel[slot]}</h3>
      <Badge>{count}</Badge>
      <button
        onClick={onAdd}
        className="ms-auto flex items-center gap-1 font-label-xs font-bold uppercase tracking-wide text-accent-glow hover:text-text-primary"
      >
        <Icon name="add" size="xs" /> افزودن تسک
      </button>
    </div>
  );
}

function OverdueCard({ count, onShow }: { count: number; onShow: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-priority-urgent/30 bg-priority-urgent/10 p-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-priority-urgent/20 text-priority-urgent">
        <Icon name="warning" size="sm" filled />
      </span>
      <div>
        <div className="font-body-md font-semibold text-text-primary">
          {count === 1 ? "۱ تسک" : `${count} تسک`} عقب‌افتاده
        </div>
        <div className="font-label-xs text-text-muted">داخل برنامه امروز پنهان است — هرچه زودتر تعیین تکلیف کنید.</div>
      </div>
      <button
        onClick={onShow}
        className="ms-auto rounded-full bg-priority-urgent/15 px-3 py-1.5 font-label-xs font-bold uppercase tracking-wide text-priority-urgent hover:bg-priority-urgent/25"
      >
        بررسی
      </button>
    </div>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: string; tone?: "warn" | "ok" }) {
  return (
    <div className="flex flex-col items-center rounded-xl bg-surface-container px-4 py-3">
      <span className={cn("font-mono-metric text-lg font-bold", tone === "warn" ? "text-priority-urgent" : tone === "ok" ? "text-accent-glow" : "text-text-primary")}>
        {value}
      </span>
      <span className="font-label-xs text-text-muted">{label}</span>
    </div>
  );
}

export function TasksPage() {
  const { tasks, subview, setSubview, openCreateTask } = useNexdo();
  const [filter, setFilter] = useState<Filter>(subview);

  const visible = useMemo(() => {
    const base = tasks.filter((t) => t.status !== "archived");
    if (filter === "all") return base;
    if (filter === "today") return base.filter((t) => t.dueDate === todayKey());
    if (filter === "upcoming") return base.filter((t) => t.dueDate !== null && t.dueDate > todayKey());
    if (filter === "overdue") return base.filter((t) => isOverdue(t));
    return base.filter((t) => t.status === "completed");
  }, [tasks, filter]);

  const todayAgenda = useMemo(() => {
    const overdue = visible.filter((t) => isOverdue(t)).sort(compareByDue);
    const today = visible.filter((t) => t.dueDate === todayKey() && !isOverdue(t)).sort(compareByDue);
    const pending = today.filter((t) => t.status !== "completed");
    const done = today.filter((t) => t.status === "completed");
    const morning = pending.filter((t) => slotOf(t) === "Morning");
    const afternoon = pending.filter((t) => slotOf(t) === "Afternoon");
    const evening = pending.filter((t) => slotOf(t) === "Evening");
    return { overdue, morning, afternoon, evening, done };
  }, [visible]);

  const overdueCount = useMemo(() => tasks.filter((t) => isOverdue(t)).length, [tasks]);
  const completedCount = useMemo(
    () => tasks.filter((t) => t.status === "completed" && t.dueDate === todayKey()).length,
    [tasks],
  );
  const pendingTodayCount = useMemo(
    () => tasks.filter((t) => t.dueDate === todayKey() && t.status !== "completed").length,
    [tasks],
  );

  const setTab = (tab: Filter) => {
    setFilter(tab);
    if (tab !== "all") setSubview(tab);
  };

  const renderGroup = (name: TimeSlot, list: Task[]) => {
    if (list.length === 0) return null;
    return (
      <div className="space-y-2">
        <GroupHeader
          slot={name}
          count={list.length}
          onAdd={() => openCreateTask({ dueDate: todayKey() })}
        />
        {list.map((task) => (
          <TaskItem key={task.id} task={task} />
        ))}
      </div>
    );
  };

  return (
    <div className="animate-fade-in p-4 lg:p-6">
      <nav className="flex items-center gap-1.5 font-body-sm text-text-muted">
        <span>ایستگاه کاری</span>
        <Icon name="chevron_left" size="xs" />
        <span>وظایف من</span>
        <Icon name="chevron_left" size="xs" />
        <span className="font-semibold text-accent-glow">
          {tabs.find((t) => t.id === filter)?.label}
        </span>
      </nav>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-headline-lg text-text-primary">وظایف من</h2>
        <div className="flex max-w-full items-center gap-3">
          <div className="flex min-w-0 max-w-full gap-1 overflow-x-auto rounded-full bg-surface-intermediate p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setTab(tab.id)}
                className={cn(
                  "whitespace-nowrap rounded-full px-3 py-1.5 font-label-xs font-semibold transition-colors",
                  filter === tab.id
                    ? "bg-primary-container text-on-primary-container"
                    : "text-text-muted hover:text-text-primary",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => openCreateTask()}
            className="flex h-9 shrink-0 items-center gap-2 rounded-full bg-primary-container px-4 font-label-xs font-bold uppercase tracking-wide text-on-primary-container"
          >
            <Icon name="add" size="xs" filled /> تسک جدید
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_288px]">
        <div className="min-w-0 space-y-5">
          {/* Today / agenda view */}
          {filter === "all" && (
            <>
              <div className="grid grid-cols-3 gap-2">
                <MiniStat label="مهلت امروز" value={String(pendingTodayCount + completedCount)} />
                <MiniStat label="تکمیل‌شده" value={String(completedCount)} tone="ok" />
                <MiniStat label="عقب‌افتاده" value={String(overdueCount)} tone={overdueCount ? "warn" : "ok"} />
              </div>

              {overdueCount > 0 && (
                <OverdueCard count={overdueCount} onShow={() => setTab("overdue")} />
              )}

              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Icon name="events" size="sm" className="text-accent-glow" />
                  <h3 className="font-headline-sm text-text-primary">برنامه امروز</h3>
                  <Badge>{pendingTodayCount + completedCount} تسک</Badge>
                </div>
                <div className="space-y-4">
                  {renderGroup("Morning", todayAgenda.morning)}
                  {renderGroup("Afternoon", todayAgenda.afternoon)}
                  {renderGroup("Evening", todayAgenda.evening)}
                  {todayAgenda.morning.length + todayAgenda.afternoon.length + todayAgenda.evening.length === 0 && (
                    <div className="rounded-xl border border-dashed border-border-precision py-8 text-center">
                      <div className="font-body-sm text-text-secondary">
                        برای امروز برنامه‌ای نیست.
                      </div>
                      <button
                        onClick={() => openCreateTask()}
                        className="mt-2 font-label-xs font-bold uppercase tracking-wide text-accent-glow hover:text-text-primary"
                      >
                        + افزودن تسک
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {todayAgenda.done.length > 0 && (
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <Icon name="task_alt" size="sm" className="text-accent-electric" filled />
                    <h3 className="font-headline-sm text-text-secondary">تکمیل‌شده امروز</h3>
                    <Badge>{todayAgenda.done.length}</Badge>
                  </div>
                  <div className="space-y-2">
                    {todayAgenda.done.map((task) => (
                      <TaskItem key={task.id} task={task} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {filter === "today" && (
            <>
              {renderGroup("Morning", todayAgenda.morning)}
              {renderGroup("Afternoon", todayAgenda.afternoon)}
              {renderGroup("Evening", todayAgenda.evening)}
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Icon name="task_alt" size="sm" className="text-accent-electric" filled />
                  <h3 className="font-headline-sm text-text-secondary">تکمیل‌شده</h3>
                </div>
                {todayAgenda.done.length > 0 ? (
                  <div className="space-y-2">
                    {todayAgenda.done.map((task) => (
                      <TaskItem key={task.id} task={task} />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-border-precision py-6 text-center font-body-sm text-text-muted">
                    هنوز تسکی امروز تکمیل نشده.
                  </div>
                )}
              </div>
            </>
          )}

          {filter === "upcoming" && (
            <div className="space-y-4">
              {visible.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border-precision py-8 text-center font-body-sm text-text-muted">
                  چیزی پیش رو نیست.
                </div>
              ) : (
                (() => {
                  const groups = new Map<string, Task[]>();
                  for (const task of visible) {
                    const key = task.dueDate ?? "no-date";
                    if (!groups.has(key)) groups.set(key, []);
                    groups.get(key)!.push(task);
                  }
                  const keys = Array.from(groups.keys()).sort();
                  return keys.map((key) => {
                    const list = groups.get(key)!.sort(compareByDue);
                    const date = parseDueDate(key);
                    const label =
                      key === "no-date"
                        ? "بدون تاریخ"
                        : date
                          ? faLongDate(date)
                          : key;
                    return (
                      <div key={key}>
                        <div className="mb-2 flex items-center gap-2">
                          <h3 className="font-headline-sm text-text-primary">{label}</h3>
                          <Badge>{list.length}</Badge>
                        </div>
                        <div className="space-y-2">
                          {list.map((task) => (
                            <TaskItem key={task.id} task={task} />
                          ))}
                        </div>
                      </div>
                    );
                  });
                })()
              )}
            </div>
          )}

          {filter === "overdue" && (
            <div className="space-y-2">
              {visible.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border-precision py-8 text-center font-body-sm text-text-muted">
                  چیزی عقب نیفتاده — عالی!
                </div>
              ) : (
                visible
                  .sort(compareByDue)
                  .map((task) => <TaskItem key={task.id} task={task} showProject />)
              )}
            </div>
          )}

          {filter === "completed" && (
            <div className="space-y-2">
              {visible.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border-precision py-8 text-center font-body-sm text-text-muted">
                  تسک تکمیل‌شده‌ای نیست.
                </div>
              ) : (
                visible.map((task) => <TaskItem key={task.id} task={task} />)
              )}
            </div>
          )}

          {/* tag filtered list for all-mode when a project is selected isn't shown here */}
        </div>

        <aside className="space-y-4">
          <MiniCalendar />
          <TagCloud />
        </aside>
      </div>
    </div>
  );
}