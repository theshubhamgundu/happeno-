"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type Theme = "light" | "dark";

const applyTheme = (theme: Theme) => {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("tricity-theme", theme);
};

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const savedTheme = localStorage.getItem("tricity-theme") as Theme | null;
    const preferredTheme = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    const nextTheme = savedTheme ?? preferredTheme;
    setTheme(nextTheme);
    applyTheme(nextTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    applyTheme(nextTheme);
  };

  const isLight = theme === "light";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isLight ? "dark" : "light"} mode`}
      title={`Switch to ${isLight ? "dark" : "light"} mode`}
      className="fixed right-4 top-4 z-[100] flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-[#13001F]/85 text-[#FFEE00] shadow-lg backdrop-blur-xl transition-transform duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#FFEE00] focus:ring-offset-2 focus:ring-offset-black"
    >
      {isLight ? <Moon size={19} /> : <Sun size={20} />}
    </button>
  );
}
