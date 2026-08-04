function Empty() {
  return (
    <div className="min-h-[430px] px-6 py-6 sm:px-8">
      <div className="flex h-full min-h-[380px] items-center justify-center rounded-[24px] border border-dashed border-white/10 bg-white/[0.02]">
        <div className="text-center">
          <p className="text-lg text-slate-300">هنوز یادداشتی وجود ندارد</p>
          <p className="mt-2 text-sm text-slate-500">
            اولین یادداشت خود را ایجاد کنید یا یادداشت‌های موجود را جستجو
            کنید.{" "}
          </p>
        </div>
      </div>
    </div>
  );
}

export default Empty;
