export interface NoteImage {
  dataUrl: string;
  name: string;
}

export interface NotesType {
  title: string;
  description: string;
  id: string;
  date: Date | string;
  recurrence: "none" | "weekly" | "monthly";
  isPermanent?: boolean;
  customDate?: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
  image?: NoteImage;
}
