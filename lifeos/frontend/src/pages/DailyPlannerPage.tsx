import { useEffect, useMemo, useState } from "react";
import { usePersistentState } from "@/hooks/usePersistentState";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import { Plus, Trash } from "lucide-react";
import { api, getErrorMessage } from "@/utils/api";
import { isoDay, prettyDate } from "@/utils/dateHelpers";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { PrintButton } from "@/components/shared/PrintButton";
import { useAutosave } from "@/hooks/useAutosave";

type Task = {
  id: string;
  title: string;
  status: "todo" | "in_progress" | "done" | "archived";
  priority: "high" | "medium" | "low";
  category: string;
};

type PlanResponse = {
  plan: {
    brainDump: string | null;
    goals: string[];
    notes: string | null;
    mood: number | null;
  } | null;
  waterGlasses: number;
};

export function DailyPlannerPage() {
  const queryClient = useQueryClient();
  const selectedDate = useMemo(() => isoDay(), []);
  const [newTaskTitle, setNewTaskTitle] = usePersistentState("lifeos_dp_task", "");
  const [brainDump, setBrainDump] = usePersistentState("lifeos_dp_bdump", "");
  const [notes, setNotes] = usePersistentState("lifeos_dp_notes", "");
  const [goalFields, setGoalFields] = usePersistentState("lifeos_dp_goals", ["", "", ""]);
  const [water, setWater] = usePersistentState("lifeos_dp_water", 0);
  const [mood, setMood] = usePersistentState<number | null>("lifeos_dp_mood", null);
  const [newPriority, setNewPriority] = usePersistentState<string>("lifeos_dp_new_pri", "medium");
  const [newCategory, setNewCategory] = usePersistentState<string>("lifeos_dp_new_cat", "other");

  const { data: tasks } = useQuery({
    queryKey: ["todayTasks", selectedDate],
    queryFn: async () => (await api.get<Task[]>("/tasks/today")).data
  });

  const { data: plan } = useQuery({
    queryKey: ["dailyPlan", selectedDate],
    queryFn: async () => (await api.get<PlanResponse>("/daily-plans", { params: { date: selectedDate } })).data
  });

  useEffect(() => {
    if (plan?.plan) {
      setBrainDump(plan.plan.brainDump ?? "");
      setNotes(plan.plan.notes ?? "");
      setMood(plan.plan.mood ?? null);
      setGoalFields([plan.plan.goals?.[0] ?? "", plan.plan.goals?.[1] ?? "", plan.plan.goals?.[2] ?? ""]);
    }

    if (typeof plan?.waterGlasses === "number") {
      setWater(plan.waterGlasses);
    }
  }, [plan]);

  const createTask = useMutation({
    mutationFn: async (payload: { title: string; category?: string; priority?: string }) =>
      (
        await api.post("/tasks", {
          title: payload.title,
          date: selectedDate,
          category: payload.category ?? newCategory,
          priority: payload.priority ?? newPriority,
          status: "todo",
          tags: [],
          sortOrder: 0,
          isRecurring: false
        })
      ).data,
    onSuccess: () => {
      setNewTaskTitle("");
      queryClient.invalidateQueries({ queryKey: ["todayTasks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error) => toast.error(getErrorMessage(error))
  });

  const savePlan = useMutation({
    mutationFn: async () =>
      (
        await api.post("/daily-plans", {
          date: selectedDate,
          brainDump,
          notes,
          goals: goalFields.filter(Boolean),
          mood,
          timeBlocks: []
        })
      ).data,
    onSuccess: () => toast.success("Planner saved."),
    onError: (error) => toast.error(getErrorMessage(error))
  });

  useAutosave(
    () => {
      if (plan) {
        savePlan.mutate();
      }
    },
    [brainDump, notes, goalFields.join("|"), String(mood)],
    500,
    !!plan
  );

  const saveWater = useMutation({
    mutationFn: async (glasses: number) => (await api.post("/logs/water", { date: selectedDate, glasses })).data,
    onError: (error) => toast.error(getErrorMessage(error))
  });


  const toggleTask = useMutation({
    mutationFn: async (task: Task) =>
      (await api.patch(`/tasks/${task.id}`, { status: task.status === "done" ? "todo" : "done" })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["todayTasks"] }),
    onError: (error) => toast.error(getErrorMessage(error))
  });

  const deleteTask = useMutation({
    mutationFn: async (taskId: string) => await api.delete(`/tasks/${taskId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todayTasks"] });
      queryClient.invalidateQueries({ queryKey: ["allTasks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Task deleted.");
    },
    onError: (error) => toast.error(getErrorMessage(error))
  });

  return (
    <section className="mx-auto max-w-7xl space-y-6 px-4 py-8 md:px-8">
      <PageHeader
        eyebrow={dayjs(selectedDate).format("dddd")}
        title={prettyDate(selectedDate)}
        description="Everything here saves to your real database only. No sample planner entries are injected."
        actions={
          <>
            <Button type="button" variant="secondary" onClick={() => savePlan.mutate()}>
              Save planner
            </Button>
            <PrintButton />
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <Card>
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-3xl italic text-ink">To do today</h2>
            </div>

            <div className="mt-4 flex gap-3">
              <Input
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Add a real task for today..."
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newTaskTitle.trim()) {
                    createTask.mutate({ title: newTaskTitle.trim() });
                  }
                }}
              />
              <Button type="button" onClick={() => newTaskTitle.trim() && createTask.mutate({ title: newTaskTitle.trim() })}>
                <Plus size={16} className="mr-2" />
                Add
              </Button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <div className="flex rounded-full border border-line bg-parchment/50 p-1">
                {[
                  { id: "low", label: "Low" },
                  { id: "medium", label: "Medium" },
                  { id: "high", label: "Urgent" }
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setNewPriority(p.id)}
                    className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-all ${
                      newPriority === p.id ? "bg-terracotta text-white shadow-sm" : "text-ink/40 hover:text-ink/70"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {["college", "learning", "career", "personal", "health", "finance", "other"].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setNewCategory(cat)}
                    className={`rounded-full border px-3 py-1 text-[10px] font-medium capitalize transition-all ${
                      newCategory === cat
                        ? "border-terracotta bg-parchment text-terracotta"
                        : "border-line bg-card/30 text-ink/60 hover:border-ink/20"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {!tasks || tasks.length === 0 ? (
                <EmptyState title="No tasks yet" description="Add your first real task for today, or upload a notebook page to extract them." />
              ) : (
                tasks.map((task) => (
                  <label key={task.id} className="group/task relative flex items-center justify-between gap-3 rounded-2xl border border-line bg-cream/75 px-4 py-3 pr-10 hover:shadow-sm transition-shadow cursor-pointer">
                    <div className="flex items-center gap-3">
                      <input type="checkbox" checked={task.status === "done"} onChange={() => toggleTask.mutate(task)} />
                      <div className="flex-1">
                        <p className={task.status === "done" ? "line-through text-ink/50" : "text-ink"}>{task.title}</p>
                        <p className="text-xs capitalize text-ink/55">
                          {task.category} · {task.priority}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      title="Delete task"
                      className="absolute right-4 text-terracotta/40 hover:text-terracotta opacity-0 group-hover/task:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.preventDefault();
                        deleteTask.mutate(task.id);
                      }}
                    >
                      <Trash size={16} />
                    </button>
                  </label>
                ))
              )}
            </div>
          </Card>


        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="font-serif text-3xl italic text-ink">Goals for today</h2>
            <div className="mt-4 space-y-3">
              {goalFields.map((goal, index) => (
                <Input
                  key={index}
                  value={goal}
                  onChange={(e) => {
                    const next = [...goalFields];
                    next[index] = e.target.value;
                    setGoalFields(next);
                  }}
                  placeholder={`Goal ${index + 1}`}
                />
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="font-serif text-3xl italic text-ink">Brain dump</h2>
            <Textarea value={brainDump} onChange={(e) => setBrainDump(e.target.value)} className="mt-4" placeholder="Let everything spill out here..." />
          </Card>

          <Card>
            <h2 className="font-serif text-3xl italic text-ink">Notes</h2>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-4" placeholder="Planner notes, reminders, little thoughts..." />
          </Card>

          <Card>
            <h2 className="font-serif text-3xl italic text-ink">Mood and water</h2>
            <div className="mt-4 flex gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMood(value)}
                  className={`rounded-full px-4 py-2 ${mood === value ? "bg-terracotta text-white" : "bg-parchment text-ink"}`}
                >
                  {["😔", "😐", "🙂", "😊", "🤍"][value - 1]}
                </button>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {Array.from({ length: 8 }).map((_, index) => {
                const filled = index < water;
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      const next = index + 1;
                      setWater(next);
                      saveWater.mutate(next);
                    }}
                    className={`h-10 w-10 rounded-full border ${filled ? "border-terracotta bg-terracotta text-white" : "border-line bg-cream text-ink/70"}`}
                  >
                    💧
                  </button>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
