import { useRef, useState } from "react";
import { cn } from "../../utils/nexdo";
import { useNexdo } from "../../contexts/NexdoContext";
import type { Page } from "../../types/nexdo";
import { Icon } from "./Icon";

const items: Array<{ page: Page; label: string; icon: string }> = [
  { page: "dashboard", label: "خانه", icon: "space_dashboard" },
  { page: "tasks", label: "وظایف", icon: "check_circle" },
];
const rightItems: Array<{ page: Page; label: string; icon: string }> = [
  { page: "calendar", label: "تقویم", icon: "calendar_month" },
  { page: "projects", label: "پروژه‌ها", icon: "folder_open" },
];

const OPEN_DIST = 220;
const HANDLE_TRAVEL = 210;
const SNAP = 0.38;
const MIN_MOVE = 6;
const SPRING = "transform 640ms cubic-bezier(0.22, 1.15, 0.36, 1)";
const LIVE = "transform 70ms linear";

function NavBtn({
  item,
  onPress,
}: {
  item: { page: Page; label: string; icon: string };
  onPress?: () => void;
}) {
  const { page, setPage } = useNexdo();
  const active = page === item.page;
  return (
    <button
      onClick={() => {
        setPage(item.page);
        onPress?.();
      }}
      className="group flex flex-1 flex-col items-center justify-center gap-1 rounded-xl py-1 transition-transform active:scale-95"
    >
      <span
        className={cn(
          "relative flex h-9 w-12 items-center justify-center rounded-full transition-all duration-300",
          active
            ? "bg-primary-container text-on-primary-container shadow-[0_5px_16px_rgba(37,99,235,0.45)]"
            : "text-text-muted group-hover:text-text-secondary",
        )}
      >
        {active && (
          <span className="absolute inset-0 -z-10 rounded-full bg-primary-container blur-md opacity-50" />
        )}
        <Icon name={item.icon} size="md" filled={active} />
      </span>
      <span
        className={cn(
          "text-[10px] font-semibold leading-3",
          active ? "text-accent-glow" : "text-text-muted",
        )}
      >
        {item.label}
      </span>
      <span
        className={cn(
          "h-1 w-1 rounded-full transition-all duration-300",
          active ? "bg-accent-glow shadow-[0_0_6px_rgba(96,165,250,0.9)]" : "bg-transparent",
        )}
      />
    </button>
  );
}

function CreateTaskBtn({ onPress }: { onPress?: () => void }) {
  const { openCreateTask } = useNexdo();
  return (
    <button
      onClick={() => {
        openCreateTask();
        onPress?.();
      }}
      aria-label="ایجاد تسک جدید"
      className="group flex flex-1 flex-col items-center justify-center gap-1 rounded-xl py-1 transition-transform active:scale-95"
    >
      <span className="relative flex h-12 w-12 items-center justify-center">
        <span aria-hidden className="mnav-aura" />
        <span aria-hidden className="mnav-aura mnav-aura-rev" />
        <span aria-hidden className="mnav-ping" />
        <span
          aria-hidden
          className="mnav-spin absolute -inset-[3px] rounded-full border border-dashed border-white/20"
        />
        <span className="mnav-core relative flex h-12 w-12 items-center justify-center rounded-full text-on-primary-container shadow-[0_6px_20px_rgba(37,99,235,0.5),inset_0_1px_0_rgba(255,255,255,0.25)] ring-1 ring-white/25 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 group-active:scale-90">
          <Icon
            name="add"
            size="lg"
            filled
            className="transition-transform duration-500 group-hover:rotate-90"
          />
        </span>
      </span>
      <span className="text-[10px] font-semibold leading-3 text-text-muted">جدید</span>
      <span className="h-1 w-1 rounded-full bg-transparent" />
    </button>
  );
}

export function MobileNav() {
  const { user } = useNexdo();
  const [open, setOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const grabRef = useRef<{ startX: number; moved: boolean } | null>(null);
  const liveRef = useRef(0);

  if (!user) return null;

  const close = () => {
    setOpen(false);
    setProgress(0);
  };

  const handleDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    grabRef.current = { startX: e.clientX, moved: false };
    setDragging(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* noop */
    }
  };

  const handleMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const g = grabRef.current;
    if (!g) return;
    const dx = e.clientX - g.startX;
    if (Math.abs(dx) > MIN_MOVE) g.moved = true;
    const base = open ? 1 : 0;
    const next = Math.max(0, Math.min(1, base + dx / OPEN_DIST));
    liveRef.current = next;
    setProgress(next);
  };

  const handleUp = () => {
    const g = grabRef.current;
    if (!g) {
      setDragging(false);
      return;
    }
    grabRef.current = null;
    setDragging(false);
    const live = liveRef.current;

    if (!g.moved) {
      setProgress(0);
      return;
    }

    if (open) {
      if (live < 1 - SNAP) close();
      else {
        setOpen(true);
        setProgress(1);
      }
    } else if (live > SNAP) {
      setOpen(true);
      setProgress(1);
    } else {
      setProgress(0);
    }
  };

  const display = dragging ? progress : open ? 1 : 0;
  const fade = open ? 0 : 1 - Math.max(0, (progress - 0.55) / 0.45);

  return (
    <>
      <nav
        aria-hidden={!open}
        className="pointer-events-none fixed inset-x-3 bottom-3 z-40 lg:hidden"
        style={{
          transform: `translateX(${(1 - display) * 101}%)`,
          transition: dragging ? LIVE : SPRING,
          pointerEvents: open ? "auto" : "none",
        }}
      >
        <div className="relative mx-auto flex max-w-md items-stretch gap-0.5 overflow-hidden rounded-[1.6rem] border border-white/10 bg-gradient-to-b from-surface-card/85 to-surface-container-lowest/95 px-1.5 py-1.5 shadow-[0_-6px_30px_rgba(0,0,0,0.35),0_10px_28px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.07)] backdrop-blur-2xl backdrop-saturate-150 pb-[calc(0.45rem+env(safe-area-inset-bottom))]">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent"
          />
          {open && (
            <span
              key="sweep"
              aria-hidden
              className="mnav-dock-sweep absolute top-0 bottom-0 w-1/2 bg-gradient-to-r from-transparent via-white/12 to-transparent"
            />
          )}
          {items.map((item) => (
            <NavBtn key={item.page} item={item} onPress={close} />
          ))}
          <CreateTaskBtn onPress={close} />
          {rightItems.map((item) => (
            <NavBtn key={item.page} item={item} onPress={close} />
          ))}
        </div>
      </nav>

      <button
        type="button"
        aria-label={open ? "ناوبار موبایل باز است" : "باز کردن ناوبار موبایل با کشیدن به راست"}
        aria-expanded={open}
        aria-hidden={open}
        onPointerDown={handleDown}
        onPointerMove={handleMove}
        onPointerUp={handleUp}
        onPointerCancel={handleUp}
        style={{
          touchAction: "none",
          transform: `translateX(${display * HANDLE_TRAVEL}px) scale(${0.4 + 0.6 * fade})`,
          opacity: fade,
          visibility: open ? "hidden" : "visible",
          pointerEvents: open ? "none" : "auto",
          transition: dragging ? "none" : "opacity 300ms ease",
        }}
        className="group fixed bottom-16 left-5 z-40 flex h-12 w-12 cursor-grab touch-none select-none items-center justify-center rounded-full border border-white/15 bg-surface-card/90 shadow-[0_8px_24px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-2xl active:cursor-grabbing lg:hidden"
      >
        <Icon
          name="chevron_right"
          size="md"
          className="text-text-muted"
        />
      </button>
    </>
  );
}