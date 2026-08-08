import { useNotes } from "../hooks/useNotes";
import NotePreviewCard from "./NotePreviewCard";

function NotePreview() {
  const { notePreview, isPreview, setIsPreview } = useNotes();

  if (!isPreview || !notePreview) return null;

  return (
    <div
      dir="rtl"
      onClick={() => setIsPreview(false)}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#020617]/85 px-4 py-6 backdrop-blur-xl animate-fadeIn"
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-3xl animate-fadeInUp"
      >
        <NotePreviewCard {...notePreview} />
      </div>
    </div>
  );
}

export default NotePreview;
