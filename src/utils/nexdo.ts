import { toJalali } from "./persianDate";

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function toDateKey(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export function todayKey(): string {
  return toDateKey(new Date());
}

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function daysBetween(a: Date, b: Date): number {
  const ms = startOfDay(b).getTime() - startOfDay(a).getTime();
  return Math.round(ms / 86_400_000);
}

export function parseDueDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : new Date(parsed);
}

export function isDueToday(date: string | null | undefined): boolean {
  return date != null && date === todayKey();
}

export function isOverdue(task: {
  dueDate: string | null;
  status: string;
}): boolean {
  if (task.status === "completed" || task.status === "archived") return false;
  if (!task.dueDate) return false;
  return task.dueDate < todayKey();
}

export const PERSIAN_MONTHS = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];

export const PERSIAN_WEEKDAYS = [
  "یکشنبه",
  "دوشنبه",
  "سه‌شنبه",
  "چهارشنبه",
  "پنجشنبه",
  "جمعه",
  "شنبه",
];

export function weekdayShortLetter(date: Date): string {
  return ["ی", "د", "س", "چ", "پ", "ج", "ش"][date.getDay()];
}

export function faMonthYear(date: Date): string {
  const { jy, jm } = toJalali(date);
  return `${PERSIAN_MONTHS[jm - 1]} ${jy}`;
}

export function faJMonthYear(jy: number, jm: number): string {
  return `${PERSIAN_MONTHS[jm - 1]} ${jy}`;
}

export function faLongDate(date: Date): string {
  const { jm, jd } = toJalali(date);
  return `${PERSIAN_WEEKDAYS[date.getDay()]} ${jd} ${PERSIAN_MONTHS[jm - 1]}`;
}

export function faDueShort(date: Date): string {
  const { jm, jd } = toJalali(date);
  return `${jd} ${PERSIAN_MONTHS[jm - 1]}`;
}

export function formatDueLabel(dateKey: string): string {
  const date = parseDueDate(dateKey);
  if (!date) return "";
  const today = new Date();
  const diff = daysBetween(today, date);
  if (diff === 0) return "امروز";
  if (diff === 1) return "فردا";
  if (diff === -1) return "دیروز";
  const sameWeek =
    Math.floor((date.getTime() - startOfDay(today).getTime()) / 86_400_000) <= 7 &&
    diff > 1;
  if (sameWeek) {
    return PERSIAN_WEEKDAYS[date.getDay()];
  }
  return faDueShort(date);
}

export function isSameWeek(a: Date, b: Date): boolean {
  const dayA = a.getDay();
  const dayB = b.getDay();
  const diff = Math.abs(daysBetween(a, b));
  return diff < 7 && dayA !== dayB;
}

export function greetingForHour(hour: number): string {
  if (hour < 5) return "شب بخیر";
  if (hour < 12) return "صبح بخیر";
  if (hour < 17) return "ظهر بخیر";
  if (hour < 21) return "عصر بخیر";
  return "شب بخیر";
}

export function formatTimeReadable(time: string | null): string {
  if (!time) return "";
  const [h, m] = time.split(":").map((x) => Number.parseInt(x, 10));
  if (Number.isNaN(h)) return time;
  const period = h < 12 ? "ق.ظ" : "ب.ظ";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m ?? 0).padStart(2, "0")} ${period}`;
}

export function relativeLongDate(dateKey: string): string {
  const date = parseDueDate(dateKey);
  if (!date) return "";
  return faLongDate(date);
}

export function compareByDue(
  a: { dueDate: string | null; dueTime: string | null },
  b: { dueDate: string | null; dueTime: string | null },
): number {
  const aKey = a.dueDate ?? "9999-12-31";
  const bKey = b.dueDate ?? "9999-12-31";
  if (aKey !== bKey) return aKey < bKey ? -1 : 1;
  const aTime = a.dueTime ?? "23:59";
  const bTime = b.dueTime ?? "23:59";
  return aTime < bTime ? -1 : aTime > bTime ? 1 : 0;
}

export function taskTagsNames(
  tags: Array<{ id: string; name: string }>,
  taskTags: string[],
): string[] {
  const names = new Set<string>();
  for (const t of tags) names.add(t.name);
  for (const tag of taskTags) names.add(tag);
  return Array.from(names);
}