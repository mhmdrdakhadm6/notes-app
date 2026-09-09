import type { Project, Tag, Task } from "../types/nexdo";

const uid = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const isoDaysAgo = (daysAgo: number, hours = 9, minutes = 0): string => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
};

const isoDaysAhead = (daysAhead: number, hours = 9, minutes = 0): string => {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
};

export interface SeedData {
  tasks: Task[];
  projects: Project[];
  tags: Tag[];
}

export function buildSeedData(): SeedData {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString().split("T")[0];
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowISO = tomorrow.toISOString().split("T")[0];
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayISO = yesterday.toISOString().split("T")[0];

  const projects: Project[] = [
    {
      id: "prj-webapp",
      name: "وب‌اپلیکیشن",
      description: "بازطراحی داشبورد اصلی و نسخه دوم تحلیلها",
      icon: "terminal",
      color: "accent-electric",
      deadline: isoDaysAhead(6),
      category: "کار",
      archived: false,
      createdAt: isoDaysAgo(40),
    },
    {
      id: "prj-university",
      name: "دانشگاه",
      description: "پروژه پایانی سیستم‌های توزیع‌شده",
      icon: "school",
      color: "priority-medium",
      deadline: isoDaysAhead(11),
      category: "دانشگاه",
      archived: false,
      createdAt: isoDaysAgo(60),
    },
    {
      id: "prj-personal",
      name: "شخصی",
      description: "نگهداری روتین، پورتفولیو و عادت‌ها",
      icon: "spa",
      color: "priority-low",
      deadline: null,
      category: "شخصی",
      archived: false,
      createdAt: isoDaysAgo(90),
    },
  ];

  const tags: Tag[] = [
    { id: "tag-work", name: "کار" },
    { id: "tag-university", name: "دانشگاه" },
    { id: "tag-programming", name: "برنامه‌نویسی" },
    { id: "tag-react", name: "ری‌اکت" },
    { id: "tag-fintech", name: "فین‌تک" },
    { id: "tag-portfolio", name: "پورتفولیو" },
    { id: "tag-study", name: "مطالعه" },
    { id: "tag-routine", name: "روتین" },
    { id: "tag-fitness", name: "تناسب‌اندام" },
    { id: "tag-security", name: "امنیت" },
    { id: "tag-code", name: "کد" },
    { id: "tag-important", name: "مهم" },
  ];

  const baseTask = (partial: Partial<Task>): Task => ({
    id: uid(),
    title: "",
    description: "",
    status: "todo",
    priority: "medium",
    dueDate: null,
    dueTime: null,
    reminder: "۳۰ دقیقه قبل",
    recurrence: "بدون تکرار",
    projectId: null,
    tags: [],
    estimatedTime: "۴۵ دقیقه",
    actualTime: "",
    pinned: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: null,
    ...partial,
  });

  const tasks: Task[] = [
    // صف تمرکز با اولویت بالا (داشبورد)
    baseTask({
      title: "انتشار هات‌فیکس v2.4 برای محدودکننده نرخ API Gateway",
      description:
        "انتشار هات‌فیکس در محیط تولید و بررسی رفتار محدودکننده نرخ در پنجره سهمیه جدید.",
      status: "in_progress",
      priority: "urgent",
      dueDate: todayISO,
      dueTime: "18:30",
      reminder: "۳۰ دقیقه قبل",
      projectId: "prj-webapp",
      tags: ["کار"],
      estimatedTime: "۴۵ دقیقه",
    }),
    baseTask({
      title: "نوشتن مشخصات معماری سرویس دفتر کل",
      description: "ترسیم مرزها، قراردادهای رویداد و مدل ذخیره‌سازی برای میکروسرویس دفتر کل.",
      status: "todo",
      priority: "high",
      dueDate: todayISO,
      dueTime: "20:00",
      projectId: "prj-webapp",
      tags: ["فین‌تک"],
      estimatedTime: "۱٫۵ ساعت",
    }),
    baseTask({
      title: "پیاده‌سازی شبکه بنتو تعاملی در نمونه‌کار شخصی",
      description: "جایگزینی گالری ایستا با شبکه بنتوی روان و سازگار با کیبورد.",
      status: "todo",
      priority: "high",
      dueDate: todayISO,
      dueTime: "21:30",
      projectId: "prj-personal",
      tags: ["پورتفولیو"],
      estimatedTime: "۱ ساعت",
    }),
    // برنامه امروز
    baseTask({
      title: "تکمیل احراز هویت React و چرخش توکن JWT",
      description:
        "چرخش کلیدهای امضای RSA 4096، به‌روزرسانی هوک‌های بلاک‌لیست Redis هنگام انقضای توکن و بررسی جریان تازه‌سازی در اندپوینت‌های موبایل.",
      status: "in_progress",
      priority: "urgent",
      dueDate: todayISO,
      dueTime: "14:30",
      reminder: "۱۵ دقیقه قبل",
      projectId: "prj-webapp",
      tags: ["برنامه‌نویسی", "ری‌اکت"],
      estimatedTime: "۲ ساعت",
    }),
    baseTask({
      title: "مطالعه ریاضیات: فصل احتمال گسسته",
      description: "کار روی فصل احتمال گسسته و حل مجموعه تمرین‌ها.",
      status: "todo",
      priority: "high",
      dueDate: todayISO,
      dueTime: "16:00",
      projectId: "prj-university",
      tags: ["دانشگاه"],
      estimatedTime: "۱٫۵ ساعت",
    }),
    baseTask({
      title: "آماده‌سازی ارائه دموی محصول برای ذینفعان",
      description: "تدوین روایت ویژگی‌ها و نکات کلیدی برای دموی جمعه.",
      status: "todo",
      priority: "medium",
      dueDate: todayISO,
      dueTime: "17:15",
      projectId: "prj-webapp",
      tags: ["کار"],
      estimatedTime: "۴۵ دقیقه",
    }),
    baseTask({
      title: "مرور تسک‌های تکمیل‌شده امروز و برنامه‌ریزی فردا",
      description: "آیین مرور پایان روز: مرور، ثبت موفقیت‌ها و ترسیم برنامه فردا.",
      status: "todo",
      priority: "low",
      dueDate: todayISO,
      dueTime: "20:30",
      projectId: "prj-personal",
      tags: ["روتین"],
      estimatedTime: "۱۵ دقیقه",
    }),
    baseTask({
      title: "تمرین باشگاه ۴۵ دقیقه‌ای + حرکات کششی",
      description: "جلسه بالاتنه و سپس حرکات کششی کامل.",
      status: "todo",
      priority: "medium",
      dueDate: todayISO,
      dueTime: "21:00",
      projectId: "prj-personal",
      tags: ["تناسب‌اندام"],
      estimatedTime: "۴۵ دقیقه",
    }),
    baseTask({
      title: "انتشار نسخه پیش‌نمایش صفحه فرود",
      description: "تکمیل متن صفحه فرود و انتشار محیط پیش‌نمایش.",
      status: "todo",
      priority: "high",
      dueDate: yesterdayISO,
      dueTime: "18:00",
      projectId: "prj-webapp",
      tags: ["کار", "پورتفولیو"],
      estimatedTime: "۲ ساعت",
    }),
    baseTask({
      title: "ارسال تکلیف: نرمال‌سازی پایگاه داده",
      description: "آپلود PDF تکلیف قبل از مهلت تحویل.",
      status: "todo",
      priority: "urgent",
      dueDate: yesterdayISO,
      dueTime: "23:59",
      projectId: "prj-university",
      tags: ["دانشگاه"],
      estimatedTime: "۱ ساعت",
    }),
    // تکمیل‌شده (صبح امروز)
    baseTask({
      title: "استندآپ روزانه و مرور اسپرینت",
      description: "",
      status: "completed",
      priority: "medium",
      dueDate: todayISO,
      dueTime: "09:30",
      projectId: "prj-webapp",
      tags: ["کار"],
      estimatedTime: "۲۵ دقیقه",
      completedAt: new Date()?.toString(),
    }),
    baseTask({
      title: "مطالعه ۲۰ صفحه: معماری سیستم",
      description: "",
      status: "completed",
      priority: "high",
      dueDate: todayISO,
      dueTime: "10:15",
      projectId: "prj-university",
      tags: ["مطالعه"],
      estimatedTime: "۴۰ دقیقه",
      completedAt: new Date()?.toString(),
    }),
    baseTask({
      title: "بررسی درخواست ادغام #142",
      description: "",
      status: "completed",
      priority: "medium",
      dueDate: todayISO,
      dueTime: "11:00",
      projectId: "prj-webapp",
      tags: ["کد"],
      estimatedTime: "۱۵ دقیقه",
      completedAt: new Date()?.toString(),
    }),
    // چند مورد پیش رو
    baseTask({
      title: "بازآرایی مدیریت state به فروشگاه Zustand",
      description: "مهاجرت بخش داشبورد و حذف prop drilling.",
      status: "todo",
      priority: "high",
      dueDate: tomorrowISO,
      dueTime: "10:00",
      projectId: "prj-webapp",
      tags: ["برنامه‌نویسی", "ری‌اکت"],
      estimatedTime: "۳ ساعت",
    }),
    baseTask({
      title: "بازبینی سیاست‌های گروه امنیتی ورودی ابر",
      description: "",
      status: "todo",
      priority: "urgent",
      dueDate: tomorrowISO,
      dueTime: "16:00",
      projectId: "prj-webapp",
      tags: ["امنیت"],
      estimatedTime: "۱ ساعت",
    }),
    baseTask({
      title: "به‌روزرسانی راهبردهای نُکش حافظه پنهان توزیع‌شده",
      description: "",
      status: "todo",
      priority: "medium",
      dueDate: isoDaysAhead(3),
      dueTime: "12:00",
      projectId: "prj-webapp",
      tags: ["برنامه‌نویسی"],
      estimatedTime: "۲ ساعت",
    }),
  ];

  return { tasks, projects, tags };
}