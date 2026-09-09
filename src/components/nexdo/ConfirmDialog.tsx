import { useNexdo } from "../../contexts/NexdoContext";
import { Button } from "./ui";
import { Icon } from "./Icon";

export function ConfirmDialog() {
  const { confirm, closeConfirm } = useNexdo();
  if (!confirm?.open) return null;

  const handleCancel = () => closeConfirm();
  const handleConfirm = () => {
    confirm.onConfirm?.();
    closeConfirm();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleCancel} />
      <div className="animate-modal-in relative w-full max-w-sm rounded-2xl border border-border-precision bg-surface-card p-5 shadow-soft">
        <span
          className={
            "flex h-11 w-11 items-center justify-center rounded-full " +
            (confirm.danger
              ? "bg-priority-urgent/15 text-priority-urgent"
              : "bg-primary-container/20 text-accent-glow")
          }
        >
          <Icon name={confirm.danger ? "delete" : "info"} size="md" filled />
        </span>
        <h3 className="mt-3 font-headline-sm text-text-primary">{confirm.title}</h3>
        {confirm.message && (
          <p className="mt-1 font-body-sm text-text-secondary">{confirm.message}</p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={handleCancel}>
            انصراف
          </Button>
          <Button
            variant={confirm.danger ? "danger" : "primary"}
            onClick={handleConfirm}
          >
            {confirm.confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}