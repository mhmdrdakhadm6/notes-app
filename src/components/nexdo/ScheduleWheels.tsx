import { useEffect, useRef } from "react";
import { cn, faDigits, faToEn, PERSIAN_MONTHS } from "../../utils/nexdo";
import { daysInJalaliMonth, toJalali } from "../../utils/persianDate";

const ITEM_H = 40;
const VIEW_ITEMS = 5;
const PAD = (VIEW_ITEMS * ITEM_H - ITEM_H) / 2;

export interface JalaliClock {
  jy: number;
  jm: number;
  jd: number;
  hh: number;
  mm: number;
}

function WheelColumn({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const idx = optionsRef.current.indexOf(value);
    if (idx < 0) return;
    const target = idx * ITEM_H;
    if (Math.abs(el.scrollTop - target) > 4) el.scrollTop = target;
  }, [value]);

  return (
    <div className={cn("flex w-full min-w-0 flex-col items-center")}>
      <span className="h-5 truncate font-label-xs font-bold uppercase tracking-wide text-text-muted">
        {label}
      </span>
      <div className="relative w-full">
        <div className="pointer-events-none absolute inset-x-0 top-1/2 z-10 h-10 -translate-y-1/2 rounded-xl border-y border-primary-container/40 bg-primary-container/10" />
        <div
          ref={ref}
          onScroll={(e) => {
            const el = e.currentTarget;
            const idx = Math.round(el.scrollTop / ITEM_H);
            const clamped = Math.max(0, Math.min(optionsRef.current.length - 1, idx));
            if (optionsRef.current[clamped] !== undefined && optionsRef.current[clamped] !== value) {
              onChange(optionsRef.current[clamped]);
            }
          }}
          className="h-[200px] overflow-y-auto overscroll-contain [scrollbar-width:none] [scroll-snap-type:y_mandatory] [&::-webkit-scrollbar]:hidden"
          style={{ paddingTop: PAD, paddingBottom: PAD }}
        >
          {options.map((opt) => (
            <div
              key={opt}
              className={cn(
                "flex h-10 items-center justify-center font-body-sm transition-colors [scroll-snap-align:center]",
                opt === value
                  ? "font-bold text-text-primary"
                  : "text-text-muted/60",
              )}
            >
              {opt}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ScheduleWheels({
  value,
  onChange,
}: {
  value: JalaliClock;
  onChange: (v: JalaliClock) => void;
}) {
  const base = toJalali(new Date());
  let years = Array.from({ length: 17 }, (_, i) => base.jy - 8 + i);
  if (!years.includes(value.jy)) years = [...years, value.jy].sort((a, b) => a - b);

  const months = PERSIAN_MONTHS;
  const dayCount = daysInJalaliMonth(value.jy, value.jm);
  const days = Array.from({ length: dayCount }, (_, i) => faDigits(i + 1));
  const hours = Array.from({ length: 24 }, (_, i) => faDigits(i));
  const minutes = Array.from({ length: 60 }, (_, i) => faDigits(i));

  const clampDay = (jy: number, jm: number, jd: number) => ({
    ...value,
    jy,
    jm,
    jd: Math.min(jd, daysInJalaliMonth(jy, jm)),
  });

  return (
    <div>
      <div className="grid grid-cols-3 gap-1.5">
        <WheelColumn
          label="سال"
          options={years.map((y) => faDigits(y))}
          value={faDigits(value.jy)}
          onChange={(v) => {
            const jy = Number(faToEn(v)) || value.jy;
            onChange(clampDay(jy, value.jm, value.jd));
          }}
        />
        <WheelColumn
          label="ماه"
          options={months}
          value={months[value.jm - 1]}
          onChange={(v) => onChange(clampDay(value.jy, months.indexOf(v) + 1, value.jd))}
        />
        <WheelColumn
          label="روز"
          options={days}
          value={faDigits(value.jd)}
          onChange={(v) => onChange({ ...value, jd: Number(faToEn(v)) || value.jd })}
        />
      </div>
      <div className="mx-auto mt-3 grid max-w-xs grid-cols-2 gap-1.5">
        <WheelColumn
          label="ساعت"
          options={hours}
          value={faDigits(value.hh)}
          onChange={(v) => onChange({ ...value, hh: Number(faToEn(v)) || value.hh })}
        />
        <WheelColumn
          label="دقیقه"
          options={minutes}
          value={faDigits(value.mm)}
          onChange={(v) => onChange({ ...value, mm: Number(faToEn(v)) || value.mm })}
        />
      </div>
      <p className="mt-2 text-center font-label-xs text-text-muted">
        در این روز و ساعت در فهرست «امروز» و تقویم نمایش داده می‌شود.
      </p>
    </div>
  );
}