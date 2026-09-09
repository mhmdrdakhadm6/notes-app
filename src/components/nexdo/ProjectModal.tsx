import { useEffect, useState } from "react";
import { cn } from "../../utils/nexdo";
import { useNexdo } from "../../contexts/NexdoContext";
import { Icon } from "./Icon";
import { FieldLabel } from "./TaskModal";

const colors = [
  "accent-electric",
  "priority-low",
  "priority-medium",
  "priority-high",
  "priority-urgent",
  "tertiary",
];

const icons = ["folder", "terminal", "school", "spa", "design_services", "rocket_launch", "checklist", "emoji_objects"];

export function ProjectModal() {
  const { projectModal, closeProjectModal, addProject, pushToast } = useNexdo();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("folder");
  const [color, setColor] = useState(colors[0]);
  const [category, setCategory] = useState("کار");
  const [deadline, setDeadline] = useState("");

  useEffect(() => {
    if (!projectModal) return;
    const id = window.setTimeout(() => {
      setName("");
      setDescription("");
      setIcon("folder");
      setColor(colors[0]);
      setCategory("کار");
      setDeadline("");
      document.getElementById("nexdo-project-name")?.focus();
    }, 0);
    return () => window.clearTimeout(id);
  }, [projectModal]);

  if (!projectModal) return null;

  const save = () => {
    if (!name.trim()) {
      pushToast({ type: "error", title: "نام پروژه الزامی است" });
      return;
    }
    const project = addProject({
      name: name.trim(),
      description: description.trim(),
      icon,
      color,
      category,
      deadline: deadline || null,
    });
    pushToast({ type: "success", title: "پروژه ساخته شد", message: project.name });
    closeProjectModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeProjectModal} />
      <div className="animate-modal-in relative w-full max-w-md rounded-2xl border border-border-precision bg-surface-card shadow-soft">
        <header className="flex items-center justify-between border-b border-border-precision px-5 py-4">
          <div>
            <h2 className="font-headline-sm text-text-primary">ایجاد پروژه</h2>
            <p className="font-label-xs text-text-muted">تسک‌های مرتبط را کنار هم بگذار</p>
          </div>
          <button onClick={closeProjectModal} className="icon-btn icon-btn-sm text-text-muted hover:bg-surface-container" aria-label="بستن">
            <Icon name="close" size="sm" />
          </button>
        </header>

        <div className="space-y-4 px-5 py-4">
          <div>
            <FieldLabel>آیکون</FieldLabel>
            <div className="flex flex-wrap gap-1.5">
              {icons.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setIcon(ic)}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg border transition-colors",
                    icon === ic
                      ? "border-primary-container bg-primary-container/20 text-accent-glow"
                      : "border-border-precision text-text-muted hover:border-outline-variant",
                  )}
                >
                  <Icon name={ic} size="sm" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <FieldLabel required>نام پروژه</FieldLabel>
            <input
              id="nexdo-project-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثلاً اپ موبایل"
              className="text-field h-10 w-full px-3 font-body-md"
            />
          </div>

          <div>
            <FieldLabel>توضیحات</FieldLabel>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="این پروژه درباره چیست؟"
              className="text-field w-full resize-none px-3 py-2.5 font-body-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>دسته‌بندی</FieldLabel>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="text-field h-10 w-full px-2.5 font-body-sm">
                {["کار", "دانشگاه", "شخصی", "سفارشی"].map((c) => (
                  <option key={c} className="bg-surface-card">{c}</option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel>مهلت</FieldLabel>
              <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="text-field h-10 w-full px-3 font-body-sm" />
            </div>
          </div>

          <div>
            <FieldLabel>رنگ برجسته</FieldLabel>
            <div className="flex flex-wrap gap-1.5">
              {colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  aria-label={c}
                  className={cn(
                    "h-7 w-7 rounded-full border-2 transition-transform",
                    color === c ? "scale-110 border-white/70" : "border-transparent",
                  )}
                  style={{ backgroundColor: `var(--color-${c})` }}
                />
              ))}
            </div>
          </div>
        </div>

        <footer className="flex justify-end gap-2 border-t border-border-precision px-5 py-3.5">
          <button onClick={closeProjectModal} className="rounded-full px-4 py-2 font-label-xs font-bold uppercase tracking-wide text-text-muted hover:text-text-primary">
            انصراف
          </button>
          <button onClick={save} className="flex items-center gap-2 rounded-full bg-primary-container px-5 py-2 font-label-xs font-bold uppercase tracking-wide text-on-primary-container hover:bg-accent-electric">
            <Icon name="add" size="xs" filled /> ایجاد
          </button>
        </footer>
      </div>
    </div>
  );
}