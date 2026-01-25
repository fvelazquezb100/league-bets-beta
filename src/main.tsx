import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import 'intro.js/introjs.css'

// Apply theme immediately from localStorage before React mounts to prevent flash
const applyInitialTheme = () => {
  const storedTheme = localStorage.getItem('jambol-theme') as 'light' | 'dark' | null;
  const root = document.documentElement;
  if (storedTheme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};

// Apply theme synchronously before React renders
applyInitialTheme();

createRoot(document.getElementById("root")!).render(<App />);
