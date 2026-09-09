import { useEffect, useMemo, useState } from "react";
import { cn } from "../../utils/nexdo";
import { useNexdo } from "../../contexts/NexdoContext";
import {
  PRIORITY_META,
  type Task,
  type TaskPriority,
} from "../../types/nexdo";
import { Icon } from "./Icon";

const priorities: TaskPriority[] = ["low", "medium", "high", "urgent"];

const reminders = [
  "در زمان سررسید",
  "۱۰ دقیقه قبل",
  "۱۵ دقیقه قبل",
  "۳۰ دقیقه قبل",
  "۱ ساعت قبل",
  "۱ روز قبل",
];

const recurrences = [
  "بدون تکرار",
  "روزانه",
  "هفتگی",
  "ماهانه",
  "روزهای کاری",
  "سفارشی",
];

function Toggle({ label, icon, checked, onChange }: { label: string; icon: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2 font-body-sm text-text-secondary"
    >
      <span
        className={cn(
          "flex h-6 w-6 items-center justify-center rounded-lg border transition-colors",
          checked
            ? "border-primary-container bg-primary-container text-on-primary-container"
            : "border-border-precision text-transparent",
        )}
      >
        <Icon name="check" size="xs" />
      </span>
      <Icon name={icon} size="sm" className="text-text-muted" />
      {label}
    </button>
  );
}

export function FieldLabel({ children, required }: { children: string; required?: boolean }) {
  return (
    <label className="mb-1.5 block font-label-xs font-bold uppercase tracking-wide text-text-muted">
      {children}
      {required && <span className="text-priority-urgent"> *</span>}
    </label>
  );
}

export function TaskModal() {
  const {
    taskModal,
    closeTaskModal,
    addTask,
    updateTask,
    projects,
    tags,
    addTag,
    pushToast,
  } = useNexdo();
  const { open, task, prefill } = taskModal;
  const isEdit = task !== null;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [reminder, setReminder] = useState("۳۰ دقیقه قبل");
  const [recurrence, setRecurrence] = useState("بدون تکرار");
  const [estimatedTime, setEstimatedTime] = useState("45m");
  const [notify, setNotify] = useState(true);
  const [addToCalendar, setAddToCalendar] = useState(true);
  const [newTag, setNewTag] = useState("");

  useEffect(() => {
    if (!open) return;
    const source = task ?? prefill ?? {};
    const id = window.setTimeout(() => {
      setTitle(source.title ?? "");
      setDescription(source.description ?? "");
      setPriority(source.priority ?? "medium");
      setDueDate(source.dueDate ?? "");
      setDueTime(source.dueTime ?? "");
      setProjectId(source.projectId ?? null);
      setSelectedTags(source.tags ?? []);
      setReminder(source.reminder ?? "۳۰ دقیقه قبل");
      setRecurrence(source.recurrence ?? "بدون تکرار");
      setEstimatedTime(source.estimatedTime ?? "45m");
      setNewTag("");
    }, 0);
    return () => window.clearTimeout(id);
  }, [open, task, prefill]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      document.getElementById("nexdo-task-title")?.focus();
    }, 40);
    return () => window.clearTimeout(timer);
  }, [open]);

  const activeProjects = useMemo(() => projects.filter((p) => !p.archived), [projects]);

  if (!open) return null;

  const toggleTag = (name: string) => {
    setSelectedTags((prev) =>
      prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name],
    );
  };

  const submitNewTag = () => {
    const tag = addTag(newTag);
    if (tag && !selectedTags.includes(tag.name)) {
      setSelectedTags((prev) => [...prev, tag.name]);
    }
    setNewTag("");
  };

  const save = () => {
    if (!title.trim()) {
      pushToast({ type: "error", title: "عنوان اجباری است", message: "برای تسک یک عنوان بگذار." });
      return;
    }
    const payload: Partial<Task> = {
      title: title.trim(),
      description: description.trim(),
      priority,
      dueDate: dueDate || null,
      dueTime: dueTime || null,
      projectId,
      tags: selectedTags,
      reminder,
      recurrence,
      estimatedTime: estimatedTime || "45m",
    };
    if (isEdit && task) {
      updateTask(task.id, payload);
      pushToast({ type: "success", title: "تسک به‌روزرسانی شد", message: title.trim() });
    } else {
      addTask(payload);
      pushToast({ type: "success", title: "تسک ساخته شد", message: `به ${projects.find((p) => p.id === projectId)?.name ?? "صندوق ورودی"} اضافه شد` });
    }
    closeTaskModal();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.target as HTMLElement).tagName === "INPUT" && e.target !== document.querySelector("input[type='date'], input[type='time']")) {
      e.preventDefault();
      save();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeTaskModal} />
      <div
        onKeyDown={handleKeyDown}
        className="animate-modal-in nexdo-task-card relative flex max-h-[92dvh] w-full flex-col rounded-t-2xl border border-border-precision bg-surface-card shadow-soft sm:max-w-lg sm:rounded-2xl"
      >
        <header className="flex items-center justify-between border-b border-border-precision px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-container text-on-primary-container">
              <Icon name={isEdit ? "edit_square" : "add_task"} size="sm" filled />
            </span>
            <div>
              <h2 className="font-headline-sm text-text-primary">
                {isEdit ? "ویرایش تسک" : "ایجاد تسک جدید"}
              </h2>
              <p className="font-label-xs text-text-muted">
                {isEdit ? "جزئیات تسک را به‌روزرسانی کنید" : "همه‌چیز را در یک جا ثبت کنید"}
              </p>
            </div>
          </div>
          <button onClick={closeTaskModal} className="icon-btn icon-btn-sm text-text-muted hover:bg-surface-container hover:text-text-primary" aria-label="بستن">
            <Icon name="close" size="sm" />
          </button>
        </header>

        <div className="space-y-4 overflow-y-auto px-5 py-4">
          <div>
            <FieldLabel required>عنوان تسک</FieldLabel>
            <input
              id="nexdo-task-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثلاً ارسال هات‌فیکس v2.4 به سرویس آنلاین"
              className="text-field h-10 w-full px-3 font-body-md"
            />
          </div>

          <div>
            <FieldLabel>توضیحات</FieldLabel>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="زمینه، معیار پذیرش یا لینک‌ها را اینجا بنویس…"
              rows={3}
              className="text-field w-full resize-none px-3 py-2.5 font-body-sm"
            />
          </div>

          <div>
            <FieldLabel>اولویت</FieldLabel>
            <div className="grid grid-cols-4 gap-1.5">
              {priorities.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-lg border py-2 font-label-xs font-semibold transition-colors",
                    priority === p
                      ? "border-primary-container bg-primary-container/15 text-text-primary"
                      : "border-border-precision text-text-muted hover:border-outline-variant",
                  )}
                >
                  <span className={cn("h-2 w-2 rounded-full", PRIORITY_META[p].dot)} />
                  {PRIORITY_META[p].label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>تاریخ سررسید</FieldLabel>
              <input
                id="nexdo-task-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="text-field h-10 w-full px-3 font-body-sm"
              />
            </div>
            <div>
              <FieldLabel>ساعت سررسید</FieldLabel>
              <input
                id="nexdo-task-time"
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="text-field h-10 w-full px-3 font-body-sm"
              />
            </div>
          </div>

          <div>
            <FieldLabel>پروژه</FieldLabel>
            <div className="grid grid-cols-2 gap-1.5">
              {activeProjects.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => setProjectId(projectId === project.id ? null : project.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-2.5 py-2 text-right font-body-sm transition-colors",
                    projectId === project.id
                      ? "border-primary-container bg-primary-container/15 text-text-primary"
                      : "border-border-precision text-text-muted hover:border-outline-variant",
                  )}
                >
                  <Icon name={project.icon} size="sm" style={{ color: `var(--color-${project.color})` }} />
                  {project.name}
                </button>
              ))}
              {activeProjects.length === 0 && (
                <div className="col-span-2 font-label-xs text-text-muted">
                  اول یک پروژه بساز یا این تسک را در صندوق ورودی نگه دار.
                </div>
              )}
            </div>
          </div>

          <div>
            <FieldLabel>برچسب‌ها</FieldLabel>
            <div className="flex flex-wrap items-center gap-1.5">
              {tags
                .map((t) => t.name)
                .concat(selectedTags.filter((t) => !tags.some((x) => x.name === t)))
                .filter((v, i, arr) => arr.indexOf(v) === i)
                .map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => toggleTag(name)}
                    className={cn(
                      "rounded-full border px-2.5 py-1 font-label-xs transition-colors",
                      selectedTags.includes(name)
                        ? "border-primary-container bg-primary-container/20 text-accent-glow"
                        : "border-border-precision text-text-muted hover:text-text-secondary",
                    )}
                  >
                    #{name}
                  </button>
                ))}
              <div className="relative">
                <input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      submitNewTag();
                    }
                  }}
                  placeholder="+ افزودن برچسب"
                  className="w-24 bg-transparent font-label-xs text-accent-glow placeholder:text-text-muted focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>یادآوری</FieldLabel>
              <select
                value={reminder}
                onChange={(e) => setReminder(e.target.value)}
                className="text-field h-10 w-full px-2.5 font-body-sm"
              >
                {reminders.map((r) => (
                  <option key={r} value={r} className="bg-surface-card">{r}</option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel>تکرار</FieldLabel>
              <select
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value)}
                className="text-field h-10 w-full px-2.5 font-body-sm"
              >
                {recurrences.map((r) => (
                  <option key={r} value={r} className="bg-surface-card">{r}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <FieldLabel>زمان تخمینی</FieldLabel>
            <input
              value={estimatedTime}
              onChange={(e) => setEstimatedTime(e.target.value)}
              placeholder="مثلاً ۱.۵س، ۴۵د، ۲ر"
              className="text-field h-10 w-full px-3 font-body-md"
            />
          </div>

          <div className="flex flex-wrap gap-4 border-t border-border-precision pt-3">
            <Toggle label="اعلان به من" icon="notifications_active" checked={notify} onChange={setNotify} />
            <Toggle label="افزودن به تقویم" icon="calendar_month" checked={addToCalendar} onChange={setAddToCalendar} />
          </div>
        </div>

        <footer className="flex items-center justify-between gap-2 border-t border-border-precision px-5 py-3.5">
          <button onClick={closeTaskModal} className="rounded-full px-4 py-2 font-label-xs font-bold uppercase tracking-wide text-text-muted hover:text-text-primary">
            انصراف
          </button>
          <div className="flex items-center gap-2">
            {isEdit && (
              <span className="font-label-xs text-text-muted">برای ذخیره <kbd className="rounded border border-border-precision bg-surface-container px-1">Enter</kbd> را بزنید</span>
            )}
            <button
              onClick={save}
              className="flex items-center gap-2 rounded-full bg-primary-container px-5 py-2 font-label-xs font-bold uppercase tracking-wide text-on-primary-container hover:bg-accent-electric"
            >
              <Icon name="check" size="xs" filled />
              {isEdit ? "ذخیره تغییرات" : "ایجاد تسک"}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}