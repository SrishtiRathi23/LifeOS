import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import { ChevronLeft, ChevronRight, Plus, X, Trash } from "lucide-react";
import { api, getErrorMessage } from "@/utils/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/shared/PageHeader";
import { PrintButton } from "@/components/shared/PrintButton";

type Task = {
  id: string;
  title: string;
  date: string | null;
  priority: string;
  status: string;
};

const PRIORITY_COLOR: Record<string, string> = {
  high: "bg-red-400",
  medium: "bg-amber-400",
  low: "bg-sage"
};

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function MonthlyViewPage() {
  const queryClient = useQueryClient();
  const [offset, setOffset] = useState(0);

  const baseMonth = dayjs().add(offset, "month");
  const monthStart = baseMonth.startOf("month");
  const calendarStart = monthStart.startOf("week");
  const days = Array.from({ length: 42 }).map((_, i) => calendarStart.add(i, "day"));

  const [addingDay, setAddingDay] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");

  const { data } = useQuery({
    queryKey: ["allTasks"],
    queryFn: async () => (await api.get<Task[]>("/tasks")).data
  });

  const createTask = useMutation({
    mutationFn: async (date: string) =>
      (
        await api.post("/tasks", {
          title: newTitle.trim(),
          date,
          category: "other",
          priority: "medium",
          status: "todo",
          tags: [],
          sortOrder: 0,
          isRecurring: false
        })
      ).data,
    onSuccess: () => {
      setNewTitle("");
      setAddingDay(null);
      queryClient.invalidateQueries({ queryKey: ["allTasks"] });
      queryClient.invalidateQueries({ queryKey: ["weekTasks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Task added.");
    },
    onError: (error) => toast.error(getErrorMessage(error))
  });

  const deleteTask = useMutation({
    mutationFn: async (taskId: string) => await api.delete(`/tasks/${taskId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allTasks"] });
      queryClient.invalidateQueries({ queryKey: ["weekTasks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Task deleted.");
    },
    onError: (error) => toast.error(getErrorMessage(error))
  });

  return (
    <section className="mx-auto max-w-7xl space-y-6 px-4 py-8 md:px-8">
      <PageHeader
        eyebrow="Month in view"
        title={monthStart.format("MMMM YYYY")}
        description="Click + on any day to add a task. Tasks with dates appear here automatically."
        actions={
          <>
            <button
              type="button"
              onClick={() => setOffset((o) => o - 1)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-card text-ink/70 hover:border-terracotta hover:text-terracotta transition"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => setOffset(0)}
              className="rounded-full border border-line bg-card px-4 py-1.5 text-sm text-ink/70 hover:border-terracotta hover:text-terracotta transition"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setOffset((o) => o + 1)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-card text-ink/70 hover:border-terracotta hover:text-terracotta transition"
            >
              <ChevronRight size={16} />
            </button>
            <PrintButton />
          </>
        }
      />

      {/* Weekday header row */}
      <div className="grid grid-cols-7 gap-2">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="py-1 text-center text-[11px] font-semibold uppercase tracking-widest text-ink/45">
            {label}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const iso = day.toISOString();
          const isCurrentMonth = day.month() === monthStart.month();
          const isToday = day.isSame(dayjs(), "day");
          const dayTasks = (data ?? []).filter((t) => t.date && dayjs(t.date).isSame(day, "day"));
          const isAdding = addingDay === iso;

          return (
            <Card
              key={iso}
              className={`group min-h-28 p-2.5 flex flex-col gap-1 transition-all duration-150 ${
                !isCurrentMonth ? "opacity-35" : ""
              } ${isToday ? "ring-2 ring-terracotta/60 ring-offset-1" : ""}`}
            >
              {/* Day number + add button */}
              <div className="flex items-center justify-between">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-sm font-medium leading-none ${
                    isToday ? "bg-terracotta text-white" : "text-ink"
                  }`}
                >
                  {day.format("D")}
                </span>
                <button
                  type="button"
                  title="Add task"
                  onClick={() => {
                    setAddingDay(isAdding ? null : iso);
                    setNewTitle("");
                  }}
                  className="flex h-5 w-5 items-center justify-center rounded-full border border-transparent text-ink/30 transition hover:border-terracotta hover:text-terracotta opacity-0 group-hover:opacity-100"
                >
                  {isAdding ? <X size={10} /> : <Plus size={10} />}
                </button>
              </div>

              {/* Inline add form */}
              {isAdding && (
                <div className="flex gap-1 mt-1">
                  <input
                    autoFocus
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Task…"
                    className="w-full rounded-xl border border-terracotta/50 bg-cream px-2 py-1 text-xs text-ink outline-none focus:border-terracotta"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newTitle.trim()) createTask.mutate(day.startOf("day").toISOString());
                      if (e.key === "Escape") { setAddingDay(null); setNewTitle(""); }
                    }}
                  />
                  <button
                    type="button"
                    disabled={!newTitle.trim() || createTask.isPending}
                    onClick={() => newTitle.trim() && createTask.mutate(day.startOf("day").toISOString())}
                    className="rounded-xl bg-terracotta px-2 py-1 text-[10px] text-white transition hover:opacity-90 disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
              )}

              {/* Task dots/pills */}
              <div className="mt-0.5 space-y-0.5 flex-1">
                {dayTasks.slice(0, 3).map((task) => (
                  <div
                    key={task.id}
                    className="group/task flex justify-between items-center rounded-lg bg-parchment/80 px-1.5 py-0.5 relative pr-4"
                  >
                    <div className="flex items-center gap-1 min-w-0">
                      <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${PRIORITY_COLOR[task.priority] ?? "bg-line"}`} />
                      <p className={`truncate text-[10px] leading-tight ${task.status === "done" ? "line-through text-ink/35" : "text-ink/80"}`}>
                        {task.title}
                      </p>
                    </div>
                    <button
                      type="button"
                      title="Delete task"
                      className="absolute right-1 text-terracotta/40 hover:text-terracotta opacity-0 group-hover/task:opacity-100 transition-opacity"
                      onClick={() => deleteTask.mutate(task.id)}
                    >
                      <Trash size={10} />
                    </button>
                  </div>
                ))}
                {dayTasks.length > 3 && (
                  <p className="text-[9px] text-ink/40 pl-1">+{dayTasks.length - 3} more</p>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
