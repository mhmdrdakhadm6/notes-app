import Notes from "./components/Notes";
import "./App.css";
import {  NotesProvider } from "./contexts/NotesContexts";

function App() {
  return (
    <>
      <NotesProvider>
        <div className="min-h-screen bg-black px-4 py-10 sm:px-6">
          <Notes />
        </div>
      </NotesProvider>
    </>
  );
}

export default App;
