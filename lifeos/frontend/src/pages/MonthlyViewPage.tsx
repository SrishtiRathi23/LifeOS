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
  priority: string;
};

export function MonthlyViewPage() {
  const monthStart = dayjs().startOf("month");
  const monthEnd = dayjs().endOf("month");
  const { data, error } = useQuery({
    queryKey: ["allTasks"],
    queryFn: async () => (await api.get<Task[]>("/tasks")).data
  });

  const calendarStart = monthStart.startOf("week");
  const days = Array.from({ length: 42 }).map((_, index) => calendarStart.add(index, "day"));
  const currentMonthTasks =
    data?.filter(
      (task) =>
        task.date &&
        (dayjs(task.date).isSame(monthStart, "day") ||
          dayjs(task.date).isSame(monthEnd, "day") ||
          (dayjs(task.date).isAfter(monthStart, "day") && dayjs(task.date).isBefore(monthEnd, "day")))
    ) ?? [];

  return (
    <section className="mx-auto max-w-7xl space-y-6 px-4 py-8 md:px-8">
      <PageHeader
        eyebrow="Month in view"
        title={monthStart.format("MMMM YYYY")}
        description={error ? getErrorMessage(error) : "Your month stays empty until you add real dates to your tasks."}
        actions={<PrintButton />}
      />

      {!currentMonthTasks.length ? (
        <EmptyState title="No dated tasks this month" description="Once your tasks have dates, this month view will become your calendar map." />
      ) : (
        <div className="grid gap-4 md:grid-cols-7">
          {days.map((day) => {
            const dayTasks = (data ?? []).filter((task) => task.date && dayjs(task.date).isSame(day, "day"));
            return (
              <Card key={day.toISOString()} className={`min-h-36 p-4 ${day.month() !== monthStart.month() ? "opacity-45" : ""}`}>
                <div className="flex items-center justify-between">
                  <p className="font-serif text-2xl italic text-ink">{day.format("D")}</p>
                  {dayTasks.length ? <span className="rounded-full bg-parchment px-2 py-1 text-[10px] text-terracotta">{dayTasks.length}</span> : null}
                </div>
                <div className="mt-3 space-y-2">
                  {dayTasks.slice(0, 3).map((task) => (
                    <div key={task.id} className="rounded-xl bg-cream/70 px-2 py-1 text-xs text-ink/75">
                      {task.title}
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
