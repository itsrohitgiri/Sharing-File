import { useState } from "react";
import Home from "./Components/Home";
import FileUpload from "./Components/FileUpload";

function App() {
  const [choice, setChoice] = useState< | "file-upload" | "home">("home");

  const handleSelect = (choice: "home" | "file-upload") => {
    setChoice(choice);
  };

  return (
    <div>
      {choice === "home" && <Home onSelect={handleSelect} />}
      {choice === "file-upload" && <FileUpload onGoBack={() => setChoice("home")} />}
    </div>
  );
}

export default App;