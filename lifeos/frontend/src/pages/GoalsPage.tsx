import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";
import toast from "react-hot-toast";
import { Trash } from "lucide-react";
import { useConfirm } from "@/contexts/ConfirmContext";
import { api, getErrorMessage } from "@/utils/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";

type Goal = {
  id: string;
  title: string;
  description: string | null;
  timeframe: "week" | "month" | "year" | "life";
  progress: number;
  category: string | null;
  why: string | null;
  status: "active" | "completed" | "paused";
  history: Array<{ id: string; progress: number; createdAt: string }>;
};

const timeframes: Goal["timeframe"][] = ["week", "month", "year", "life"];

export function GoalsPage() {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [timeframe, setTimeframe] = useState<Goal["timeframe"]>("month");
  const [category, setCategory] = useState("");
  const [why, setWhy] = useState("");

  const { data: goals } = useQuery({
    queryKey: ["goals"],
    queryFn: async () => (await api.get<Goal[]>("/goals")).data
  });

  const createGoal = useMutation({
    mutationFn: async () =>
      (
        await api.post("/goals", {
          title,
          description,
          timeframe,
          progress: 0,
          category,
          why,
          status: "active",
          milestones: []
        })
      ).data,
    onSuccess: () => {
      toast.success("Goal added.");
      setTitle("");
      setDescription("");
      setCategory("");
      setWhy("");
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
    onError: (error) => toast.error(getErrorMessage(error))
  });

  const updateProgress = useMutation({
    mutationFn: async ({ id, progress }: { id: string; progress: number }) => (await api.patch(`/goals/${id}/progress`, { progress })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["goals"] }),
    onError: (error) => toast.error(getErrorMessage(error))
  });

  const deleteGoal = useMutation({
    mutationFn: async (id: string) => await api.delete(`/goals/${id}`),
    onSuccess: () => {
      toast.success("Goal deleted.");
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
    onError: (error) => toast.error(getErrorMessage(error))
  });

  const grouped = useMemo(
    () =>
      timeframes.map((frame) => ({
        frame,
        items: goals?.filter((goal) => goal.timeframe === frame) ?? []
      })),
    [goals]
  );

  return (
    <section className="mx-auto max-w-7xl space-y-6 px-4 py-8 md:px-8">
      <PageHeader
        eyebrow="Promises you keep"
        title="Goals & Aspirations"
        description="This section stays empty until you define goals that actually matter to you."
      />

      <Card>
        <h2 className="font-serif text-3xl italic text-ink">Add a goal</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Goal title" />
          <select value={timeframe} onChange={(e) => setTimeframe(e.target.value as Goal["timeframe"])} className="rounded-2xl border border-line bg-cream px-4 py-3 text-sm text-ink outline-none">
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
            <option value="life">Life</option>
          </select>
          <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category" />
          <Input value={why} onChange={(e) => setWhy(e.target.value)} placeholder="Why this matters" />
        </div>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="mt-3" placeholder="Describe the goal in your own words." />
        <div className="mt-4">
          <Button type="button" onClick={() => title.trim() && createGoal.mutate()}>
            Add goal
          </Button>
        </div>
      </Card>

      {!goals || goals.length === 0 ? (
        <EmptyState title="No goals yet" description="When you add goals, this page will group them by timeframe and track their progress history." />
      ) : (
        <div className="grid gap-6">
          {grouped.map((group) => (
            <div key={group.frame}>
              <h2 className="mb-3 font-serif text-4xl italic capitalize text-ink">{group.frame}</h2>
              {group.items.length === 0 ? (
                <EmptyState title={`No ${group.frame} goals yet`} description="Add one above when you're ready." />
              ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                  {group.items.map((goal) => (
                    <Card key={goal.id}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-serif text-3xl italic text-ink break-words">{goal.title}</h3>
                          <p className="mt-2 text-sm leading-6 text-ink/70">{goal.description || "No description yet."}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="rounded-full bg-parchment px-3 py-1 text-xs capitalize text-terracotta whitespace-nowrap">{goal.status}</span>
                          <button
                            type="button"
                            className="opacity-0 group-hover/goal:opacity-100 transition-all text-terracotta hover:text-terracotta/80 p-1"
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (await confirm({ title: "Delete goal", message: "Are you sure you want to delete this goal?" })) {
                                deleteGoal.mutate(goal.id);
                              }
                            }}
                          >
                            <Trash size={18} />
                          </button>
                        </div>
                      </div>

                      <div className="mt-5">
                        <div className="h-3 overflow-hidden rounded-full bg-parchment">
                          <div className="h-full rounded-full bg-terracotta" style={{ width: `${goal.progress}%` }} />
                        </div>
                        <div className="mt-3 flex gap-2">
                          {[25, 50, 75, 100].map((value) => (
                            <Button key={value} type="button" variant="secondary" onClick={() => updateProgress.mutate({ id: goal.id, progress: value })}>
                              {value}%
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div className="mt-5 h-40">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={goal.history}>
                            <Tooltip />
                            <Line dataKey="progress" stroke="var(--terracotta)" strokeWidth={2} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
