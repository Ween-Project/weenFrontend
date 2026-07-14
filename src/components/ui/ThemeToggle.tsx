"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme, type ThemeMode } from "@/lib/theme-context";

const options: Array<{ value: ThemeMode; label: string; icon: typeof Sun; hint: string }> = [
  { value: "light", label: "Light", icon: Sun, hint: "Clean daytime UI" },
  { value: "dark", label: "Dark", icon: Moon, hint: "Soft night contrast" },
  { value: "system", label: "Auto", icon: Monitor, hint: "Follow device" },
];

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { mode, resolvedTheme, setMode, toggleTheme } = useTheme();
  const active = options.find((item) => item.value === mode) ?? options[2];
  const ActiveIcon = active.icon;

  if (compact) {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
        className="group grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white/75 text-slate-600 shadow-sm shadow-slate-900/5 transition hover:-translate-y-0.5 hover:bg-slate-50 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-900/75 dark:text-slate-300 dark:shadow-black/20 dark:hover:bg-slate-800 dark:hover:text-white"
      >
        {resolvedTheme === "dark" ? <Moon className="h-[18px] w-[18px]" /> : <Sun className="h-[18px] w-[18px]" />}
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 p-2 shadow-sm shadow-slate-900/5 backdrop-blur dark:border-slate-800 dark:bg-slate-950/55 dark:shadow-black/20">
      <div className="mb-2 flex items-center gap-2 px-2 text-xs font-black uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
        <ActiveIcon className="h-3.5 w-3.5" />
        Theme
      </div>
      <div className="grid grid-cols-3 gap-1">
        {options.map((item) => {
          const Icon = item.icon;
          const selected = mode === item.value;
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => setMode(item.value)}
              aria-pressed={selected}
              title={item.hint}
              className={`group flex min-w-0 flex-col items-center justify-center rounded-xl px-2 py-2 text-[11px] font-extrabold transition ${
                selected
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              }`}
            >
              <Icon className="mb-1 h-4 w-4" />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
