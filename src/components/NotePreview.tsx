import { useNotes } from "../hooks/useNotes";
import NotePreviewCard from "./NotePreviewCard";

function NotePreview() {
  const { notePreview, isPreview, setIsPreview } = useNotes();

  if (!isPreview || !notePreview) return null;

  return (
    <div
      dir="rtl"
      onClick={() => setIsPreview(false)}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[#020617]/85 px-3 py-3 backdrop-blur-xl animate-fadeIn sm:px-4 sm:py-6"
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="min-h-0 w-full max-w-3xl animate-fadeInUp"
      >
        <NotePreviewCard {...notePreview} />
      </div>
    </div>
  );
}

export default NotePreview;
