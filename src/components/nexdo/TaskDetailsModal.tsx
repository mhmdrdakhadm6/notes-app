import { useMemo } from "react";
import { cn, faLongDate, formatTimeReadable, isOverdue, parseDueDate } from "../../utils/nexdo";
import { useNexdo } from "../../contexts/NexdoContext";
import { PRIORITY_META } from "../../types/nexdo";
import { Icon } from "./Icon";

function Row({
  icon,
  label,
  tone,
  children,
}: {
  icon: string;
  label: string;
  tone?: "urgent" | "ok" | "accent";
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <span className="flex shrink-0 items-center gap-2 font-label-xs font-bold uppercase tracking-wide text-text-muted">
        <Icon name={icon} size="xs" className="text-text-muted" />
        {label}
      </span>
      <span
        className={cn(
          "min-w-0 text-right font-body-sm",
          tone === "urgent"
            ? "font-semibold text-priority-urgent"
            : tone === "ok"
              ? "font-semibold text-accent-glow"
              : tone === "accent"
                ? "font-semibold text-accent-glow"
                : "text-text-primary",
        )}
      >
        {children}
      </span>
    </div>
  );
}

export function TaskDetailsModal() {
  const {
    taskDetails,
    closeTaskDetails,
    openEditTask,
    tasks,
    projects,
    toggleComplete,
    duplicateTask,
    archiveTask,
    deleteTask,
    requestConfirm,
    pushToast,
  } = useNexdo();
  const task = useMemo(
    () => tasks.find((t) => t.id === taskDetails.taskId) ?? null,
    [tasks, taskDetails.taskId],
  );

  if (!taskDetails.open || !task) return null;

  const project = task.projectId ? projects.find((p) => p.id === task.projectId) : null;
  const meta = PRIORITY_META[task.priority];
  const done = task.status === "completed";
  const overdue = isOverdue(task);
  const dueDate = task.dueDate ? parseDueDate(task.dueDate) : null;
  const dueLabel = done
    ? "تکمیل‌شده"
    : task.dueDate === null
      ? "بدون سررسید"
      : overdue
        ? "عقب‌افتاده"
        : "در موعد";

  const edit = () => {
    closeTaskDetails();
    openEditTask(task.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeTaskDetails} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="nexdo-task-details-title"
        className="animate-modal-in nexdo-task-card relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl border border-border-precision bg-surface-card shadow-soft sm:max-w-lg sm:rounded-2xl"
      >
        <header className="flex items-start justify-between gap-3 border-b border-border-precision px-5 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-container text-on-primary-container">
                <Icon name={done ? "task_alt" : meta.label === "فوری" ? "priority_high" : "task_alt"} size="sm" filled />
              </span>
              <div className="min-w-0">
                <h2 id="nexdo-task-details-title" className="truncate font-headline-sm text-text-primary">
                  {task.title}
                </h2>
                <p className={cn("font-label-xs", overdue ? "text-priority-urgent" : "text-text-muted")}>
                  {dueLabel}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={closeTaskDetails}
            className="icon-btn icon-btn-sm shrink-0 text-text-muted hover:bg-surface-container hover:text-text-primary"
            aria-label="بستن"
          >
            <Icon name="close" size="sm" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-1">
          {task.description && (
            <div className="border-b border-border-precision py-3">
              <div className="mb-1 font-label-xs font-bold uppercase tracking-wide text-text-muted">توضیحات</div>
              <p className="whitespace-pre-wrap font-body-sm leading-relaxed text-text-secondary">{task.description}</p>
            </div>
          )}

          <div className="divide-y divide-border-precision">
            <Row icon="flag" label="اولویت">
              <span className="inline-flex items-center gap-1.5">
                <span className={cn("h-2 w-2 rounded-full", meta.dot)} />
                <span className={cn("font-semibold", meta.text)}>{meta.label}</span>
              </span>
            </Row>
            <Row icon="schedule" label="سررسید" tone={overdue ? "urgent" : undefined}>
              {dueDate ? (
                <>
                  {faLongDate(dueDate)}
                  {task.dueTime && <> · {formatTimeReadable(task.dueTime)}</>}
                </>
              ) : (
                "بدون سررسید"
              )}
            </Row>
            <Row icon="folder" label="پروژه">
              {project ? (
                <span className="inline-flex items-center gap-1.5" style={{ color: `var(--color-${project.color})` }}>
                  <Icon name={project.icon} size="xs" />
                  {project.name}
                </span>
              ) : (
                <span className="text-text-muted">صندوق ورودی</span>
              )}
            </Row>
            {task.tags.length > 0 && (
              <Row icon="sell" label="برچسب‌ها">
                <span className="flex flex-wrap justify-end gap-1.5">
                  {task.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-surface-container px-2.5 py-0.5 font-label-xs text-accent-glow">
                      #{tag}
                    </span>
                  ))}
                </span>
              </Row>
            )}
            <Row icon="notifications_active" label="یادآوری">
              {task.reminder}
            </Row>
            <Row icon="repeat" label="تکرار">
              {task.recurrence}
            </Row>
            <Row icon="timelapse" label="زمان تخمینی">
              {task.estimatedTime}
            </Row>
            <Row icon="push_pin" label="سنجاق‌شده" tone={task.pinned ? "ok" : undefined}>
              {task.pinned ? "بله" : "خیر"}
            </Row>
          </div>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-border-precision px-5 py-3.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => {
                toggleComplete(task.id);
                pushToast({
                  type: done ? "info" : "success",
                  title: done ? "بازگشت به ناتمام" : "تسک تکمیل شد",
                });
              }}
              className="flex items-center gap-1.5 rounded-full border border-border-precision px-3 py-2 font-label-xs font-bold uppercase tracking-wide text-text-secondary hover:border-accent-glow/60 hover:text-accent-glow"
            >
              <Icon name={done ? "undo" : "check_circle"} size="xs" filled={!done} />
              {done ? "بازگشت" : "تکمیل"}
            </button>
            <button
              onClick={() => {
                duplicateTask(task.id);
                pushToast({ type: "success", title: "تسک کپی شد" });
              }}
              className="flex items-center gap-1.5 rounded-full border border-border-precision px-3 py-2 font-label-xs font-bold uppercase tracking-wide text-text-secondary hover:text-text-primary"
            >
              <Icon name="content_copy" size="xs" />
              کپی
            </button>
            {task.status !== "archived" && (
              <button
                onClick={() => {
                  archiveTask(task.id);
                  closeTaskDetails();
                  pushToast({ type: "info", title: "تسک بایگانی شد" });
                }}
                className="flex items-center gap-1.5 rounded-full border border-border-precision px-3 py-2 font-label-xs font-bold uppercase tracking-wide text-text-secondary hover:text-text-primary"
              >
                <Icon name="archive" size="xs" />
                بایگانی
              </button>
            )}
            <button
              onClick={() =>
                requestConfirm({
                  title: "حذف تسک؟",
                  message: `«${task.title}» برای همیشه حذف می‌شود.`,
                  confirmLabel: "حذف تسک",
                  danger: true,
                  onConfirm: () => {
                    deleteTask(task.id);
                    closeTaskDetails();
                    pushToast({ type: "error", title: "تسک حذف شد", message: task.title });
                  },
                })
              }
              className="flex items-center gap-1.5 rounded-full border border-priority-urgent/30 px-3 py-2 font-label-xs font-bold uppercase tracking-wide text-priority-urgent hover:bg-priority-urgent/10"
            >
              <Icon name="delete" size="xs" />
              حذف
            </button>
          </div>

          <button
            onClick={edit}
            className="flex items-center gap-2 rounded-full bg-primary-container px-5 py-2 font-label-xs font-bold uppercase tracking-wide text-on-primary-container hover:bg-accent-electric"
          >
            <Icon name="edit_square" size="xs" filled />
            ویرایش
          </button>
        </footer>
      </div>
    </div>
  );
}