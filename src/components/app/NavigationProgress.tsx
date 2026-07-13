"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function NavigationProgress() {
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  useEffect(() => {
    setActive(false);
  }, [pathname]);
  useEffect(() => {
    const handle = (event: MouseEvent) => {
      const link = (event.target as HTMLElement).closest("a");
      if (
        !link ||
        link.target === "_blank" ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey
      )
        return;
      const url = new URL(link.href, window.location.href);
      if (
        url.origin === window.location.origin &&
        url.pathname !== window.location.pathname
      )
        setActive(true);
    };
    document.addEventListener("click", handle, true);
    return () => document.removeEventListener("click", handle, true);
  }, []);
  return active ? (
    <div className="fixed inset-x-0 top-0 z-[200] h-1 overflow-hidden bg-emerald-100">
      <span className="block h-full w-1/2 animate-[route-progress_1s_ease-in-out_infinite] bg-emerald-600" />
    </div>
  ) : null;
}
