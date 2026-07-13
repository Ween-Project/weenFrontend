"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import { createSmoothScroll } from "@/lib/lenis";
import { useScrollStore } from "@/lib/scrollStore";
import { clamp01, remap, smootherstep } from "@/lib/easing";
import { Loader } from "@/components/landing/desktop/loader/Loader";
import { LaptopScreenOverlay } from "@/components/landing/desktop/scene/LaptopScreenOverlay";
import { WhiteboardOverlay } from "@/components/landing/desktop/scene/WhiteboardOverlay";
import { ScrollProgress } from "@/components/ui/ScrollProgress";

const RoomCanvas = dynamic(() => import("@/components/landing/desktop/scene/RoomCanvas"), {
  ssr: false
});

function IntroOverlay() {
  const progress = useScrollStore((state) => state.progress);
  const visibility = 1 - smootherstep(remap(progress, 0.04, 0.22));

  return (
    <header
      className="pointer-events-none fixed left-0 top-0 z-20 w-full pt-8 text-text-main md:pt-10"
      style={{
        opacity: clamp01(visibility),
        transform: `translateY(${(1 - visibility) * -16}px)`
      }}
    >
      <div className="container-grid">
      </div>
    </header>
  );
}

export function HomeExperience() {
  const trackRef = useRef<HTMLDivElement>(null);
  const setProgress = useScrollStore((state) => state.setProgress);
  const setReducedMotion = useScrollStore((state) => state.setReducedMotion);

  useEffect(() => {
    const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(reduceMotionQuery.matches);

    const handleMotionChange = (event: MediaQueryListEvent) => {
      setReducedMotion(event.matches);
    };

    reduceMotionQuery.addEventListener("change", handleMotionChange);

    return () => reduceMotionQuery.removeEventListener("change", handleMotionChange);
  }, [setReducedMotion]);

  useEffect(() => {
    if (!trackRef.current) {
      return;
    }

    return createSmoothScroll({
      track: trackRef.current,
      onUpdate: setProgress
    });
  }, [setProgress]);

  return (
    <main
      data-lenis-smooth
      className="relative min-h-screen overflow-x-hidden bg-background text-text-main"
    >
      <RoomCanvas />
      <IntroOverlay />
      <LaptopScreenOverlay />
      <WhiteboardOverlay />
      <ScrollProgress />
      <div ref={trackRef} className="h-[800vh]" aria-hidden="true" />
      <Loader />
    </main>
  );
}
