import { useMemo } from "react";
import { cn, toDateKey, weekdayShortLetter } from "../../utils/nexdo";
import { useNexdo } from "../../contexts/NexdoContext";
import { PRIORITY_META, type TaskPriority } from "../../types/nexdo";
import { Icon } from "./Icon";
import { ProgressBar } from "./ui";

function BarChart({ data }: { data: Array<{ label: string; value: number; highlight?: boolean }> }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex h-36 items-end gap-2">
      {data.map((d, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1">
          <div className="flex w-full flex-1 items-end">
            <div
              className={cn(
                "w-full rounded-t-md transition-all",
                d.highlight ? "bg-accent-gradient" : "bg-primary-container/40",
              )}
              style={{ height: `${(d.value / max) * 100}%` }}
            />
          </div>
          <span className="font-label-xs text-text-muted">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export function AnalyticsPage() {
  const { tasks, projects } = useNexdo();

  const last7Days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const key = toDateKey(d);
      const completed = tasks.filter(
        (t) => t.status === "completed" && t.completedAt && toDateKey(new Date(t.completedAt)) === key,
      ).length;
      return {
        label: weekdayShortLetter(d),
        value: completed,
        highlight: i === 6,
      };
    });
  }, [tasks]);

  const totalTasks = tasks.filter((t) => t.status !== "archived").length;
  const completed = tasks.filter((t) => t.status === "completed").length;
  const completionRate = totalTasks ? Math.round((completed / totalTasks) * 100) : 0;
  const overdue = tasks.filter((t) => t.dueDate && t.dueDate < toDateKey(new Date()) && t.status !== "completed").length;
  const byPriority = ["urgent", "high", "medium", "low"].map((p) => ({
    key: p,
    count: tasks.filter((t) => t.priority === p && t.status !== "archived").length,
  }));
  const maxPriority = Math.max(1, ...byPriority.map((b) => b.count));
  const byProject = projects
    .filter((p) => !p.archived)
    .map((p) => {
      const all = tasks.filter((t) => t.projectId === p.id && t.status !== "archived");
      const done = all.filter((t) => t.status === "completed").length;
      return { project: p, count: all.length, done };
    })
    .filter((r) => r.count > 0);

  return (
    <div className="animate-fade-in p-4 lg:p-6">
      <div>
        <h2 className="font-headline-lg text-text-primary">تحلیل‌ها</h2>
        <p className="font-body-sm text-text-muted">بازدهی تو، در یک نگاه.</p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric icon="task_alt" label="تسک‌های تکمیل‌شده" value={String(completed)} />
        <Metric icon="checklist" label="نرخ تکمیل" value={`${completionRate}٪`} accent />
        <Metric icon="alarm" label="تسک‌های عقب‌افتاده" value={String(overdue)} warn={overdue > 0} />
        <Metric icon="local_fire_department" label="ثبات" value="۱۲ روز" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="task-card rounded-xl p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-headline-sm text-text-primary">تسک‌های تکمیل‌شده</h3>
            <span className="font-label-xs text-text-muted">۷ روز اخیر</span>
          </div>
          <BarChart data={last7Days} />
        </div>

        <div className="task-card rounded-xl p-4">
          <h3 className="mb-4 font-headline-sm text-text-primary">تسک‌ها بر اساس اولویت</h3>
          <div className="space-y-3">
            {byPriority.map((b) => (
              <div key={b.key}>
                <div className="mb-1 flex items-center justify-between font-label-xs text-text-secondary">
                  <span>{PRIORITY_META[b.key as TaskPriority].label}</span>
                  <span className="font-mono-metric text-text-muted">{b.count}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-surface-container">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      b.key === "urgent" && "bg-priority-urgent",
                      b.key === "high" && "bg-priority-high",
                      b.key === "medium" && "bg-priority-medium",
                      b.key === "low" && "bg-priority-low",
                    )}
                    style={{ width: `${(b.count / maxPriority) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="task-card rounded-xl p-4 lg:col-span-2">
          <h3 className="mb-4 font-headline-sm text-text-primary">توازن پروژه‌ها</h3>
          {byProject.length === 0 ? (
            <div className="py-6 text-center font-body-sm text-text-muted">
              هنوز فعالیتی در پروژه‌ها ثبت نشده.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {byProject.map(({ project, count, done }) => {
                const pct = count ? Math.round((done / count) * 100) : 0;
                return (
                  <div key={project.id} className="rounded-xl bg-surface-container-lowest p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="flex items-center gap-2 font-body-md font-semibold text-text-primary">
                        <Icon name={project.icon} size="sm" style={{ color: `var(--color-${project.color})` }} />
                        {project.name}
                      </span>
                      <span className="font-mono-metric text-sm font-bold" style={{ color: `var(--color-${project.color})` }}>
                        {pct}٪
                      </span>
                    </div>
                    <ProgressBar value={pct} colorClass={`bg-${project.color}`} />
                    <div className="mt-1.5 font-label-xs text-text-muted">
                      {done} انجام‌شده · {count - done} باقی‌مانده
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Metric({ icon, label, value, accent, warn }: { icon: string; label: string; value: string; accent?: boolean; warn?: boolean }) {
  return (
    <div className="task-card rounded-xl p-4">
      <span
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-lg",
          accent ? "bg-primary-container/20 text-accent-glow" : warn ? "bg-priority-urgent/15 text-priority-urgent" : "bg-surface-container text-text-secondary",
        )}
      >
        <Icon name={icon} size="md" />
      </span>
      <div className="mt-3 font-mono-metric text-2xl font-bold text-text-primary">{value}</div>
      <div className="font-label-xs text-text-muted">{label}</div>
    </div>
  );
}