"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number; // 0-based index
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

export function Pagination({ currentPage, totalPages, onPageChange, isLoading = false }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages: (number | string)[] = [];
  const maxVisiblePages = 5;

  if (totalPages <= maxVisiblePages) {
    for (let i = 0; i < totalPages; i++) {
      pages.push(i);
    }
  } else {
    // Always include page 0
    pages.push(0);

    let start = Math.max(1, currentPage - 1);
    let end = Math.min(totalPages - 2, currentPage + 1);

    if (currentPage <= 2) {
      end = 3;
    } else if (currentPage >= totalPages - 3) {
      start = totalPages - 4;
    }

    if (start > 1) {
      pages.push("...");
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < totalPages - 2) {
      pages.push("...");
    }

    // Always include last page
    pages.push(totalPages - 1);
  }

  return (
    <nav className="flex items-center justify-center gap-1.5 py-4 select-none" aria-label="Pagination">
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 0 || isLoading}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white"
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {pages.map((p, idx) => {
        if (typeof p === "string") {
          return (
            <span
              key={`ellipses-${idx}`}
              className="flex h-9 w-9 items-center justify-center text-sm font-semibold text-slate-400"
            >
              {p}
            </span>
          );
        }

        const active = p === currentPage;
        return (
          <button
            key={`page-${p}`}
            type="button"
            onClick={() => onPageChange(p)}
            disabled={isLoading}
            className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold transition-all ${
              active
                ? "bg-[#047857] text-white shadow-sm"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {p + 1}
          </button>
        );
      })}

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages - 1 || isLoading}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white"
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}
