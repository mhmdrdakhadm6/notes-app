import { useNotes } from "../hooks/useNotes";

function Footer() {
  const { notes } = useNotes();
  return (
    <footer className="flex min-h-[88px] items-center justify-center rounded-b-[36px] border-t border-white/10 bg-[#090d16] px-6 text-center sm:px-8">
      {notes.length === 0 ? (
        <p>شما یادداشتی ندارید</p>
      ) : (
        <p className="text-2xl font-medium tracking-wide text-slate-300">
          شما {notes.length} یادداشت دارید
        </p>
      )}
    </footer>
  );
}

export default Footer;
