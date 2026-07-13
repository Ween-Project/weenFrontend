"use client";

import { useScrollStore } from "@/lib/scrollStore";

export function ScrollProgress() {
  const progress = useScrollStore((state) => state.progress);
  const laptopProgress = useScrollStore((state) => state.laptopScrollProgress);
  const laptopVisible = useScrollStore(
    (state) => state.laptopRect.visible && state.laptopRect.opacity > 0.08
  );
  const displayedProgress = laptopVisible ? laptopProgress : progress;

  return (
    <div className="pointer-events-none fixed right-5 top-1/2 z-30 hidden -translate-y-1/2 items-center gap-3 md:flex">
      <div className="h-40 w-px overflow-hidden rounded-full bg-border">
        <div
          className="w-full rounded-full bg-primary transition-[height] duration-300 ease-out"
          style={{ height: `${Math.round(displayedProgress * 100)}%` }}
        />
      </div>
      <span className="min-w-10 text-small font-semibold tabular-nums text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.65)]">
        {Math.round(displayedProgress * 100)}%
      </span>
    </div>
  );
}
