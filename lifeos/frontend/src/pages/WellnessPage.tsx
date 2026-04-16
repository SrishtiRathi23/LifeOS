import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import { Trash } from "lucide-react";
import { useConfirm } from "@/contexts/ConfirmContext";
import { api, getErrorMessage } from "@/utils/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";

export function WellnessPage() {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("wellness");
  const [targetDays, setTargetDays] = useState("7");

  const { data: habits } = useQuery({
    queryKey: ["habits"],
    queryFn: async () => (await api.get("/habits")).data
  });

  const createHabit = useMutation({
    mutationFn: async () =>
      (
        await api.post("/habits", {
          name,
          category,
          targetDays: Number(targetDays)
        })
      ).data,
    onSuccess: () => {
      setName("");
      queryClient.invalidateQueries({ queryKey: ["habits"] });
    },
    onError: (error) => toast.error(getErrorMessage(error))
  });

  const toggleHabit = useMutation({
    mutationFn: async ({ habitId, completed }: { habitId: string; completed: boolean }) =>
      (
        await api.post("/habits/log", {
          habitId,
          date: dayjs().startOf("day").toISOString(),
          completed
        })
      ).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["habits"] }),
    onError: (error) => toast.error(getErrorMessage(error))
  });

  const deleteHabit = useMutation({
    mutationFn: async (id: string) => await api.delete(`/habits/${id}`),
    onSuccess: () => {
      toast.success("Habit deleted.");
      queryClient.invalidateQueries({ queryKey: ["habits"] });
    },
    onError: (error) => toast.error(getErrorMessage(error))
  });

  const prompt = useMemo(() => {
    const prompts = [
      "What made you smile today?",
      "What felt lighter than expected?",
      "Where did you show up for yourself?"
    ];
    return prompts[dayjs().date() % prompts.length];
  }, []);

  return (
    <section className="mx-auto max-w-6xl space-y-6 px-4 py-8 md:px-8">
      <PageHeader eyebrow="Gentle consistency" title="Wellness & Habits" description="Track only the habits you actually care about. Nothing is created for you by default." />

      <Card>
        <h2 className="font-serif text-3xl italic text-ink">Add habit</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Habit name" />
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-2xl border border-line bg-cream px-4 py-3 text-sm text-ink outline-none">
            <option value="study">Study</option>
            <option value="wellness">Wellness</option>
            <option value="fitness">Fitness</option>
            <option value="personal">Personal</option>
            <option value="digital">Digital</option>
            <option value="other">Other</option>
          </select>
          <Input value={targetDays} onChange={(e) => setTargetDays(e.target.value)} placeholder="Target days" />
        </div>
        <div className="mt-4">
          <Button type="button" onClick={() => name.trim() && createHabit.mutate()}>
            Add habit
          </Button>
        </div>
      </Card>

      <Card>
        <h2 className="font-serif text-3xl italic text-ink">Today’s prompt</h2>
        <p className="mt-3 text-sm leading-7 text-ink/75">{prompt}</p>
      </Card>

      {!habits || habits.length === 0 ? (
        <EmptyState title="No habits yet" description="Once you add a habit, today’s check-in and your history grid will appear here." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {habits.map((habit: any) => {
            const todayDone = habit.logs?.some((log: any) => dayjs(log.date).isSame(dayjs(), "day") && log.completed);
            return (
              <Card key={habit.id} className="group/habit relative">
                <div className="flex items-center justify-between gap-4 pr-6">
                  <div>
                    <h3 className="font-serif text-3xl italic text-ink">{habit.name}</h3>
                    <p className="text-sm text-ink/60">{habit.category}</p>
                  </div>
                  <Button type="button" variant={todayDone ? "primary" : "secondary"} onClick={() => toggleHabit.mutate({ habitId: habit.id, completed: !todayDone })}>
                    {todayDone ? "Done today" : "Mark done"}
                  </Button>
                </div>
                <button
                  type="button"
                  title="Delete habit"
                  className="absolute right-3 top-4 text-terracotta/40 hover:text-terracotta opacity-0 group-hover/habit:opacity-100 transition-all"
                  onClick={async () => (await confirm({ title: "Delete habit", message: "Are you sure you want to delete this habit?" })) && deleteHabit.mutate(habit.id)}
                >
                  <Trash size={16} />
                </button>
                <div className="mt-4 flex gap-2">
                  {Array.from({ length: 14 }).map((_, index) => {
                    const day = dayjs().subtract(13 - index, "day");
                    const completed = habit.logs?.some((log: any) => dayjs(log.date).isSame(day, "day") && log.completed);
                    return <span key={index} className={`h-5 w-5 rounded-md ${completed ? "bg-terracotta" : "bg-parchment"}`} />;
                  })}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
