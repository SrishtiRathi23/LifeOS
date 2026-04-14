import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import { Camera, Plus, Sparkles } from "lucide-react";
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
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [brainDump, setBrainDump] = useState("");
  const [notes, setNotes] = useState("");
  const [goalFields, setGoalFields] = useState(["", "", ""]);
  const [water, setWater] = useState(0);
  const [mood, setMood] = useState<number | null>(null);
  const [typedText, setTypedText] = useState("");
  const [parsedTasks, setParsedTasks] = useState<Array<{ title: string; priority: "high" | "medium" | "low"; category: string }>>([]);

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
          category: payload.category ?? "other",
          priority: payload.priority ?? "medium",
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

  const parseText = useMutation({
    mutationFn: async () => (await api.post("/tasks/parse-text", { text: typedText })).data,
    onSuccess: (response) => {
      setParsedTasks(response.parsed.tasks);
      toast.success("Parsed your typed list. Review and add what you want.");
    },
    onError: (error) => toast.error(getErrorMessage(error))
  });

  const parseImage = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("image", file);
      return (await api.post("/tasks/parse-image", formData)).data;
    },
    onSuccess: (response) => {
      setParsedTasks(response.parsed.tasks);
      toast.success("Notebook page parsed. Review the tasks below.");
    },
    onError: (error) => toast.error(getErrorMessage(error))
  });

  const toggleTask = useMutation({
    mutationFn: async (task: Task) =>
      (await api.patch(`/tasks/${task.id}`, { status: task.status === "done" ? "todo" : "done" })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["todayTasks"] }),
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
              <label className="inline-flex cursor-pointer items-center rounded-full border border-line bg-card px-4 py-2 text-sm text-ink hover:shadow-glow">
                <Camera size={16} className="mr-2" />
                Upload my notebook page
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) parseImage.mutate(file);
                  }}
                />
              </label>
            </div>

            <div className="mt-4 flex gap-3">
              <Input value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} placeholder="Add a real task for today..." />
              <Button type="button" onClick={() => newTaskTitle.trim() && createTask.mutate({ title: newTaskTitle.trim() })}>
                <Plus size={16} className="mr-2" />
                Add
              </Button>
            </div>

            <div className="mt-4 space-y-3">
              {!tasks || tasks.length === 0 ? (
                <EmptyState title="No tasks yet" description="Add your first real task for today, or upload a notebook page to extract them." />
              ) : (
                tasks.map((task) => (
                  <label key={task.id} className="flex items-center gap-3 rounded-2xl border border-line bg-cream/75 px-4 py-3">
                    <input type="checkbox" checked={task.status === "done"} onChange={() => toggleTask.mutate(task)} />
                    <div className="flex-1">
                      <p className={task.status === "done" ? "line-through text-ink/50" : "text-ink"}>{task.title}</p>
                      <p className="text-xs capitalize text-ink/55">
                        {task.category} · {task.priority}
                      </p>
                    </div>
                  </label>
                ))
              )}
            </div>
          </Card>

          <Card>
            <h2 className="font-serif text-3xl italic text-ink">Notebook text parser</h2>
            <Textarea value={typedText} onChange={(e) => setTypedText(e.target.value)} placeholder="Paste a typed task list here if you don’t want to upload an image." className="mt-4" />
            <div className="mt-3 flex justify-end">
              <Button type="button" variant="secondary" onClick={() => typedText.trim() && parseText.mutate()}>
                <Sparkles size={16} className="mr-2" />
                Parse text
              </Button>
            </div>

            {parsedTasks.length > 0 ? (
              <div className="mt-4 space-y-3">
                {parsedTasks.map((task, index) => (
                  <div key={`${task.title}-${index}`} className="flex items-center justify-between rounded-2xl border border-line bg-parchment/70 px-4 py-3">
                    <div>
                      <p className="text-sm text-ink">{task.title}</p>
                      <p className="text-xs capitalize text-ink/55">
                        {task.category} · {task.priority}
                      </p>
                    </div>
                    <Button type="button" onClick={() => createTask.mutate(task)}>
                      Add task
                    </Button>
                  </div>
                ))}
              </div>
            ) : null}
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
