"use client";

import { useProgress } from "@react-three/drei";
import gsap from "gsap";
import { useEffect, useRef, useState } from "react";
import { WLetterMask } from "./WLetterMask";

export function Loader() {
  const { progress } = useProgress();
  const [displayProgress, setDisplayProgress] = useState(0);
  const [documentReady, setDocumentReady] = useState(false);
  const [complete, setComplete] = useState(false);
  const [hidden, setHidden] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);
  const tweenRef = useRef<ReturnType<typeof gsap.to> | null>(null);
  const completionTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const displayRef = useRef({ value: 0 });
  const completionStartedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const markReady = () => {
      if (!cancelled) {
        setDocumentReady(true);
      }
    };

    const fontReady =
      typeof document !== "undefined" && "fonts" in document
        ? document.fonts.ready.then(markReady)
        : Promise.resolve().then(markReady);

    const fallback = window.setTimeout(markReady, 1200);

    if (document.readyState === "complete") {
      markReady();
    } else {
      window.addEventListener("load", markReady, { once: true });
    }

    return () => {
      cancelled = true;
      window.clearTimeout(fallback);
      window.removeEventListener("load", markReady);
      void fontReady;
    };
  }, []);

  useEffect(() => {
    const targetProgress = documentReady
      ? Math.max(progress, 100)
      : Math.min(Math.max(progress, 0), 92);

    tweenRef.current?.kill();
    tweenRef.current = gsap.to(displayRef.current, {
      value: targetProgress,
      duration: 0.42,
      ease: "power2.out",
      onUpdate: () => setDisplayProgress(displayRef.current.value)
    });
  }, [documentReady, progress]);

  useEffect(() => {
    if (!documentReady || displayProgress < 99.6 || completionStartedRef.current) {
      return;
    }

    completionStartedRef.current = true;
    setComplete(true);

    completionTimelineRef.current = gsap.timeline({
      onComplete: () => setHidden(true)
    });

    completionTimelineRef.current
      .to(loaderRef.current, { duration: 0.2, scale: 1.02, ease: "power2.out" })
      .to(loaderRef.current, {
        duration: 0.6,
        opacity: 0,
        scale: 1.05,
        ease: "power2.inOut"
      });
  }, [displayProgress, documentReady]);

  useEffect(() => {
    return () => {
      completionTimelineRef.current?.kill();
    };
  }, []);

  if (hidden) {
    return null;
  }

  return (
    <div
      ref={loaderRef}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background text-text-main"
      aria-live="polite"
      aria-busy={!complete}
    >
      <WLetterMask progress={displayProgress} complete={complete} />
      <p className="mt-6 tabular-nums text-small text-text-secondary">
        {Math.round(displayProgress)}%
      </p>
    </div>
  );
}
