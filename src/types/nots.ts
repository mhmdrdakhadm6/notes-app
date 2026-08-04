export interface NotesType {
  title: string;
  description: string;
  id: string;
  date: Date | string;
  recurrence: "none" | "weekly" | "monthly";
  customDate?: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
}
