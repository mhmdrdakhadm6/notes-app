import { useNotes } from "../hooks/useNotes";
import { FileText, Sparkles } from "lucide-react";

function Footer() {
  const { notes } = useNotes();
  
  return (
    <footer className="flex min-h-[88px] items-center justify-between rounded-b-[36px] border-t border-[#093cc8]/10 bg-black/60 px-6 text-center sm:px-8">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#093cc8]/20 bg-[#093cc8]/5 text-[#093cc8]">
          <Sparkles size={14} />
        </div>
        <p className="text-xs font-medium text-slate-500">
          {notes.length === 0 ? (
            "هنوز یادداشتی ثبت نشده است"
          ) : (
            <span className="text-[#093cc8]">
              {notes.length} یادداشت فعال
            </span>
          )}
        </p>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#093cc8]/20 bg-[#093cc8]/5 text-[#093cc8]">
          <FileText size={14} />
        </div>
        <p className="text-xs font-medium text-slate-400">
          {notes.length === 0 ? (
            "شما یادداشتی ندارید"
          ) : (
            <span className="text-2xl font-black tracking-tight text-white">
              {notes.length}
            </span>
          )}
        </p>
      </div>
    </footer>
  );
}

export default Footer;