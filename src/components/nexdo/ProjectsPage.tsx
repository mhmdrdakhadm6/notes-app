import { useMemo } from "react";
import { cn, compareByDue, faDueShort } from "../../utils/nexdo";
import { fromJalali, toJalali } from "../../utils/persianDate";
import { useNexdo } from "../../contexts/NexdoContext";
import type { Project, Task } from "../../types/nexdo";
import { Icon } from "./Icon";
import { TaskItem } from "./TaskItem";
import { Button, ProgressBar } from "./ui";

function projectProgress(project: Project, tasks: Task[]): number {
  const all = tasks.filter((t) => t.projectId === project.id && t.status !== "archived");
  if (!all.length) return 0;
  const done = all.filter((t) => t.status === "completed").length;
  return Math.round((done / all.length) * 100);
}

function colorText(color: string): string {
  return `text-${color}`;
}

function colorBg(color: string): string {
  return `bg-${color}`;
}

function ProjectCard({
  project,
  progress,
  count,
  onOpen,
  onMore,
}: {
  project: Project;
  progress: number;
  count: number;
  onOpen: () => void;
  onMore: () => void;
}) {
  return (
    <button
      onClick={onOpen}
      className="task-card task-card-hover flex flex-col items-start gap-3 rounded-xl p-4 text-right"
    >
      <div className="flex w-full items-start justify-between">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container">
          <Icon name={project.icon} size="md" className={colorText(project.color)} />
        </span>
        <span onClick={(e) => { e.stopPropagation(); onMore(); }}
          className="icon-btn icon-btn-slim -me-1 text-text-muted hover:bg-surface-container hover:text-text-primary"
        >
          <Icon name="more_vert" size="xs" />
        </span>
      </div>

      <div>
        <h3 className="font-headline-sm text-text-primary">{project.name}</h3>
        <p className="mt-0.5 line-clamp-2 font-body-sm text-text-muted">{project.description}</p>
      </div>

      <ProgressBar value={progress} colorClass={colorBg(project.color)} />

      <div className="flex w-full items-center justify-between font-label-xs text-text-muted">
        <span className="flex items-center gap-1">
          <Icon name="task_alt" size="xs" /> {count} تسک
        </span>
        <span className="flex items-center gap-1">
          {project.deadline ? (
            <>
              <Icon name="event" size="xs" />
              {faDueShort(new Date(project.deadline))}
            </>
          ) : (
            <span className="text-accent-glow">در جریان</span>
          )}
        </span>
        <span className={cn("font-mono-metric font-bold", colorText(project.color))}>{progress}٪</span>
      </div>
    </button>
  );
}

function DetailPane({ project, onClose }: { project: Project; onClose: () => void }) {
  const { tasks, openCreateTask, updateProject } = useNexdo();
  const progress = projectProgress(project, tasks);
  const projectTasks = useMemo(
    () => tasks.filter((t) => t.projectId === project.id && t.status !== "archived").sort(compareByDue),
    [tasks, project.id],
  );
  const stats = {
    inProgress: projectTasks.filter((t) => t.status === "in_progress").length,
    planned: projectTasks.filter((t) => t.status === "todo").length,
    done: projectTasks.filter((t) => t.status === "completed").length,
  };

  return (
    <div className="animate-fade-in rounded-xl border border-border-precision bg-surface-card lg:sticky lg:top-20">
      <div className="flex items-start justify-between p-4">
        <div className="flex items-center gap-3">
          <span className={cn("flex h-11 w-11 items-center justify-center rounded-xl bg-surface-container")}>
            <Icon name={project.icon} size="lg" className={colorText(project.color)} />
          </span>
          <div>
            <h3 className="font-headline-sm text-text-primary">{project.name}</h3>
            <p className="font-label-xs text-text-muted">{project.description}</p>
          </div>
        </div>
        <div className="flex gap-1">
          <button onClick={() => updateProject(project.id, { archived: !project.archived })}
            className="icon-btn icon-btn-sm text-text-muted hover:text-text-primary" aria-label={project.archived ? "خروج از بایگانی" : "بایگانی"}>
            <Icon name="archive" size="xs" />
          </button>
          <button onClick={onClose} className="icon-btn icon-btn-sm text-text-muted hover:text-text-primary" aria-label="بستن جزئیات">
            <Icon name="close" size="xs" />
          </button>
        </div>
      </div>

      <div className="px-4 pb-4">
        <ProgressBar value={progress} colorClass={colorBg(project.color)} />
        <div className="mt-1.5 text-right font-mono-metric font-bold" style={{ color: `var(--color-${project.color})` }}>
          {progress}%
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 border-y border-border-precision px-4 py-3">
        <DetailStat label="در جریان" value={stats.inProgress} />
        <DetailStat label="برنامه‌ریزی‌شده" value={stats.planned} />
        <DetailStat label="انجام‌شده" value={stats.done} />
      </div>

      <div className="p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="flex items-center gap-2 font-headline-sm text-text-primary">
            <Icon name="task_alt" size="sm" className="text-accent-glow" />
            تسک‌ها
          </span>
          <span className="font-label-xs text-text-muted">{projectTasks.length}</span>
        </div>
        <div className="space-y-2">
          {projectTasks.map((task) => (
            <TaskItem key={task.id} task={task} showProject={false} compact />
          ))}
          {projectTasks.length === 0 && (
            <div className="py-4 text-center font-body-sm text-text-muted">هنوز تسکی نیست.</div>
          )}
        </div>
        <button
          onClick={() => openCreateTask({ projectId: project.id })}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-dashed border-border-precision py-2 font-label-xs font-bold uppercase tracking-wide text-text-muted hover:border-primary-container/50 hover:text-accent-glow"
        >
          <Icon name="add" size="xs" /> افزودن تسک به {project.name}
        </button>
      </div>
    </div>
  );
}

function DetailStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <div className="font-mono-metric text-lg font-bold text-text-primary">{value}</div>
      <div className="font-label-xs text-text-muted">{label}</div>
    </div>
  );
}

export function ProjectsPage() {
  const {
    projects,
    tasks,
    openProjectModal,
    selectedProjectId,
    setSelectedProjectId,
    requestConfirm,
    deleteProject,
    pushToast,
  } = useNexdo();

  const visible = projects.filter((p) => !p.archived);
  const selected = projects.find((p) => p.id === selectedProjectId) ?? null;

  const totalTasks = useMemo(() => {
    const ids = new Set(visible.map((p) => p.id));
    return tasks.filter((t) => t.projectId && ids.has(t.projectId) && t.status !== "archived").length;
  }, [tasks, visible]);

  const completedThisMonth = useMemo(() => {
    const now = toJalali(new Date());
    const start = fromJalali(now.jy, now.jm, 1);
    const nextJ = now.jm === 12 ? { jy: now.jy + 1, jm: 1 } : { jy: now.jy, jm: now.jm + 1 };
    const end = fromJalali(nextJ.jy, nextJ.jm, 1);
    return tasks.filter((t) => {
      if (t.status !== "completed" || !t.completedAt) return false;
      const c = new Date(t.completedAt);
      return c >= start && c < end;
    }).length;
  }, [tasks]);

  const avgRate = useMemo(() => {
    const rated = visible.map((p) => projectProgress(p, tasks));
    return rated.length ? Math.round(rated.reduce((a, b) => a + b, 0) / rated.length) : 0;
  }, [visible, tasks]);

  return (
    <div className="animate-fade-in p-4 lg:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-headline-lg text-text-primary">پروژه‌ها</h2>
          <p className="font-body-sm text-text-muted">
            {visible.length} فعال · {projects.length - visible.length} بایگانی‌شده
          </p>
        </div>
        <Button variant="primary" onClick={openProjectModal}>
          <Icon name="add" size="xs" filled /> پروژه جدید
        </Button>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MetricCard icon="folder_open" label="پروژه‌های فعال" value={String(visible.length)} />
        <MetricCard icon="task_alt" label="تسک‌های تکمیل‌شده این ماه" value={String(completedThisMonth)} />
        <MetricCard icon="insights" label="میانگین نرخ تکمیل" value={`${avgRate}٪`} accent />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-headline-sm text-text-primary">همه پروژه‌ها</h3>
            <span className="font-label-xs text-text-muted">
              {totalTasks} تسک در مجموع
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {visible.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                progress={projectProgress(project, tasks)}
                count={tasks.filter((t) => t.projectId === project.id && t.status !== "archived").length}
                onOpen={() => setSelectedProjectId(project.id)}
                onMore={() =>
                  requestConfirm({
                    title: `حذف «${project.name}»؟`,
                    message: "تسک‌ها بدون پروژه می‌مانند. این عمل قابل بازگشت نیست.",
                    confirmLabel: "حذف پروژه",
                    danger: true,
                    onConfirm: () => {
                      deleteProject(project.id);
                      setSelectedProjectId(null);
                      pushToast({ type: "error", title: "پروژه حذف شد", message: project.name });
                    },
                  })
                }
              />
            ))}
          </div>
          {visible.length === 0 && (
            <div className="rounded-xl border border-dashed border-border-precision py-10 text-center">
              <Icon name="folder_open" size="lg" className="mx-auto text-text-muted" />
              <p className="mt-2 font-body-sm text-text-muted">هنوز پروژه‌ای نیست.</p>
              <Button variant="primary" size="sm" className="mt-3" onClick={openProjectModal}>
                اولین پروژه‌ات را بساز
              </Button>
            </div>
          )}
        </div>

        {selected ? (
          <DetailPane project={selected} onClose={() => setSelectedProjectId(null)} />
        ) : (
          <div className="rounded-xl border border-dashed border-border-precision p-6 text-center lg:sticky lg:top-20">
            <Icon name="left_panel_open" size="lg" className="mx-auto text-text-muted" />
            <p className="mt-3 font-body-sm text-text-secondary">
              یک پروژه را انتخاب کن تا تسک‌ها، پیشرفت و میان‌برها را ببینی.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: string;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="task-card flex items-center gap-3 rounded-xl p-4">
      <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl bg-surface-container", accent && "bg-primary-container/20")}>
        <Icon name={icon} size="md" className={accent ? "text-accent-glow" : "text-text-secondary"} />
      </span>
      <div>
        <div className="font-mono-metric text-2xl font-bold text-text-primary">{value}</div>
        <div className="font-label-xs text-text-muted">{label}</div>
      </div>
    </div>
  );
}