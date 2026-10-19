import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { applyTheme } from "./lib/theme";
import "./index.css";

// Apply the saved light/dark choice before the first paint to avoid a flash.
applyTheme(window.location.pathname);
try {
  localStorage.removeItem("theme"); // left over from the old theme toggle
} catch {
  // Storage can be unavailable (private mode); nothing to clear then.
}

createRoot(document.getElementById("root")!).render(<App />);
