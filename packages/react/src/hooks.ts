"use client";
import { useCallback, useEffect, useRef, useState } from "react";

export function useBugKit() {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => {
    setIsOpen(true);
    // Trigger widget open if available
    if (typeof window !== "undefined" && (window as any).BugKit) {
      (window as any).BugKit.open?.();
    }
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    if (typeof window !== "undefined" && (window as any).BugKit) {
      (window as any).BugKit.close?.();
    }
  }, []);

  return { isOpen, open, close };
}
