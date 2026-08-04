import Notes from "./components/Notes";
import "./App.css";
import {  NotesProvider } from "./contexts/NotesContexts";

function App() {
  return (
    <>
      <NotesProvider>
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#162033_0%,_#0b0f19_45%,_#05070d_100%)] px-4 py-10 sm:px-6">
          <Notes />
        </div>
      </NotesProvider>
    </>
  );
}

export default App;
