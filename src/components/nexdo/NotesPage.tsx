import Notes from "../Notes";
import { useNexdo } from "../../contexts/NexdoContext";
import { Icon } from "./Icon";

export function NotesPage() {
  const { pushToast } = useNexdo();

  return (
    <div className="animate-fade-in p-4 lg:p-6">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-headline-lg text-text-primary">یادداشت‌ها</h2>
            <span className="flex items-center gap-1 rounded-full bg-primary-container/20 px-2.5 py-1 font-label-xs font-semibold text-accent-glow">
              <Icon name="smart_toy" size="xs" filled />
              با هوش مصنوعی
            </span>
          </div>
          <p className="mt-0.5 font-body-sm text-text-muted">
            اپ یادداشت تو با چت هوش مصنوعی و ضبط صدا، درست داخل فضای کاری.
          </p>
        </div>
        <button
          onClick={() => pushToast({ type: "info", title: "یادداشت صوتی", message: "داخل پنل یادداشت‌ها، از آیکون میکروفون استفاده کن." })}
          className="flex h-9 items-center gap-2 rounded-full border border-border-precision px-4 font-label-xs font-bold uppercase tracking-wide text-text-secondary hover:text-text-primary"
        >
          <Icon name="mic" size="sm" />
          یادداشت صوتی
        </button>
      </header>
      <Notes />
    </div>
  );
}