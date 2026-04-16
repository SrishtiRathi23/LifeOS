import { useState, useEffect } from "react";

export function usePersistentState<T>(key: string, initialValue: T): [T, (val: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (e) {
      // Ignore quota limits or other storage issues
    }
  }, [key, state]);

  // Provide a reset helper implicitly or just return classic tuple
  return [state, setState];
}
