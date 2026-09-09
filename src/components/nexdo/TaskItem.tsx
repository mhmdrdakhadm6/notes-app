import { useEffect, useRef, useState } from "react";
import { cn, formatDueLabel, formatTimeReadable, isOverdue } from "../../utils/nexdo";
import { useNexdo } from "../../contexts/NexdoContext";
import { PRIORITY_META, type Task } from "../../types/nexdo";
import { Icon } from "./Icon";

function MoreMenu({ task }: { task: Task }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const {
    openEditTask,
    duplicateTask,
    archiveTask,
    deleteTask,
    toggleComplete,
    requestConfirm,
    pushToast,
  } = useNexdo();

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const action = (label: string, icon: string, color: string, fn: () => void) => (
    <button
      key={label}
      onClick={() => {
        setOpen(false);
        fn();
      }}
      className={cn(
        "flex w-full items-center gap-2.5 px-4 py-2 text-right font-body-sm transition-colors hover:bg-surface-container",
        color,
      )}
    >
      <Icon name={icon} size="sm" />
      {label}
    </button>
  );

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="icon-btn icon-btn-sm text-text-muted hover:bg-surface-container hover:text-text-primary"
        aria-label={`عملیات برای ${task.title}`}
      >
        <Icon name="more_horiz" size="xs" />
      </button>
      {open && (
        <div className="animate-dropdown absolute end-0 top-9 z-40 w-44 overflow-hidden rounded-xl bg-surface-card border border-border-precision shadow-soft">
          {task.status !== "completed" &&
            action("تکمیل", "check_circle", "text-text-secondary", () => toggleComplete(task.id))}
          {action("ویرایش", "edit", "text-text-secondary", () => openEditTask(task.id))}
          {action("کپی", "content_copy", "text-text-secondary", () => {
            duplicateTask(task.id);
            pushToast({ type: "success", title: "تسک کپی شد" });
          })}
          {task.status !== "archived" &&
            action("بایگانی", "archive", "text-text-secondary", () => {
              archiveTask(task.id);
              pushToast({ type: "info", title: "تسک بایگانی شد" });
            })}
          {action("حذف", "delete", "text-priority-urgent", () =>
            requestConfirm({
              title: "حذف تسک؟",
              message: `«${task.title}» برای همیشه حذف می‌شود.`,
              confirmLabel: "حذف تسک",
              danger: true,
              onConfirm: () => {
                deleteTask(task.id);
                pushToast({ type: "error", title: "تسک حذف شد", message: task.title });
              },
            }),
          )}
        </div>
      )}
    </div>
  );
}

export function TaskItem({
  task,
  onOpen,
  showProject = true,
  compact = false,
}: {
  task: Task;
  onOpen?: (task: Task) => void;
  showProject?: boolean;
  compact?: boolean;
}) {
  const { projects, toggleComplete, togglePin, openTaskDetails } = useNexdo();
  const project = task.projectId ? projects.find((p) => p.id === task.projectId) : null;
  const meta = PRIORITY_META[task.priority];
  const done = task.status === "completed";
  const overdue = isOverdue(task);

  return (
    <div
      className={cn(
        "task-card group flex items-center gap-3 rounded-xl p-3",
        compact && "p-2.5",
        done && "opacity-70",
      )}
    >
      <button
        onClick={() => toggleComplete(task.id)}
        className="relative mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-all"
        style={{
          border: `2px solid ${done ? "var(--color-accent-electric)" : meta.dot},
          `,
        }}
        aria-label={done ? "علامت‌گذاری به‌عنوان ناتمام" : "علامت‌گذاری کامل"}
      >
        {done ? (
          <span className="flex h-full w-full items-center justify-center rounded-full bg-accent-electric">
            <span className="text-[9px] text-white leading-none">✓</span>
          </span>
        ) : (
          <span className="h-1.5 w-1.5 rounded-full opacity-0 transition-opacity group-hover:opacity-100" 
            style={{ backgroundColor: "var(--color-outline)" }} />
        )}
      </button>

      <button
        onClick={() => {
          if (onOpen) onOpen(task);
          else openTaskDetails(task.id);
        }}
        className="min-w-0 flex-1 text-right"
      >
        <div
          className={cn(
            "truncate font-body-md font-medium transition-colors",
            done ? "text-text-muted line-through" : "text-text-primary group-hover:text-accent-glow",
          )}
        >
          {task.title}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
          {task.dueDate && !compact && (
            <span
              className={cn(
                "inline-flex items-center gap-1 font-label-xs",
                overdue ? "text-priority-urgent" : "text-text-muted",
              )}
            >
              <Icon name="schedule" size="xs" />
              {formatDueLabel(task.dueDate)}
              {task.dueTime && ` · ${formatTimeReadable(task.dueTime)}`}
            </span>
          )}
          {showProject && project && (
            <span
              className="inline-flex items-center gap-1 font-label-xs"
              style={{ color: `var(--color-${project.color})` }}
            >
              <Icon name={project.icon} size="xs" />
              {project.name}
            </span>
          )}
          {task.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="font-label-xs text-accent-glow/80">
              #{tag}
            </span>
          ))}
          {task.estimatedTime && !compact && (
            <span className="inline-flex items-center gap-1 font-label-xs text-text-muted">
              <Icon name="timelapse" size="xs" />
              {task.estimatedTime}
            </span>
          )}
        </div>
      </button>

      <div className="flex shrink-0 items-center gap-1">
        <span
          className={cn(
            "hidden h-2 w-2 rounded-full sm:block",
            meta.dot,
            done && "opacity-50",
          )}
          title={meta.label}
        />
        <button
          onClick={() => togglePin(task.id)}
          className={cn(
            "icon-btn icon-btn-slim text-text-muted hover:bg-surface-container hover:text-text-primary",
            task.pinned && "text-accent-glow",
          )}
          aria-label={task.pinned ? "حذف سنجاق" : "سنجاق تسک"}
        >
          <Icon name="push_pin" size="xs" filled={task.pinned} />
        </button>
        <MoreMenu task={task} />
      </div>
    </div>
  );
}