import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Apply saved theme before render to prevent flash
const saved = localStorage.getItem("theme");
const theme = saved === "dark" || saved === "light" ? saved : "dark";
document.documentElement.setAttribute("data-theme", theme);

createRoot(document.getElementById("root")!).render(<App />);
