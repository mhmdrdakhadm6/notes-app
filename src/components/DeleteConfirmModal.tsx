import { AlertTriangle, X, Trash2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { useNotes } from "../hooks/useNotes";

export default function DeleteConfirmModal() {
  const { deletingNoteId, setDeletingNoteId, handelDelete, notes } = useNotes();
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const note = deletingNoteId ? notes.find((item) => item.id === deletingNoteId) : undefined;

  const handleClose = () => setDeletingNoteId(null);
  const handleConfirm = () => {
    if (deletingNoteId && note) handelDelete(deletingNoteId);
    setDeletingNoteId(null);
  };

  useEffect(() => {
    if (!deletingNoteId) return;
    cancelButtonRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleClose();
      if (event.key === "Enter") handleConfirm();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [deletingNoteId, note]);

  if (!deletingNoteId || !note) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/90 px-4 py-6 backdrop-blur-xl"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) handleClose();
      }}
    >
      <section role="dialog" aria-modal="true" aria-labelledby="delete-confirm-title" className="flex w-full max-w-md flex-col overflow-hidden rounded-3xl border border-red-500/20 bg-[#0a0a0a] animate-fadeInUp">
        <header className="relative flex items-center justify-between border-b border-red-500/10 bg-gradient-to-b from-red-500/5 to-transparent px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10 text-red-500"><AlertTriangle size={20} strokeWidth={2.5} /></div>
            <div><h2 id="delete-confirm-title" className="text-lg font-bold text-white">حذف یادداشت</h2><p className="text-[11px] text-slate-400">آیا از حذف این یادداشت مطمئن هستید؟</p></div>
          </div>
          <button type="button" onClick={handleClose} aria-label="بستن" className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-slate-400 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-500"><X size={18} /></button>
        </header>
        <div className="p-6"><div className="rounded-2xl border border-white/5 bg-black/30 p-4"><p className="text-sm font-bold text-white">{note.title || "بدون عنوان"}</p>{note.description && <p className="mt-2 text-xs leading-5 text-slate-400">{note.description.length > 100 ? `${note.description.slice(0, 100)}...` : note.description}</p>}</div><p className="mt-4 text-center text-sm text-slate-400">این عمل غیرقابل بازگشت است.</p></div>
        <footer className="flex items-center justify-end gap-3 border-t border-white/5 bg-black/20 px-6 py-4"><button ref={cancelButtonRef} type="button" onClick={handleClose} className="inline-flex h-10 items-center rounded-xl border border-white/10 px-6 text-xs font-semibold text-slate-300 hover:bg-white/5">انصراف</button><button type="button" onClick={handleConfirm} className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-6 text-xs font-semibold text-red-500 hover:bg-red-500/20 active:scale-95"><Trash2 size={14} /><span>حذف شود</span></button></footer>
      </section>
    </div>
  );
}