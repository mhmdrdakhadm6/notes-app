import OpenAI from "openai";

const ENV_API_KEY = import.meta.env.VITE_GAPGPT_API_KEY?.trim() ?? "";
const API_KEY_STORAGE = "notes-ai-api-key";
const DEFAULT_MODEL = "deepseek-v4-flash";

export interface AIIntentEntry {
  usedAI: boolean;
  action:
    | "add_task"
    | "delete_task"
    | "complete_task"
    | "fullscreen_enter"
    | "fullscreen_exit"
    | "navigate"
    | "ai_chat"
    | "say"
    | "other";
  title: string;
  message: string;
}

function getApiKey(): string {
  return (
    (window.sessionStorage.getItem(API_KEY_STORAGE) || "") ||
    (window.localStorage.getItem(API_KEY_STORAGE) || "") ||
    ENV_API_KEY
  ).trim();
}

export function hasAIApiKey(): boolean {
  return Boolean(getApiKey());
}

const SYSTEM_PROMPT = `
تو یک موتور تشخیص نیت صوتی برای اپلیکیشن مدیریت تسک هستی.
فقط یک شیء JSON معتبر خروجی بده؛ هیچ توضیح اضافه‌ای ننویس.

فرمان کاربر را به یکی از این اقدام‌ها دسته‌بندی کن:
- add_task: کاربر می‌خواهد تسک یا کار جدیدی اضافه کند (پیش‌فرض همه احکام عادی).
- delete_task: می‌خواهد تسک موجود را حذف کند. نمونه: «خرید نان را حذف کن»، «جلسه کاری را پاک کن»، «تسک جلسه را کانسل کن»، «تحویل پروژه را ولش کن»، «خرید نان دیگر لازم نیست».
- complete_task: می‌خواهد تسک را انجام‌شده علامت بزند. نمونه: «جلسه کاری را انجام دادم»، «تحویل پروژه تمام شد»، «خرید نان اوکی شد».
- fullscreen_enter: می‌خواهد سایت به حالت تمام‌صفحه برود. نمونه: «سایت را تمام‌صفحه کن»، «برو فول اسکرین».
- fullscreen_exit: می‌خواهد از تمام‌صفحه خارج شود. نمونه: «از حالت تمام‌صفحه خارج شو»، «تمام‌صفحه را ببند».
- navigate: می‌خواهد به یک تب یا صفحه از سایت برود. نمونه: «منو ببر به تقویم»، «برو به وظایف»، «تب تنظیمات را باز کن»، «بریم آمار». عنوان تب را در title بگذار (فقط یکی از این شناسه‌ها: dashboard, tasks, calendar, projects, notes, analytics, settings, help, profile).
- ai_chat: می‌خواهد پیامی برای هوش مصنوعی بفرستد. نمونه: «پیام به AI».
- say: عبارت درخواستی است که باید گفته شود. نمونه: «بگو صبح بخیر».
- other: هیچ‌کدام.

قوانین:
- برای delete_task و complete_task: عنوان دقیق تسک را در title بگذار (بدون کلمات «حذف/پاک/کنسل/انجام/تسک/را/رو» و امثال آن).
- برای add_task: خلاصه تمیز تسک را در title بگذار.
- برای navigate: فقط یکی از شناسه‌های تب را در title بگذار (dashboard, tasks, calendar, projects, notes, analytics, settings, help, profile).
- برای ai_chat و say: متن کامل را در message بگذار.
- وقتی مطمئن نیستی، add_task.

خروجی دقیقاً به این شکل:
{"action":"...","title":"...","message":"..."}
`;

function extractJson(raw: string): AIIntentEntry | null {
  if (!raw) return null;
  const first = raw.indexOf("{");
  const last = raw.lastIndexOf("}");
  if (first < 0 || last <= first) return null;
  try {
    const parsed = JSON.parse(raw.slice(first, last + 1));
    if (typeof parsed !== "object" || parsed === null) return null;
    return {
      usedAI: true,
      action: parsed.action ?? "other",
      title: String(parsed.title ?? "").trim(),
      message: String(parsed.message ?? "").trim(),
    };
  } catch {
    return null;
  }
}

export async function classifyVoiceIntent(
  text: string,
  model: string = DEFAULT_MODEL,
): Promise<AIIntentEntry | null> {
  const apiKey = getApiKey();
  const trimmed = text.trim();
  if (!apiKey || !trimmed) return null;

  try {
    const client = new OpenAI({
      apiKey,
      baseURL: "https://api.gapgpt.app/v1",
      dangerouslyAllowBrowser: true,
      timeout: 9000,
    });

    const response = await client.responses.create({
      model,
      instructions: SYSTEM_PROMPT,
      input: [{ role: "user", content: `فرمان کاربر: "${trimmed}"` }],
      temperature: 0,
      max_output_tokens: 160,
    });

    return extractJson(response.output_text ?? "");
  } catch {
    return null;
  }
}