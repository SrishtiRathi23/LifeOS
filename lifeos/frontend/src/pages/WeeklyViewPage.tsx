import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import { Plus, X, Trash } from "lucide-react";
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
  category: string;
  priority: string;
  status: string;
};

const PRIORITY_DOT: Record<string, string> = {
  high: "bg-red-400",
  medium: "bg-amber-400",
  low: "bg-sage"
};

export function WeeklyViewPage() {
  const queryClient = useQueryClient();
  const weekStart = dayjs().startOf("week").toISOString();
  const days = Array.from({ length: 7 }).map((_, i) => dayjs(weekStart).add(i, "day"));

  const [addingDay, setAddingDay] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");

  const { data } = useQuery({
    queryKey: ["weekTasks", weekStart],
    queryFn: async () => (await api.get<Task[]>("/tasks/week", { params: { start: weekStart } })).data
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
      queryClient.invalidateQueries({ queryKey: ["weekTasks"] });
      queryClient.invalidateQueries({ queryKey: ["allTasks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Task added.");
    },
    onError: (error) => toast.error(getErrorMessage(error))
  });

  const deleteTask = useMutation({
    mutationFn: async (taskId: string) => await api.delete(`/tasks/${taskId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weekTasks"] });
      queryClient.invalidateQueries({ queryKey: ["allTasks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Task deleted.");
    },
    onError: (error) => toast.error(getErrorMessage(error))
  });

  return (
    <section className="mx-auto max-w-7xl space-y-6 px-4 py-8 md:px-8">
      <PageHeader
        eyebrow="Week at a glance"
        title={`${dayjs(weekStart).format("D MMM")} – ${dayjs(weekStart).endOf("week").format("D MMM YYYY")}`}
        description="Your weekly calendar — click + on any day to add a task directly."
        actions={<PrintButton />}
      />

      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-8 scrollbar-hide">
        {days.map((day) => {
          const iso = day.toISOString();
          const isToday = day.isSame(dayjs(), "day");
          const dayTasks = (data ?? []).filter((t) => t.date && dayjs(t.date).isSame(day, "day"));
          const isAdding = addingDay === iso;

          return (
            <Card
              key={iso}
              style={{ resize: "both" }}
              className={`flex w-full shrink-0 snap-center flex-col gap-3 overflow-auto min-h-[300px] sm:w-[280px] md:w-[300px] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-terracotta/30 ${isToday ? "ring-2 ring-terracotta/60 ring-offset-1" : ""}`}
            >
              {/* Day header */}
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-serif text-2xl italic text-ink">{day.format("ddd")}</p>
                  <p className={`text-sm font-medium ${isToday ? "text-terracotta" : "text-ink/50"}`}>
                    {isToday ? "Today · " : ""}{day.format("D MMM")}
                  </p>
                </div>
                <button
                  type="button"
                  title="Add task"
                  onClick={() => {
                    setAddingDay(isAdding ? null : iso);
                    setNewTitle("");
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-line bg-parchment text-ink/60 transition hover:border-terracotta hover:text-terracotta"
                >
                  {isAdding ? <X size={13} /> : <Plus size={13} />}
                </button>
              </div>

              {/* Inline add form */}
              {isAdding && (
                <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-2">
                  <Input
                    autoFocus
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Type task here…"
                    className="w-full text-base"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newTitle.trim()) createTask.mutate(day.startOf("day").toISOString());
                      if (e.key === "Escape") { setAddingDay(null); setNewTitle(""); }
                    }}
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setAddingDay(null)}
                      className="px-3 py-1.5 text-xs text-ink/60"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={() => newTitle.trim() && createTask.mutate(day.startOf("day").toISOString())}
                      disabled={!newTitle.trim() || createTask.isPending}
                      className="px-4 py-1.5 text-xs"
                    >
                      Add Task
                    </Button>
                  </div>
                </div>
              )}

              {/* Task list */}
              <div className="flex-1 space-y-1.5">
                {dayTasks.length === 0 ? (
                  <p className="text-xs text-ink/35 italic">{isAdding ? "" : "Nothing yet."}</p>
                ) : (
                  dayTasks.map((task) => (
                    <div key={task.id} className="group/task relative flex items-start gap-2 rounded-2xl border border-line bg-cream/70 px-3 py-2 pr-8">
                      <span className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${PRIORITY_DOT[task.priority] ?? "bg-line"}`} />
                      <div className="min-w-0 flex-1">
                        <p className={`truncate text-sm ${task.status === "done" ? "line-through text-ink/40" : "text-ink"}`}>
                          {task.title}
                        </p>
                        <p className="text-[10px] uppercase tracking-[0.12em] text-ink/45">{task.category}</p>
                      </div>
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-terracotta/40 hover:text-terracotta opacity-0 group-hover/task:opacity-100 transition-opacity"
                        onClick={() => deleteTask.mutate(task.id)}
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {dayTasks.length > 0 && (
                <p className="text-[10px] text-ink/35">{dayTasks.length} task{dayTasks.length !== 1 ? "s" : ""}</p>
              )}
            </Card>
          );
        })}
      </div>
    </section>
  );
}
