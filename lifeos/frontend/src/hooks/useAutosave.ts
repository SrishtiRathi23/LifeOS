import { useEffect, useRef } from "react";

export function useAutosave(callback: () => void, deps: unknown[], delay = 500, enabled = true) {
  const firstRun = useRef(true);

  useEffect(() => {
    if (!enabled) return;
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }

    const timeout = window.setTimeout(() => {
      callback();
    }, delay);

    return () => window.clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
