import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { api, getErrorMessage } from "@/utils/api";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/shared/EmptyState";
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

export function WeeklyViewPage() {
  const weekStart = dayjs().startOf("week").toISOString();
  const { data, error } = useQuery({
    queryKey: ["weekTasks", weekStart],
    queryFn: async () => (await api.get<Task[]>("/tasks/week", { params: { start: weekStart } })).data
  });

  const days = Array.from({ length: 7 }).map((_, index) => dayjs(weekStart).add(index, "day"));

  return (
    <section className="mx-auto max-w-7xl space-y-6 px-4 py-8 md:px-8">
      <PageHeader
        eyebrow="Week at a glance"
        title={`${dayjs(weekStart).format("D MMM")} - ${dayjs(weekStart).endOf("week").format("D MMM")}`}
        description={error ? getErrorMessage(error) : "A real weekly calendar built from your stored tasks only."}
        actions={<PrintButton />}
      />

      {!data || data.length === 0 ? (
        <EmptyState title="No tasks this week yet" description="Add dated tasks in your planner and they’ll automatically appear here." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-7">
          {days.map((day) => {
            const dayTasks = data.filter((task) => task.date && dayjs(task.date).isSame(day, "day"));
            return (
              <Card key={day.toISOString()} className="min-h-64">
                <p className="font-serif text-2xl italic text-ink">{day.format("ddd")}</p>
                <p className="text-sm text-ink/55">{day.format("D MMM")}</p>
                <div className="mt-4 space-y-2">
                  {dayTasks.length === 0 ? (
                    <p className="text-sm text-ink/45">Nothing here yet.</p>
                  ) : (
                    dayTasks.map((task) => (
                      <div key={task.id} className="rounded-2xl border border-line bg-cream/70 px-3 py-2">
                        <p className="text-sm text-ink">{task.title}</p>
                        <p className="text-[11px] uppercase tracking-[0.14em] text-ink/50">{task.category}</p>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
