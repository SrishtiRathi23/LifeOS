import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(window.navigator.onLine);

  useEffect(() => {
    function onOnline() {
      setIsOnline(true);
      toast.success("You’re back online.");
    }

    function onOffline() {
      setIsOnline(false);
      toast.error("You’re offline right now. Changes may not sync.");
    }

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  return isOnline;
}
