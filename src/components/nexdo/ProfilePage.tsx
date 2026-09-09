import { useNexdo } from "../../contexts/NexdoContext";
import { Icon } from "./Icon";
import { Badge } from "./ui";

export function ProfilePage() {
  const { user, logout, tasks, projects, pushToast, setPage } = useNexdo();
  const completed = tasks.filter((t) => t.status === "completed").length;
  const activeProjects = projects.filter((p) => !p.archived).length;
  const overdue = tasks.filter((t) => t.dueDate && t.dueDate < new Date().toISOString().split("T")[0] && t.status !== "completed").length;

  return (
    <div className="animate-fade-in max-w-2xl space-y-4 p-4 lg:p-6">
      <div className="task-card flex flex-col items-center gap-3 rounded-xl p-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent-gradient font-headline-lg font-bold text-on-primary-container shadow-glow">
{(user?.name ?? "مهمان")
              .split(" ")
              .map((p) => p[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()}
        </div>
        <div>
          <h2 className="font-headline-lg text-text-primary">{user?.name ?? "مهمان"}</h2>
          <p className="font-body-sm text-text-muted">{user?.email ?? "ورود محلی"}</p>
        </div>
        <Badge className="bg-primary-container/20 text-accent-glow">
          <Icon name="local_fire_department" size="xs" /> ثبات ۱۲ روزه
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="تسک‌های تکمیل‌شده" value={String(completed)} />
        <StatCard label="پروژه‌های فعال" value={String(activeProjects)} />
        <StatCard label="تسک‌های عقب‌افتاده" value={String(overdue)} warn={overdue > 0} />
        <StatCard label="امتیاز بهره‌وری" value="۸۷" />
      </div>

      <div className="task-card rounded-xl p-4">
        <h3 className="mb-2 font-headline-sm text-text-primary">فعالیت اخیر</h3>
        <div className="space-y-2 text-right font-body-sm text-text-secondary">
          <p>
            <span className="text-accent-glow">●</span> امروز ۳ تسک تکمیل کردی
          </p>
          <p>
            <span className="text-priority-medium">●</span> «بازبینی گروه‌های امنیتی ابر» به وب‌اپلیکیشن اضافه شد
          </p>
          <p>
            <span className="text-priority-urgent">●</span> ۲ تسک عقب افتاده — یکی را همین حالا کامل کن
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => setPage("settings")}
          className="flex-1 rounded-full bg-surface-container py-2.5 font-label-xs font-bold uppercase tracking-wide text-text-secondary hover:text-text-primary"
        >
          تنظیمات
        </button>
        <button
          onClick={() => {
            pushToast({ type: "info", title: "خروج از حساب", message: "به امید دیدار!" });
            logout();
          }}
          className="flex-1 rounded-full bg-priority-urgent/15 py-2.5 font-label-xs font-bold uppercase tracking-wide text-priority-urgent"
        >
          خروج
        </button>
      </div>
    </div>
  );
}

function StatCard({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="task-card rounded-xl p-4">
      <div className={"font-mono-metric text-2xl font-bold " + (warn ? "text-priority-urgent" : "text-text-primary")}>
        {value}
      </div>
      <div className="font-label-xs text-text-muted">{label}</div>
    </div>
  );
}