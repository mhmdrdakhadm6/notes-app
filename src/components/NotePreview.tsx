import { useNotes } from "../hooks/useNotes";
import NotePreviewCard from "./NotePreviewCard";

function NotePreview() {
  const { notePreview, isPreview } = useNotes();

  if (!isPreview || !notePreview) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-md"
      dir="rtl"
    >
      <div className="w-full max-w-2xl text-right">
        <NotePreviewCard {...notePreview} />
      </div>
    </div>
  );
}

export default NotePreview;
