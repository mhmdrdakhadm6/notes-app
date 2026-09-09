import { Toaster } from "react-hot-toast";
import AIVoiceNoteModal from "./components/AIVoiceNoteModal";
import "./App.css";
import { NotesProvider } from "./contexts/NotesContexts";
import { AIChatProvider } from "./contexts/AIChatContext";
import { NexdoProvider, useNexdo } from "./contexts/NexdoContext";
import { Sidebar } from "./components/nexdo/Sidebar";
import { TopBar } from "./components/nexdo/TopBar";
import { MobileNav } from "./components/nexdo/MobileNav";
import { Dashboard } from "./components/nexdo/Dashboard";
import { TasksPage } from "./components/nexdo/TasksPage";
import { CalendarPage } from "./components/nexdo/CalendarPage";
import { ProjectsPage } from "./components/nexdo/ProjectsPage";
import { NotesPage } from "./components/nexdo/NotesPage";
import { AnalyticsPage } from "./components/nexdo/AnalyticsPage";
import { SettingsPage } from "./components/nexdo/SettingsPage";
import { HelpPage } from "./components/nexdo/HelpPage";
import { ProfilePage } from "./components/nexdo/ProfilePage";
import { AuthPage } from "./components/nexdo/AuthPage";
import { TaskModal } from "./components/nexdo/TaskModal";
import { TaskDetailsModal } from "./components/nexdo/TaskDetailsModal";
import { ProjectModal } from "./components/nexdo/ProjectModal";
import { ConfirmDialog } from "./components/nexdo/ConfirmDialog";
import { Toasts } from "./components/nexdo/Toasts";

function Workspace() {
  const { page, user } = useNexdo();

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div dir="rtl" className="nexdo flex min-h-[100dvh] bg-canvas-base text-text-primary">
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main id="nexdo-main" className="min-w-0 flex-1 pb-20 lg:pb-6">
          {page === "dashboard" && <Dashboard />}
          {page === "tasks" && <TasksPage />}
          {page === "calendar" && <CalendarPage />}
          {page === "projects" && <ProjectsPage />}
          {page === "notes" && <NotesPage />}
          {page === "analytics" && <AnalyticsPage />}
          {page === "settings" && <SettingsPage />}
          {page === "help" && <HelpPage />}
          {page === "profile" && <ProfilePage />}
        </main>
      </div>

      <MobileNav />

      <TaskModal />
      <TaskDetailsModal />
      <ProjectModal />
      <ConfirmDialog />
      <Toasts />
    </div>
  );
}

function App() {
  return (
    <NotesProvider>
      <AIChatProvider>
        <NexdoProvider>
          <Workspace />
          <AIVoiceNoteModal />
        </NexdoProvider>
      </AIChatProvider>
      <Toaster
        position="top-center"
        reverseOrder={false}
        gutter={10}
        toastOptions={{
          duration: 2400,
          style: {
            background: "rgba(10,10,10,.95)",
            color: "#f8fafc",
            border: "1px solid rgba(9,60,200,.2)",
            borderRadius: "18px",
            padding: "14px 18px",
            backdropFilter: "blur(14px)",
            boxShadow: "0 20px 60px rgba(0,0,0,.45)",
            fontSize: "13px",
            fontWeight: 500,
          },
          success: {
            iconTheme: {
              primary: "#093cc8",
              secondary: "#0a0a0a",
            },
            style: {
              border: "1px solid rgba(9,60,200,.3)",
            },
          },
          error: {
            iconTheme: {
              primary: "#ef4444",
              secondary: "#0a0a0a",
            },
            style: {
              border: "1px solid rgba(239,68,68,.18)",
            },
          },
        }}
      />
    </NotesProvider>
  );
}

export default App;