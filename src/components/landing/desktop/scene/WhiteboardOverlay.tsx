"use client";

import { useRouter } from "next/navigation";
import { clamp01, remap, smootherstep } from "@/lib/easing";
import { useScrollStore } from "@/lib/scrollStore";

export function WhiteboardOverlay() {
  const router = useRouter();
  const progress = useScrollStore((state) => state.progress);
  const rect = useScrollStore((state) => state.whiteboardRect);
  const reveal = smootherstep(remap(progress, 0.92, 1));
  const opacity = clamp01(rect.opacity * reveal);
  const visible = rect.visible || opacity > 0.04;

  return (
    <div
      className="whiteboard-marker fixed z-30 overflow-hidden text-[#26332B] transition-opacity duration-200"
      aria-hidden={!visible}
      aria-label="Ween idea whiteboard"
      style={{
        left: rect.x,
        top: rect.y,
        width: rect.width,
        height: rect.height,
        opacity,
        pointerEvents: visible ? "auto" : "none"
      }}
    >
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 760 430" role="img" aria-label="Handwritten Ween project notes with arrows pointing to the clickable Ween title">
        <defs>
          <marker id="clickArrow" markerWidth="12" markerHeight="12" refX="9" refY="5" orient="auto">
            <path d="M0 0L10 5L0 10" fill="none" stroke="#D7683C" strokeWidth="2.3" />
          </marker>
          <filter id="markerRough"><feTurbulence baseFrequency="0.025" numOctaves="1" seed="7" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="1.1"/></filter>
        </defs>

        <g fill="none" strokeLinecap="round" strokeLinejoin="round" filter="url(#markerRough)" style={{opacity:reveal}}>
          <path d="M176 104C244 122 282 146 321 178" stroke="#D7683C" strokeWidth="6" markerEnd="url(#clickArrow)" />
          <path d="M600 104C526 122 486 146 443 178" stroke="#D7683C" strokeWidth="6" markerEnd="url(#clickArrow)" />
          <path d="M374 337C378 289 380 267 381 240" stroke="#D7683C" strokeWidth="6" markerEnd="url(#clickArrow)" />
          <path d="M285 169q92-44 195 6l-10 88q-96 39-190-5z" stroke="#43885A" strokeWidth="7" />
        </g>

        <g fill="#29372E" style={{opacity:reveal}}>
          <text x="52" y="55" fontSize="25" fontWeight="700">my next idea...</text>
          <text x="522" y="54" fontSize="20" fontWeight="700">social impact ✓</text>

          <text x="380" y="221" textAnchor="middle" fontSize="68" fontWeight="800" fill="#347C4D">Ween</text>
          <text x="380" y="247" textAnchor="middle" fontSize="15">discover • volunteer • prove impact</text>

          <text x="67" y="132" fontSize="19" fontWeight="700">FOR WHO?</text>
          <text x="67" y="159" fontSize="15">students + young people</text>
          <text x="67" y="184" fontSize="15">NGOs + university clubs</text>
          <text x="67" y="209" fontSize="15">event organizers</text>

          <text x="548" y="132" fontSize="19" fontWeight="700">HOW?</text>
          <text x="548" y="159" fontSize="15">QR check-in</text>
          <text x="548" y="184" fontSize="15">verified hours</text>
          <text x="548" y="209" fontSize="15">digital certificates</text>

          <text x="67" y="310" fontSize="18" fontWeight="700" fill="#B75A35">Ween Coins ★</text>
          <text x="67" y="336" fontSize="15">rewards + milestones</text>
          <text x="530" y="310" fontSize="18" fontWeight="700" fill="#B75A35">Impact Profile</text>
          <text x="530" y="336" fontSize="15">a trusted portfolio</text>

          <text x="380" y="374" textAnchor="middle" fontSize="20" fontWeight="700" fill="#D7683C">↑ CLICK WEEN ↑</text>
          <text x="380" y="405" textAnchor="middle" fontSize="14">one ecosystem — real work, real proof</text>
        </g>
      </svg>

      <button
        type="button"
        aria-label="Click Ween to log in"
        className="absolute left-1/2 top-[49%] h-[26%] w-[30%] -translate-x-1/2 -translate-y-1/2 rounded-[45%] outline-none transition hover:bg-[#65B77B]/10 focus-visible:ring-4 focus-visible:ring-[#347C4D]/50"
        onClick={() => router.push("/login")}
      />
    </div>
  );
}
