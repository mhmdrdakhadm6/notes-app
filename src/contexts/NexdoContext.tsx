import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import type {
  Page,
  Project,
  Tag,
  Task,
  TaskStatus,
  TasksSubview,
} from "../types/nexdo";
import { buildSeedData } from "../data/seed";
import { useLocalStorage } from "../hooks/useLocalStorage";


export interface Toast {
  id: string;
  type: "success" | "error" | "info";
  title: string;
  message?: string;
}

interface ConfirmState {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
}

interface SearchResult {
  tasks: Task[];
  projects: Project[];
  tagsFiltered: string[];
}

export interface NexdoContextValue {
  user: { name: string; email: string } | null;
  login: (name: string, email: string) => void;
  logout: () => void;

  page: Page;
  setPage: (page: Page) => void;
  subview: TasksSubview;
  setSubview: (view: TasksSubview) => void;
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;

  tasks: Task[];
  projects: Project[];
  tags: Tag[];

  addTask: (task: Partial<Task>) => Task;
  updateTask: (id: string, patch: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleComplete: (id: string) => void;
  togglePin: (id: string) => void;
  archiveTask: (id: string) => void;
  duplicateTask: (id: string) => void;
  setStatus: (id: string, status: TaskStatus) => void;
  getTask: (id: string) => Task | undefined;

  addProject: (project: Partial<Project>) => Project;
  updateProject: (id: string, patch: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  archiveProject: (id: string) => void;

  addTag: (name: string) => Tag | null;
  deleteTag: (id: string) => void;

  taskModal: { open: boolean; task: Task | null; prefill?: Partial<Task> };
  openCreateTask: (prefill?: Partial<Task>) => void;
  openEditTask: (id: string) => void;
  closeTaskModal: () => void;

  taskDetails: { open: boolean; taskId: string | null };
  openTaskDetails: (id: string) => void;
  closeTaskDetails: () => void;

  projectModal: boolean;
  openProjectModal: () => void;
  closeProjectModal: () => void;

  confirm: ConfirmState | null;
  requestConfirm: (state: Omit<ConfirmState, "open">) => void;
  closeConfirm: () => void;

  toasts: Toast[];
  pushToast: (toast: Omit<Toast, "id">) => void;
  dismissToast: (id: string) => void;

  searchQuery: string;
  setSearchQuery: (q: string) => void;
  searchResults: SearchResult;
}

const NexdoContext = createContext<NexdoContextValue | undefined>(undefined);

const uid = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const TASKS_KEY = "nexdo:tasks";
const PROJECTS_KEY = "nexdo:projects";
const TAGS_KEY = "nexdo:tags";
const USER_KEY = "nexdo:user";
const SEED_VERSION_KEY = "nexdo:seed-version";
const SEED_VERSION = 2;

function migrateSeedVersion() {
  try {
    if (window.localStorage.getItem(SEED_VERSION_KEY) !== String(SEED_VERSION)) {
      for (const key of [SEED_VERSION_KEY, "nexdo:seed", TASKS_KEY, PROJECTS_KEY, TAGS_KEY]) {
        window.localStorage.removeItem(key);
      }
      window.localStorage.setItem(SEED_VERSION_KEY, String(SEED_VERSION));
    }
  } catch {
    /* ignore */
  }
}

interface StoredShelves {
  tasks: Task[];
  projects: Project[];
  tags: Tag[];
}

function readSeed(): StoredShelves {
  try {
    const raw = window.localStorage.getItem("nexdo:seed");
    if (raw) {
      const parsed = JSON.parse(raw) as StoredShelves;
      if (parsed?.tasks?.length && parsed?.projects?.length && parsed?.tags?.length) {
        return parsed;
      }
    }
  } catch {
    /* ignore */
  }
  const seed = buildSeedData();
  try {
    window.localStorage.setItem("nexdo:seed", JSON.stringify(seed));
  } catch {
    /* ignore */
  }
  return seed;
}

function readUser(): { name: string; email: string } | null {
  try {
    const raw = window.localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as { name: string; email: string }) : null;
  } catch {
    return null;
  }
}

export function NexdoProvider({ children }: PropsWithChildren) {
  migrateSeedVersion();
  const seed = useMemo(() => readSeed(), []);
  const [user, setUser] = useState<{ name: string; email: string } | null>(readUser);
  const [page, setPage] = useState<Page>("dashboard");
  const [subview, setSubview] = useState<TasksSubview>("today");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const [tasks, setTasks] = useLocalStorage<Task[]>(TASKS_KEY, seed.tasks);
  const [projects, setProjects] = useLocalStorage<Project[]>(PROJECTS_KEY, seed.projects);
  const [tags, setTags] = useLocalStorage<Tag[]>(TAGS_KEY, seed.tags);

  const [taskModal, setTaskModal] = useState<{ open: boolean; task: Task | null; prefill?: Partial<Task> }>({
    open: false,
    task: null,
    prefill: undefined,
  });
  const [taskDetails, setTaskDetails] = useState<{ open: boolean; taskId: string | null }>({
    open: false,
    taskId: null,
  });
  const [projectModal, setProjectModal] = useState<boolean>(false);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const login = useCallback((name: string, email: string) => {
    const u = { name, email };
    setUser(u);
    try {
      window.localStorage.setItem(USER_KEY, JSON.stringify(u));
    } catch {
      /* ignore */
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setPage("dashboard");
    setSelectedProjectId(null);
    try {
      window.localStorage.removeItem(USER_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const pushToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = uid();
    setToasts((prev) => [...prev, { ...toast, id }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3400);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addTask = useCallback(
    (partial: Partial<Task>): Task => {
      const now = new Date().toISOString();
      const task: Task = {
        id: uid(),
        title: partial.title ?? "",
        description: partial.description ?? "",
        status: partial.status ?? "todo",
        priority: partial.priority ?? "medium",
        dueDate: partial.dueDate ?? null,
        dueTime: partial.dueTime ?? null,
        reminder: partial.reminder ?? "۳۰ دقیقه قبل",
        recurrence: partial.recurrence ?? "بدون تکرار",
        projectId: partial.projectId ?? null,
        tags: partial.tags ?? [],
        estimatedTime: partial.estimatedTime ?? "45m",
        actualTime: partial.actualTime ?? "",
        pinned: partial.pinned ?? false,
        createdAt: partial.createdAt ?? now,
        updatedAt: now,
        completedAt: partial.completedAt ?? null,
      };
      setTasks((prev) => [task, ...prev]);
      return task;
    },
    [setTasks],
  );

  const updateTask = useCallback(
    (id: string, patch: Partial<Task>) => {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === id
            ? { ...task, ...patch, updatedAt: new Date().toISOString() }
            : task,
        ),
      );
    },
    [setTasks],
  );

  const deleteTask = useCallback(
    (id: string) => {
      setTasks((prev) => prev.filter((task) => task.id !== id));
    },
    [setTasks],
  );

  const toggleComplete = useCallback(
    (id: string) => {
      setTasks((prev) =>
        prev.map((task) => {
          if (task.id !== id) return task;
          const completed = task.status !== "completed";
          return {
            ...task,
            status: completed ? "completed" : "todo",
            completedAt: completed ? new Date().toISOString() : null,
            updatedAt: new Date().toISOString(),
          };
        }),
      );
    },
    [setTasks],
  );

  const togglePin = useCallback(
    (id: string) => {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === id ? { ...task, pinned: !task.pinned } : task,
        ),
      );
    },
    [setTasks],
  );

  const archiveTask = useCallback(
    (id: string) => {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === id ? { ...task, status: "archived" as TaskStatus } : task,
        ),
      );
    },
    [setTasks],
  );

  const duplicateTask = useCallback(
    (id: string) => {
      const existing = tasks.find((task) => task.id === id);
      if (!existing) return;
      addTask({
        ...existing,
        title: `${existing.title} (copy)`,
        status: "todo",
        completedAt: null,
        pinned: false,
      });
    },
    [tasks, addTask],
  );

  const setStatus = useCallback(
    (id: string, status: TaskStatus) => {
      setTasks((prev) =>
        prev.map((task) => {
          if (task.id !== id) return task;
          const completedAt = status === "completed" ? new Date().toISOString() : task.completedAt;
          return { ...task, status, completedAt, updatedAt: new Date().toISOString() };
        }),
      );
    },
    [setTasks],
  );

  const getTask = useCallback(
    (id: string) => tasks.find((task) => task.id === id),
    [tasks],
  );

  const addProject = useCallback(
    (partial: Partial<Project>): Project => {
      const now = new Date().toISOString();
      const project: Project = {
        id: uid(),
        name: partial.name ?? "",
        description: partial.description ?? "",
        icon: partial.icon ?? "folder",
        color: partial.color ?? "accent-electric",
        deadline: partial.deadline ?? null,
        category: partial.category ?? "سفارشی",
        archived: partial.archived ?? false,
        createdAt: partial.createdAt ?? now,
      };
      setProjects((prev) => [...prev, project]);
      return project;
    },
    [setProjects],
  );

  const updateProject = useCallback(
    (id: string, patch: Partial<Project>) => {
      setProjects((prev) =>
        prev.map((project) =>
          project.id === id ? { ...project, ...patch } : project,
        ),
      );
    },
    [setProjects],
  );

  const deleteProject = useCallback(
    (id: string) => {
      setProjects((prev) => prev.filter((project) => project.id !== id));
      setTasks((prev) =>
        prev.map((task) => (task.projectId === id ? { ...task, projectId: null } : task)),
      );
    },
    [setProjects, setTasks],
  );

  const archiveProject = useCallback(
    (id: string) => {
      setProjects((prev) =>
        prev.map((project) => (project.id === id ? { ...project, archived: !project.archived } : project)),
      );
    },
    [setProjects],
  );

  const addTag = useCallback(
    (name: string): Tag | null => {
      const trimmed = name.trim().replace(/^#/, "");
      if (!trimmed) return null;
      const existing = tags.find((t) => t.name.toLowerCase() === trimmed.toLowerCase());
      if (existing) return existing;
      const tag: Tag = { id: uid(), name: trimmed };
      setTags((prev) => [...prev, tag]);
      return tag;
    },
    [tags, setTags],
  );

  const deleteTag = useCallback(
    (id: string) => {
      setTags((prev) => prev.filter((tag) => tag.id !== id));
      const removed = tags.find((tag) => tag.id === id);
      if (removed) {
        setTasks((prev) =>
          prev.map((task) => ({
            ...task,
            tags: task.tags.filter((t) => t !== removed.name),
          })),
        );
      }
    },
    [tags, setTags, setTasks],
  );

  const openCreateTask = useCallback(
    (prefill?: Partial<Task>) => {
      setTaskModal({ open: true, task: null, prefill });
    },
    [],
  );

  const openEditTask = useCallback((id: string) => {
    const existing = tasks.find((task) => task.id === id);
    setTaskModal({ open: true, task: existing ?? null, prefill: undefined });
  }, [tasks]);

  const closeTaskModal = useCallback(() => {
    setTaskModal({ open: false, task: null, prefill: undefined });
  }, []);

  const openTaskDetails = useCallback((id: string) => {
    setTaskDetails({ open: true, taskId: id });
  }, []);

  const closeTaskDetails = useCallback(() => {
    setTaskDetails({ open: false, taskId: null });
  }, []);

  const openProjectModal = useCallback(() => setProjectModal(true), []);
  const closeProjectModal = useCallback(() => setProjectModal(false), []);

  const requestConfirm = useCallback((state: Omit<ConfirmState, "open">) => {
    setConfirm({ ...state, open: true });
  }, []);

  const closeConfirm = useCallback(() => {
    setConfirm((prev) => (prev ? { ...prev, open: false } : prev));
  }, []);

  const normalizedQuery = searchQuery.trim().toLocaleLowerCase();

  const searchResults = useMemo<SearchResult>(() => {
    if (!normalizedQuery) {
      return { tasks: [], projects: [], tagsFiltered: [] };
    }
    const taskMatches = tasks.filter(
      (task) =>
        task.title.toLocaleLowerCase().includes(normalizedQuery) ||
        task.description.toLocaleLowerCase().includes(normalizedQuery) ||
        task.tags.some((tag) => tag.toLocaleLowerCase().includes(normalizedQuery)),
    );
    const projectMatches = projects.filter(
      (project) =>
        project.name.toLocaleLowerCase().includes(normalizedQuery) ||
        project.description.toLocaleLowerCase().includes(normalizedQuery),
    );
    const tagMatches = tags
      .filter((tag) => tag.name.toLocaleLowerCase().includes(normalizedQuery))
      .map((tag) => tag.name);
    return { tasks: taskMatches, projects: projectMatches, tagsFiltered: tagMatches };
  }, [normalizedQuery, tasks, projects, tags]);

  useEffect(() => {
    const onKeydown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);

      if (event.key === "Escape") {
        setTaskModal((m) => (m.open ? { open: false, task: null, prefill: undefined } : m));
        setProjectModal(false);
        setConfirm(null);
        setSearchQuery("");
      }

      if (isTyping || event.ctrlKey || event.metaKey || event.altKey) return;

      if (event.key === "n" || event.key === "N") {
        event.preventDefault();
        setTaskModal({ open: true, task: null, prefill: undefined });
      } else if (event.key === "/") {
        event.preventDefault();
        const searchInput = document.getElementById("nexdo-global-search");
        searchInput?.focus();
      } else if (event.key === "t" || event.key === "T") {
        setPage("tasks");
        setSubview("today");
      } else if (event.key === "c" || event.key === "C") {
        setPage("calendar");
      } else if (event.key === "p" || event.key === "P") {
        setPage("projects");
      } else if (event.key === "a" || event.key === "A") {
        setPage("analytics");
      }
    };

    window.addEventListener("keydown", onKeydown);
    return () => window.removeEventListener("keydown", onKeydown);
  }, []);

  const value = useMemo<NexdoContextValue>(
    () => ({
      user,
      login,
      logout,
      page,
      setPage,
      subview,
      setSubview,
      selectedProjectId,
      setSelectedProjectId,
      tasks,
      projects,
      tags,
      addTask,
      updateTask,
      deleteTask,
      toggleComplete,
      togglePin,
      archiveTask,
      duplicateTask,
      setStatus,
      getTask,
      addProject,
      updateProject,
      deleteProject,
      archiveProject,
      addTag,
      deleteTag,
      taskModal,
      openCreateTask,
      openEditTask,
      closeTaskModal,
      taskDetails,
      openTaskDetails,
      closeTaskDetails,
      projectModal,
      openProjectModal,
      closeProjectModal,
      confirm,
      requestConfirm,
      closeConfirm,
      toasts,
      pushToast,
      dismissToast,
      searchQuery,
      setSearchQuery,
      searchResults,
    }),
    [
      user,
      login,
      logout,
      page,
      subview,
      selectedProjectId,
      tasks,
      projects,
      tags,
      addTask,
      updateTask,
      deleteTask,
      toggleComplete,
      togglePin,
      archiveTask,
      duplicateTask,
      setStatus,
      getTask,
      addProject,
      updateProject,
      deleteProject,
      archiveProject,
      addTag,
      deleteTag,
      taskModal,
      openCreateTask,
      openEditTask,
      closeTaskModal,
      taskDetails,
      openTaskDetails,
      closeTaskDetails,
      projectModal,
      openProjectModal,
      closeProjectModal,
      confirm,
      requestConfirm,
      closeConfirm,
      toasts,
      pushToast,
      dismissToast,
      searchQuery,
      searchResults,
    ],
  );

  return <NexdoContext.Provider value={value}>{children}</NexdoContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useNexdo(): NexdoContextValue {
  const context = useContext(NexdoContext);
  if (!context) {
    throw new Error("useNexdo must be used within a NexdoProvider");
  }
  return context;
}