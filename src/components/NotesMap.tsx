import type { NotesType } from "../types/nots";
import NotesItem from "./NotesItem";

interface NotesMapProps {
  notes: NotesType[];
  searchQuery: string;
}

function NotesMap({ notes, searchQuery }: NotesMapProps) {
  if (notes.length === 0) {
    return (
      <div className="p-8 text-center text-lg text-slate-400">
        No notes found for "{searchQuery}".
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-5 px-6 py-6 sm:px-8">
      {notes.map((note) => (
        <NotesItem key={note.id} {...note} />
      ))}
    </ul>
  );
}

export default NotesMap;
