import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export function useKeyboardShortcuts(onPrint?: () => void, onNewTask?: () => void) {
  const navigate = useNavigate();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const isMeta = event.metaKey || event.ctrlKey;
      if (!isMeta) return;

      const key = event.key.toLowerCase();

      if (key === "d") {
        event.preventDefault();
        navigate("/diary");
      }

      if (key === "p" && onPrint) {
        event.preventDefault();
        onPrint();
      }

      if (key === "n" && onNewTask) {
        event.preventDefault();
        onNewTask();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [navigate, onNewTask, onPrint]);
}
