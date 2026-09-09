import { useState } from "react";
import { useNexdo } from "../../contexts/NexdoContext";
import { Icon } from "./Icon";

const faqs: Array<{ q: string; a: string }> = [
  {
    q: "چطور سریع یک تسک بسازم؟",
    a: "همه‌جا کلید N را بزن یا در نوار کناری روی «ایجاد تسک» بزن. نوار افزودن سریع در داشبورد هم یک تسک را در یک خط ثبت می‌کند.",
  },
  {
    q: "میان‌برهای صفحه‌کلید چیست؟",
    a: "N ایجاد تسک، / تمرکز روی جستجو، T بازکردن امروز، C بازکردن تقویم، P بازکردن پروژه‌ها، A بازکردن تحلیل‌ها و Esc بستن هر پنجره باز.",
  },
  {
    q: "داده‌های من کجا ذخیره می‌شود؟",
    a: "NEXDO همه‌چیز را به‌صورت محلی در مرورگرت ذخیره می‌کند. هر وقت خواستی از تنظیمات ← داده‌ها یک نسخه پشتیبان JSON بگیر.",
  },
  {
    q: "امتیاز بهره‌وری چطور محاسبه می‌شود؟",
    a: "ترکیبی از نرخ تکمیل روزانه و سابقه ثبات توست. برای جزئیات، بخش تحلیل‌ها را ببین.",
  },
];

export function HelpPage() {
  const { setPage } = useNexdo();
  const [open, setOpen] = useState(0);

  return (
    <div className="animate-fade-in max-w-3xl space-y-4 p-4 lg:p-6">
      <div>
        <h2 className="font-headline-lg text-text-primary">راهنما و پشتیبانی</h2>
        <p className="font-body-sm text-text-muted">پاسخ سریع پرسش‌های رایج.</p>
      </div>

      <div className="task-card divide-y divide-border-precision overflow-hidden rounded-xl">
        {faqs.map((f, i) => (
          <div key={i}>
            <button
              onClick={() => setOpen(open === i ? -1 : i)}
              className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-right"
            >
              <span className="font-body-md font-medium text-text-primary">{f.q}</span>
              <Icon name={open === i ? "expand_less" : "expand_more"} size="sm" className="text-text-muted" />
            </button>
            {open === i && (
              <div className="px-4 pb-4 text-right font-body-sm leading-relaxed text-text-secondary">{f.a}</div>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-col items-center gap-3 rounded-xl border border-border-precision bg-surface-card p-6 text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-container/20 text-accent-glow">
          <Icon name="support_agent" size="md" filled />
        </span>
        <div>
          <div className="font-headline-sm text-text-primary">هنوز سؤالی داری؟</div>
          <div className="mt-1 font-body-sm text-text-muted">
            از نوار کناری اپ را کاوش کن یا داده‌هایت را خروجی بگیر و از طریق کانال پروژه پیام بده.
          </div>
        </div>
        <button
          onClick={() => setPage("settings")}
          className="rounded-full bg-primary-container px-5 py-2 font-label-xs font-bold uppercase tracking-wide text-on-primary-container"
        >
          بازکردن تنظیمات
        </button>
      </div>
    </div>
  );
}