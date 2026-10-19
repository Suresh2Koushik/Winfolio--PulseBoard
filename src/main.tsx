import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// v1 is light-only. Clear a dark-mode choice saved by the earlier theme toggle.
document.documentElement.classList.remove("dark");
try {
  localStorage.removeItem("theme");
} catch {
  // Storage can be unavailable (private mode); nothing to clear then.
}

createRoot(document.getElementById("root")!).render(<App />);
