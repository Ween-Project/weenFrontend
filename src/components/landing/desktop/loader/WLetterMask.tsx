type WLetterMaskProps = {
  progress: number;
  complete: boolean;
};

const W_PATH =
  "M18 18H55L72 111L105 18H136L169 111L186 18H222L191 162H157L120 59L83 162H49L18 18Z";

export function WLetterMask({ progress, complete }: WLetterMaskProps) {
  const topInset = `${100 - progress}%`;
  const waveTop = `${100 - progress}%`;

  return (
    <div
      className="relative h-[180px] w-[240px]"
      style={{
        filter: complete ? "drop-shadow(0 0 26px rgba(32, 191, 107, 0.5))" : "none"
      }}
    >
      <svg
        viewBox="0 0 240 180"
        className="absolute inset-0 h-full w-full"
        role="img"
        aria-label="Ween loading mark"
      >
        <path
          d={W_PATH}
          fill="none"
          stroke="#1F2937"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>

      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(${topInset} 0% 0% 0%)` }}
      >
        <svg viewBox="0 0 240 180" className="h-full w-full" aria-hidden="true">
          <path d={W_PATH} fill="#20BF6B" />
        </svg>
      </div>

      {progress > 3 && progress < 99 ? (
        <div
          className="pointer-events-none absolute left-0 h-4 w-full overflow-hidden"
          style={{ top: waveTop, transform: "translateY(-55%)" }}
        >
          <svg
            viewBox="0 0 360 18"
            className="h-full w-[150%] animate-liquid-shift"
            aria-hidden="true"
          >
            <path
              d="M0 9C22 3 42 3 64 9C86 15 106 15 128 9C150 3 170 3 192 9C214 15 234 15 256 9C278 3 298 3 320 9C340 14 352 14 360 9V18H0V9Z"
              fill="#3ED085"
            />
          </svg>
        </div>
      ) : null}
    </div>
  );
}
