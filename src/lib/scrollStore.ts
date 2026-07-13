import { create } from "zustand";

export type ScreenRect = {
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
  visible: boolean;
};

type ScrollState = {
  progress: number;
  rawProgress: number;
  laptopScrollProgress: number;
  reducedMotion: boolean;
  laptopRect: ScreenRect;
  whiteboardRect: ScreenRect;
  setProgress: (progress: number) => void;
  setLaptopScrollProgress: (progress: number) => void;
  setReducedMotion: (reducedMotion: boolean) => void;
  setLaptopRect: (rect: ScreenRect) => void;
  setWhiteboardRect: (rect: ScreenRect) => void;
};

const EMPTY_RECT: ScreenRect = {
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  opacity: 0,
  visible: false
};

export const useScrollStore = create<ScrollState>((set) => ({
  progress: 0,
  rawProgress: 0,
  laptopScrollProgress: 0,
  reducedMotion: false,
  laptopRect: EMPTY_RECT,
  whiteboardRect: EMPTY_RECT,
  setProgress: (progress) =>
    set({
      rawProgress: progress,
      progress: Math.min(1, Math.max(0, progress))
    }),
  setLaptopScrollProgress: (laptopScrollProgress) =>
    set({ laptopScrollProgress: Math.min(1, Math.max(0, laptopScrollProgress)) }),
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
  setLaptopRect: (laptopRect) => set({ laptopRect }),
  setWhiteboardRect: (whiteboardRect) => set({ whiteboardRect })
}));
