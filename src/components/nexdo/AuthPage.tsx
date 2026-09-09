import { useState } from "react";
import { useNexdo } from "../../contexts/NexdoContext";
import { Icon } from "./Icon";

export function AuthPage() {
  const { login } = useNexdo();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("reza@nexdo.app");
  const [password, setPassword] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = mode === "signup" ? name : email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    login(finalName || "رضا", email || "reza@nexdo.app");
  };

  const demoLogin = () => login("رضا احمدی", "reza@nexdo.app");

  return (
    <div className="nexdo flex min-h-[100dvh] items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-gradient shadow-glow">
            <Icon name="grid_view" size="lg" filled className="text-on-primary-container" />
          </div>
          <h1 className="mt-4 font-headline-lg text-text-primary">به NEXDO خوش آمدی</h1>
          <p className="mt-1 max-w-xs font-body-sm text-text-muted">
            فضای کاری آرام تو برای بهره‌وری. روز را برنامه‌ریزی کن، روی کار عمیق تمرکز کن و ادامه بده.
          </p>
        </div>

        <div className="rounded-2xl border border-border-precision bg-surface-card p-6 shadow-soft">
          <div className="mb-5 grid grid-cols-2 gap-1 rounded-full bg-surface-intermediate p-1">
            {(["login", "signup"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={
                  "rounded-full py-2 font-label-xs font-bold uppercase tracking-wide transition-colors " +
                  (mode === m
                    ? "bg-primary-container text-on-primary-container"
                    : "text-text-muted hover:text-text-primary")
                }
              >
                {m === "login" ? "ورود" : "ساخت حساب"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-3">
            {mode === "signup" && (
              <div>
                <label className="mb-1 block font-label-xs font-bold uppercase tracking-wide text-text-muted">
                  نام کامل
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="رضا احمدی"
                  className="text-field h-11 w-full px-3 font-body-md"
                />
              </div>
            )}
            <div>
              <label className="mb-1 block font-label-xs font-bold uppercase tracking-wide text-text-muted">
                ایمیل
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-field h-11 w-full px-3 font-body-md"
              />
            </div>
            <div>
              <label className="mb-1 block font-label-xs font-bold uppercase tracking-wide text-text-muted">
                رمز عبور
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="text-field h-11 w-full px-3 font-body-md"
              />
            </div>

            <button
              type="submit"
              className="flex h-11 w-full items-center justify-center rounded-full bg-primary-container font-label-xs font-bold uppercase tracking-wide text-on-primary-container hover:bg-accent-electric"
            >
              {mode === "login" ? "ورود" : "ساخت حساب"} ←
            </button>
          </form>

          <div className="my-4 flex items-center gap-3 text-text-muted">
            <span className="h-px flex-1 bg-border-precision" />
            <span className="font-label-xs">یا</span>
            <span className="h-px flex-1 bg-border-precision" />
          </div>

          <button
            onClick={demoLogin}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-border-precision font-label-xs font-bold uppercase tracking-wide text-text-secondary hover:border-primary-container/50 hover:text-text-primary"
          >
            <Icon name="play_circle" size="sm" className="text-accent-glow" filled />
            ادامه با حساب نمایشی
          </button>
        </div>

        <p className="mt-4 text-center font-label-xs text-text-muted">
          آفلاین‌اول · داده‌هایت هرگز از این دستگاه خارج نمی‌شود
        </p>
      </div>
    </div>
  );
}