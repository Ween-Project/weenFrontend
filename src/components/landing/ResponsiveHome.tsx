"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { LandingContent } from "./LandingContent";

const DesktopExperience = dynamic(
  () => import("@/components/landing/desktop/HomeExperience").then((module) => module.HomeExperience),
  { ssr: false }
);

export function ResponsiveHome() {
  const [mounted, setMounted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(query.matches);
    setMounted(true);

    const update = () => {
      setIsDesktop(query.matches);
      window.scrollTo({ top: 0, behavior: "auto" });
    };

    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  if (!mounted) {
    return <div className="min-h-screen bg-white" />;
  }

  return isDesktop ? <DesktopExperience /> : <LandingContent />;
}
