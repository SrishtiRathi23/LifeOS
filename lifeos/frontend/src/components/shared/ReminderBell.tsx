import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { Bell, BellRing, Check, Crown } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/utils/api";
import { useSession } from "@/hooks/useSession";

type Reminder = {
  id: string;
  title: string;
  source: string;
  dueAt: string;
  remindAt: string;
};

type ReminderResponse = {
  preference: {
    enabled: boolean;
    dailyDigestTime: string;
    remindBeforeDays: number[];
  };
  reminders: Reminder[];
};

export function ReminderBell() {
  const [open, setOpen] = useState(false);
  const session = useSession();
  const queryClient = useQueryClient();
  const isPremium = Boolean(session.data?.entitlements?.isPremium);

  const reminders = useQuery({
    queryKey: ["reminders"],
    queryFn: async () => (await api.get<ReminderResponse>("/reminders")).data,
    refetchInterval: 60 * 1000
  });

  const dueSoon = useMemo(
    () =>
      (reminders.data?.reminders ?? []).filter((reminder) =>
        dayjs(reminder.remindAt).isBefore(dayjs().add(1, "minute"))
      ),
    [reminders.data]
  );

  const dismiss = useMutation({
    mutationFn: async (id: string) => api.post(`/reminders/${id}/dismiss`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reminders"] })
  });

  useEffect(() => {
    if (!dueSoon.length) return;

    const first = dueSoon[0];
    toast(`${first.title} is due ${dayjs(first.dueAt).format("MMM D")}`, { icon: "!" });

    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("LifeOS reminder", {
        body: `${first.title} is due ${dayjs(first.dueAt).format("MMM D, h:mm A")}`,
        tag: first.id
      });
    }
  }, [dueSoon]);

  async function enableBrowserNotifications() {
    if (!("Notification" in window)) {
      toast.error("This browser does not support notifications.");
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      toast.success("Deadline notifications are on.");
    }
  }

  const count = reminders.data?.reminders.length ?? 0;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative flex h-11 w-11 items-center justify-center rounded-full border border-line bg-card text-ink transition hover:shadow-glow"
        aria-label="Open reminders"
      >
        {dueSoon.length ? <BellRing size={18} className="text-terracotta" /> : <Bell size={18} />}
        {count > 0 && (
          <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-terracotta px-1.5 text-[11px] font-bold leading-5 text-white">
            {Math.min(count, 9)}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-14 z-50 w-[min(calc(100vw-2rem),24rem)] rounded-lg border border-line bg-card p-4 text-left shadow-2xl">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-ink">Reminders</p>
              <p className="text-xs text-ink/55">
                {isPremium ? "Premium reminders active" : "Free plan: 1-day reminders"}
              </p>
            </div>
            {!isPremium && <Crown size={18} className="text-terracotta" />}
          </div>

          <button
            type="button"
            onClick={enableBrowserNotifications}
            className="mt-3 w-full rounded-lg border border-line bg-cream px-3 py-2 text-xs font-medium text-ink"
          >
            Enable phone/browser alerts
          </button>

          <div className="mt-3 max-h-72 space-y-2 overflow-y-auto">
            {(reminders.data?.reminders ?? []).length === 0 ? (
              <p className="rounded-lg bg-cream p-3 text-sm text-ink/60">No upcoming dated items yet.</p>
            ) : (
              reminders.data!.reminders.slice(0, 8).map((reminder) => (
                <div key={reminder.id} className="rounded-lg border border-line bg-cream p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-ink">{reminder.title}</p>
                      <p className="mt-1 text-xs capitalize text-ink/55">
                        {reminder.source} - due {dayjs(reminder.dueAt).format("MMM D")}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => dismiss.mutate(reminder.id)}
                      className="rounded-full p-1 text-ink/45 hover:bg-card hover:text-terracotta"
                      aria-label="Dismiss reminder"
                    >
                      <Check size={15} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
