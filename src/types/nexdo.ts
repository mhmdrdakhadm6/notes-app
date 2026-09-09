export type TaskStatus = "todo" | "in_progress" | "completed" | "archived";

export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  dueTime: string | null;
  reminder: string;
  recurrence: string;
  projectId: string | null;
  tags: string[];
  estimatedTime: string;
  actualTime: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  deadline: string | null;
  category: string;
  archived: boolean;
  createdAt: string;
}

export interface Tag {
  id: string;
  name: string;
}

export type Page =
  | "dashboard"
  | "tasks"
  | "calendar"
  | "projects"
  | "notes"
  | "analytics"
  | "settings"
  | "help"
  | "profile";

export type TasksSubview = "today" | "upcoming" | "overdue" | "completed";

export const PRIORITY_META: Record<
  TaskPriority,
  { label: string; dot: string; text: string; bg: string }
> = {
  low: { label: "کم", dot: "bg-priority-low", text: "text-priority-low", bg: "bg-priority-low/15" },
  medium: { label: "متوسط", dot: "bg-accent-electric", text: "text-accent-electric", bg: "bg-accent-electric/15" },
  high: { label: "زیاد", dot: "bg-priority-high", text: "text-priority-high", bg: "bg-priority-high/15" },
  urgent: { label: "فوری", dot: "bg-priority-urgent", text: "text-priority-urgent", bg: "bg-priority-urgent/15" },
};

export const STATUS_META: Record<
  TaskStatus,
  { label: string; icon: string }
> = {
  todo: { label: "انجام‌نشده", icon: "radio_button_unchecked" },
  in_progress: { label: "در حال انجام", icon: "progress_activity" },
  completed: { label: "تکمیل‌شده", icon: "check_circle" },
  archived: { label: "بایگانی‌شده", icon: "archive" },
};

export const durationToMinutes = (value: string): number => {
  const match = value.match(/(\d+(?:\.\d+)?)\s*h(?:rs?)?(?: (\d+))?/i);
  if (!match) {
    return 0;
  }
  const hours = Number.parseFloat(match[1]);
  const minutes = Number.parseInt(match[2] ?? "0", 10);
  return hours * 60 + minutes;
};