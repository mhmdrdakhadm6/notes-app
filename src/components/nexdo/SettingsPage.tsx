import { useState } from "react";
import { useNexdo } from "../../contexts/NexdoContext";
import { Icon } from "./Icon";
import { Button } from "./ui";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="task-card rounded-xl p-4">
      <h3 className="mb-3 font-headline-sm text-text-primary">{title}</h3>
      {children}
    </section>
  );
}

function Row({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <div className="font-body-md text-text-primary">{label}</div>
        {description && <div className="font-label-xs text-text-muted">{description}</div>}
      </div>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={(
        "relative h-5 w-9 shrink-0 rounded-full transition-colors " +
        (checked ? "bg-primary-container" : "bg-surface-container-highest")
      )}
    >
      <span
        className={(
          "absolute top-0.5 h-4 w-4 rounded-full transition-all " +
          (checked ? "end-0.5 bg-white" : "start-0.5 bg-text-muted")
        )}
      />
    </button>
  );
}

export function SettingsPage() {
  const { user, login, pushToast, requestConfirm } = useNexdo();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [notify, setNotify] = useState(true);
  const [weekly, setWeekly] = useState(true);
  const [language, setLanguage] = useState("فارسی");

  const saveProfile = () => {
    if (!name.trim()) return;
    login(name.trim(), email.trim() || "you@nexdo.app");
    pushToast({ type: "success", title: "پروفایل به‌روزرسانی شد" });
  };

  const exportData = () => {
    const data: Record<string, unknown> = {};
    for (const key of Object.keys(window.localStorage)) {
      if (key.startsWith("nexdo:")) {
        try {
          data[key] = JSON.parse(window.localStorage.getItem(key) ?? "null");
        } catch {
          data[key] = window.localStorage.getItem(key);
        }
      }
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "nexdo-backup.json";
    a.click();
    URL.revokeObjectURL(url);
    pushToast({ type: "success", title: "نسخه پشتیبان دانلود شد", message: "nexdo-backup.json" });
  };

  const resetWorkspace = () => {
    requestConfirm({
      title: "بازنشانی فضای کاری؟",
      message: "همه تسک‌ها، پروژه‌ها و برچسب‌ها با داده‌های نمایشی جایگزین می‌شوند.",
      confirmLabel: "بازنشانی فضای کاری",
      danger: true,
      onConfirm: () => {
        window.localStorage.removeItem("nexdo:seed");
        window.localStorage.removeItem("nexdo:tasks");
        window.localStorage.removeItem("nexdo:projects");
        window.localStorage.removeItem("nexdo:tags");
        window.location.reload();
      },
    });
  };

  return (
    <div className="animate-fade-in max-w-3xl space-y-4 p-4 lg:p-6">
      <div>
        <h2 className="font-headline-lg text-text-primary">تنظیمات</h2>
        <p className="font-body-sm text-text-muted">فضای کاری NEXDO را مدیریت کن.</p>
      </div>

      <Section title="پروفایل">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block font-label-xs font-bold uppercase tracking-wide text-text-muted">نام</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-field h-10 w-full px-3 font-body-md"
            />
          </div>
          <div>
            <label className="mb-1 block font-label-xs font-bold uppercase tracking-wide text-text-muted">ایمیل</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              className="text-field h-10 w-full px-3 font-body-md"
            />
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <Button variant="primary" onClick={saveProfile}>
            ذخیره پروفایل
          </Button>
        </div>
      </Section>

      <Section title="ترجیحات">
        <Row label="زبان" description="زبان رابط کاربری">
          <select value={language} onChange={(e) => setLanguage(e.target.value)} className="text-field h-9 w-44 px-2.5 font-body-sm">
            {["فارسی", "English (US)", "Deutsch", "Français"].map((l) => (
              <option key={l} className="bg-surface-card">{l}</option>
            ))}
          </select>
        </Row>
        <Row label="تم تیره" description="NEXDO همیشه از حالت تیره سیستم پیروی می‌کند">
          <Toggle checked onChange={() => pushToast({ type: "info", title: "تم تیره ثابت است", message: "تم تیره آرام بخشی از هویت NEXDO است." })} />
        </Row>
        <Row label="شروع هفته از شنبه">
          <Toggle checked={weekly} onChange={setWeekly} />
        </Row>
      </Section>

      <Section title="اعلان‌ها">
        <Row label="یادآوری سررسیدها" description="قبل از سررسید تسک‌ها اطلاع بده">
          <Toggle checked={notify} onChange={setNotify} />
        </Row>
        <Row label="یادآوری مرور روزانه" description="یادآوری در پایان روز">
          <Toggle checked onChange={() => null} />
        </Row>
      </Section>

      <Section title="داده‌ها">
        <Row label="خروجی فضای کاری" description="دانلود نسخه پشتیبان JSON از همه داده‌ها">
          <Button variant="secondary" onClick={exportData}>
            <Icon name="download" size="sm" /> خروجی
          </Button>
        </Row>
        <Row label="بازنشانی فضای کاری" description="پاک‌کردن داده‌های محلی و بازگردانی محتوای نمایشی">
          <Button variant="danger" onClick={resetWorkspace}>
            <Icon name="restart_alt" size="sm" /> بازنشانی
          </Button>
        </Row>
      </Section>
    </div>
  );
}