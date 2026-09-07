import Notes from "./components/Notes";
import AIVoiceNoteModal from "./components/AIVoiceNoteModal";
import "./App.css";
import { NotesProvider } from "./contexts/NotesContexts";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <>
      <NotesProvider>
        <div className="min-h-screen bg-black px-4 py-10 sm:px-6">
          <Notes />
          <AIVoiceNoteModal />
        </div>
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
    </>
  );
}

export default App;
