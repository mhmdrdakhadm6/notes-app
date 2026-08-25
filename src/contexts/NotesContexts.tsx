import { createContext, useState, type PropsWithChildren } from "react";
import type { NotesType } from "../types/nots";
import { useLocalStorage } from "../hooks/useLocalStorage";

interface NotesProviderProps {
  title: string;
  setTitle: React.Dispatch<React.SetStateAction<string>>;
  description: string;
  setDescription: React.Dispatch<React.SetStateAction<string>>;
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  notes: NotesType[];
  setNotes: React.Dispatch<React.SetStateAction<NotesType[]>>;
  handelDelete: (id: string) => void;
  ToggleEdit: (newNotes: NotesType) => void;
  EditingNote: NotesType | null;
  setEditingNote: React.Dispatch<React.SetStateAction<NotesType | null>>;
  isEdit: boolean;
  setIsEdit: React.Dispatch<React.SetStateAction<boolean>>;
  notePreview: NotesType | null;
  setNotePreview: React.Dispatch<React.SetStateAction<NotesType | null>>;
  handleAddToNotesPerview: (id: string) => void;
  isPreview: boolean;
  setIsPreview: React.Dispatch<React.SetStateAction<boolean>>;
  deletingNoteId: string | null;
  setDeletingNoteId: React.Dispatch<React.SetStateAction<string | null>>;
}

type NotesContexProps = PropsWithChildren;

const NotesContext = createContext<NotesProviderProps | undefined>(undefined);

function NotesProvider({ children }: NotesContexProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [notes, setNotes] = useLocalStorage<NotesType[]>("notes", []);
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [EditingNote, setEditingNote] = useState<NotesType | null>(null);
  const [notePreview, setNotePreview] = useState<NotesType | null>(null);
  const [isPreview, setIsPreview] = useState<boolean>(false);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);

  const handelDelete = (id: string) => {
    setNotes((notes) => notes.filter((note) => note.id !== id));
  };

  const ToggleEdit = (newNotes: NotesType) => {
    setNotes((notes) =>
      notes.map((note) => {
        if (note.id === newNotes.id) {
          return { ...note, ...newNotes };
        }
        return note;
      }),
    );
  };

  const handleAddToNotesPerview = (id: string) => {
    const AddToNotesPreview = notes.find((note) => note.id === id);
    if (AddToNotesPreview) {
      setNotePreview(AddToNotesPreview);
      setIsPreview(true);
      console.log("clicked");
    }
  };

  return (
    <NotesContext.Provider
      value={{
        isOpen,
        setIsOpen,
        description,
        setDescription,
        setTitle,
        title,
        notes,
        setNotes,
        handelDelete,
        ToggleEdit,
        EditingNote,
        setEditingNote,
        isEdit,
        setIsEdit,
        notePreview,
        setNotePreview,
        handleAddToNotesPerview,
        isPreview,
        setIsPreview,
        deletingNoteId,
        setDeletingNoteId,
      }}
    >
      {children}
    </NotesContext.Provider>
  );
}

export { NotesProvider, NotesContext };
