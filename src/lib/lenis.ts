"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

type SmoothScrollOptions = {
  track: HTMLElement;
  onUpdate: (progress: number) => void;
};

export function createSmoothScroll({ track, onUpdate }: SmoothScrollOptions) {
  gsap.registerPlugin(ScrollTrigger);

  const lenis = new Lenis({
    lerp: 0.08,
    smoothWheel: true,
    wheelMultiplier: 0.85,
    touchMultiplier: 1.08
  });

  lenis.on("scroll", ScrollTrigger.update);

  ScrollTrigger.scrollerProxy(document.body, {
    scrollTop(value?: number) {
      if (typeof value === "number") {
        lenis.scrollTo(value, { immediate: true });
      }

      return window.scrollY || document.documentElement.scrollTop;
    },
    getBoundingClientRect() {
      return {
        top: 0,
        left: 0,
        width: window.innerWidth,
        height: window.innerHeight
      };
    },
    pinType: "fixed"
  });

  const trigger = ScrollTrigger.create({
    trigger: track,
    start: "top top",
    end: "bottom bottom",
    scrub: true,
    onUpdate: (self) => onUpdate(self.progress)
  });

  const tick = (time: number) => {
    lenis.raf(time * 1000);
  };

  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);
  ScrollTrigger.refresh();

  return () => {
    trigger.kill();
    ScrollTrigger.clearScrollMemory();
    gsap.ticker.remove(tick);
    lenis.destroy();
  };
}
