import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Set the page title
document.title = "Campus Connect - Anonymous College Chat";

// Add Inter font
const linkElement = document.createElement("link");
linkElement.rel = "stylesheet";
linkElement.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap";
document.head.appendChild(linkElement);

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<App />);
}
