import { useMemo, useState } from "react";
import { cn, compareByDue, faJMonthYear, faLongDate, toDateKey } from "../../utils/nexdo";
import { jalaliMonthCells, jalaliMonthStartOffset, keyForJalaliDay, toJalali } from "../../utils/persianDate";
import { useNexdo } from "../../contexts/NexdoContext";
import type { Task } from "../../types/nexdo";
import { PRIORITY_META } from "../../types/nexdo";
import { Icon } from "./Icon";
import { TaskItem } from "./TaskItem";
import { Badge } from "./ui";

export function CalendarPage() {
  const { tasks, openEditTask } = useNexdo();
  const [cursor, setCursor] = useState(() => {
    const j = toJalali(new Date());
    return { jy: j.jy, jm: j.jm };
  });
  const [selectedKey, setSelectedKey] = useState(toDateKey(new Date()));

  const dayTasks = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of tasks) {
      if (!task.dueDate || task.status === "archived") continue;
      if (!map.has(task.dueDate)) map.set(task.dueDate, []);
      map.get(task.dueDate)!.push(task);
    }
    if (map.has(selectedKey)) {
      map.set(selectedKey, map.get(selectedKey)!.sort(compareByDue));
    }
    return map;
  }, [tasks, selectedKey]);

  const today = toJalali(new Date());
  const firstWeekday = jalaliMonthStartOffset(cursor.jy, cursor.jm);
  const days = useMemo(() => jalaliMonthCells(cursor.jy, cursor.jm), [cursor.jy, cursor.jm]);
  const todayKeyNow = toDateKey(new Date());

  const prev = () => {
    const { jy, jm } = cursor;
    setCursor(jm === 1 ? { jy: jy - 1, jm: 12 } : { jy, jm: jm - 1 });
  };
  const next = () => {
    const { jy, jm } = cursor;
    setCursor(jm === 12 ? { jy: jy + 1, jm: 1 } : { jy, jm: jm + 1 });
  };

  const selectedTasks = dayTasks.get(selectedKey) ?? [];

  return (
    <div className="animate-fade-in p-4 lg:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-headline-lg text-text-primary">تقویم</h2>
          <p className="font-body-sm text-text-muted">
            {faJMonthYear(cursor.jy, cursor.jm)}
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-surface-intermediate p-1">
          <button onClick={prev} className="icon-btn icon-btn-sm text-text-muted hover:text-text-primary" aria-label="ماه قبل">
            <Icon name="chevron_right" size="xs" />
          </button>
          <button
            onClick={() => {
              setCursor({ jy: today.jy, jm: today.jm });
              setSelectedKey(toDateKey(new Date()));
            }}
            className="rounded-full px-3 py-1 font-label-xs font-semibold text-text-secondary hover:text-text-primary"
          >
            امروز
          </button>
          <button onClick={next} className="icon-btn icon-btn-sm text-text-muted hover:text-text-primary" aria-label="ماه بعد">
            <Icon name="chevron_left" size="xs" />
          </button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="task-card rounded-xl p-4">
          <div className="grid grid-cols-7 gap-1 text-center">
            {["ش", "ی", "د", "س", "چ", "پ", "ج"].map((d) => (
              <span key={d} className="py-1 font-label-xs font-bold uppercase tracking-wide text-text-muted">
                {d}
              </span>
            ))}
            {Array.from({ length: firstWeekday }).map((_, i) => (
              <span key={`p-${i}`} />
            ))}
            {days.map(({ jd }) => {
              const key = keyForJalaliDay(cursor.jy, cursor.jm, jd);
              const list = dayTasks.get(key) ?? [];
              const isSelected = key === selectedKey;
              const isToday = key === todayKeyNow;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedKey(key)}
                  className={cn(
                    "relative m-0.5 flex h-11 flex-col items-center justify-center rounded-xl border font-mono-metric text-sm transition-colors md:h-14",
                    isSelected
                      ? "border-primary-container bg-primary-container/20 text-text-primary"
                      : isToday
                        ? "border-accent-electric/40 text-accent-glow"
                        : "border-transparent text-text-secondary hover:bg-surface-container",
                  )}
                >
                  {jd}
                  <span className="mt-0.5 flex gap-0.5">
                    {list.slice(0, 3).map((t) => (
                      <span key={t.id} className={cn("h-1 w-1 rounded-full", PRIORITY_META[t.priority].dot)} />
                    ))}
                  </span>
                  {list.length > 3 && (
                    <span className="absolute end-1 top-1 rounded-full bg-surface-container px-1 font-label-xl text-[9px] text-text-muted">
                      +{list.length - 3}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-headline-sm text-text-primary">
              {faLongDate(new Date(selectedKey + "T00:00:00"))}
            </h3>
            <Badge>{selectedTasks.length}</Badge>
          </div>
          <div className="space-y-2">
            {selectedTasks.map((task) => (
              <TaskItem key={task.id} task={task} />
            ))}
            {selectedTasks.length === 0 && (
              <div className="rounded-xl border border-dashed border-border-precision py-6 text-center font-body-sm text-text-muted">
                در این روز تسکی نیست.
              </div>
            )}
          </div>
          {selectedTasks.length > 0 && (
            <button
              onClick={() => openEditTask(selectedTasks[0].id)}
              className="w-full rounded-full border border-border-precision py-2 font-label-xs font-bold uppercase tracking-wide text-text-muted hover:text-text-primary"
            >
              ویرایش اولین تسک
            </button>
          )}
        </div>
      </div>
    </div>
  );
}