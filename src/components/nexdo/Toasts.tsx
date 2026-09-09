import { cn } from "../../utils/nexdo";
import { useNexdo } from "../../contexts/NexdoContext";
import { Icon } from "./Icon";

const toneStyles: Record<string, string> = {
  success: "border-accent-electric/40 text-accent-glow",
  error: "border-priority-urgent/40 text-priority-urgent",
  info: "border-priority-low/40 text-priority-low",
};

const toneIcons: Record<string, string> = {
  success: "check_circle",
  error: "cancel",
  info: "info",
};

export function Toasts() {
  const { toasts, dismissToast } = useNexdo();

  return (
    <div className="pointer-events-none fixed inset-x-0 top-16 z-[70] flex flex-col items-center gap-2 px-4">
      {toasts.map((toast) => (
        <button
          key={toast.id}
          onClick={() => dismissToast(toast.id)}
          className={cn(
            "animate-dropdown pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border bg-surface-card px-4 py-3 text-right shadow-soft",
            toneStyles[toast.type] ?? toneStyles.info,
          )}
        >
          <span className="mt-0.5">
            <Icon name={toneIcons[toast.type] ?? toneIcons.info} size="sm" filled />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-body-sm font-semibold text-text-primary">{toast.title}</span>
            {toast.message && (
              <span className="block font-body-sm text-text-secondary">{toast.message}</span>
            )}
          </span>
          <Icon name="close" size="xs" className="mt-1 text-text-muted" />
        </button>
      ))}
    </div>
  );
}