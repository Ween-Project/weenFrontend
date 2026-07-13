"use client";

import { useCallback, useEffect, useRef } from "react";
import { clamp01 } from "@/lib/easing";
import { useScrollStore } from "@/lib/scrollStore";

export function LaptopScreenOverlay() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const rect = useScrollStore((state) => state.laptopRect);
  const setLaptopScrollProgress = useScrollStore((state) => state.setLaptopScrollProgress);
  const opacity = clamp01(rect.opacity);
  const visible = rect.visible && opacity > 0.04;

  const connectScrollProgress = useCallback(() => {
    cleanupRef.current?.();
    const frameWindow = iframeRef.current?.contentWindow;
    const frameDocument = iframeRef.current?.contentDocument;
    if (!frameWindow || !frameDocument) return;

    const update = () => {
      const root = frameDocument.documentElement;
      const maxScroll = Math.max(0, root.scrollHeight - frameWindow.innerHeight);
      const current = Math.min(maxScroll, Math.max(0, frameWindow.scrollY));
      setLaptopScrollProgress(maxScroll > 0 ? current / maxScroll : 1);
    };

    frameWindow.addEventListener("scroll", update, { passive: true });
    frameWindow.addEventListener("resize", update, { passive: true });
    update();

    cleanupRef.current = () => {
      frameWindow.removeEventListener("scroll", update);
      frameWindow.removeEventListener("resize", update);
    };
  }, [setLaptopScrollProgress]);

  useEffect(() => () => cleanupRef.current?.(), []);

  useEffect(() => {
    if (!visible) setLaptopScrollProgress(0);
  }, [setLaptopScrollProgress, visible]);

  // A small optical inset keeps the DOM surface inside the modeled black bezel.
  const insetX = 0;
  const insetY = 0;

  return (
    <section
      aria-hidden={!visible}
      aria-label="Ween landing page on laptop"
      className="fixed z-20 overflow-hidden bg-white transition-opacity duration-150 ease-out"
      style={{
        left: rect.x + insetX,
        top: rect.y + insetY,
        width: Math.max(0, rect.width - insetX * 2),
        height: Math.max(0, rect.height - insetY * 2),
        opacity,
        pointerEvents: visible ? "auto" : "none",
        transform: "translateZ(0)"
      }}
    >
      <iframe
        ref={iframeRef}
        src="/landing-embed"
        title="Ween landing page"
        className="block h-full w-full border-0 bg-white"
        onLoad={connectScrollProgress}
      />
    </section>
  );
}
