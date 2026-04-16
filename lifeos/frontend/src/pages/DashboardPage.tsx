import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { api, getErrorMessage } from "@/utils/api";
import { prettyShortDate } from "@/utils/dateHelpers";

type DashboardResponse = {
  greetingName: string;
  date: string;
  stats: {
    tasksDueToday: number;
    pendingAssignments: number;
    daysToNextExam: number | null;
    monthlyBudgetRemaining: number | null;
  };
  recentDiary: { content: string; date: string } | null;
  deadlines: Array<{ id: string; title: string; date: string | null; priority: string }>;
  habits: Array<{ id: string; name: string; logs: Array<{ id: string; date: string; completed: boolean }> }>;
};

function useCurrentTime() {
  const [time, setTime] = useState(dayjs());
  useEffect(() => {
    const timer = setInterval(() => setTime(dayjs()), 1000);
    return () => clearInterval(timer);
  }, []);
  return time;
}

export function DashboardPage() {
  const currentTime = useCurrentTime();
  const { data, error, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => (await api.get<DashboardResponse>("/dashboard")).data
  });

  if (isLoading) {
    return (
      <section className="mx-auto max-w-6xl px-4 py-8 md:px-8">
        <Card className="h-72 animate-pulse bg-parchment/70">
          <div />
        </Card>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mx-auto max-w-6xl px-4 py-8 md:px-8">
        <EmptyState title="Dashboard unavailable" description={getErrorMessage(error)} />
      </section>
    );
  }

  if (!data) return null;

  const stats = [
    { label: "Tasks due today", value: data.stats.tasksDueToday },
    { label: "Pending assignments", value: data.stats.pendingAssignments },
    { label: "Days to next exam", value: data.stats.daysToNextExam ?? "—" },
    { label: "Budget remaining", value: data.stats.monthlyBudgetRemaining ?? "—" }
  ];

  return (
    <section className="mx-auto max-w-6xl space-y-6 px-4 py-8 md:px-8">
      <PageHeader
        eyebrow={currentTime.format("dddd, MMMM D • h:mm A")}
        title={`Good ${currentTime.hour() < 12 ? "morning" : currentTime.hour() < 18 ? "afternoon" : "evening"}, ${data.greetingName} ✨`}
        description="This dashboard uses only your real stored data. If a section is empty, it simply means you haven’t added anything there yet."
      />

      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <p className="text-sm text-ink/65">{stat.label}</p>
            <p className="mt-3 font-serif text-5xl italic text-ink">{stat.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <h2 className="font-serif text-3xl italic text-ink">Upcoming deadlines</h2>
          <div className="mt-4 space-y-3">
            {data.deadlines.length === 0 ? (
              <EmptyState title="Nothing urgent yet" description="Your upcoming deadlines will appear here once you add dated tasks." />
            ) : (
              data.deadlines.map((deadline) => (
                <div key={deadline.id} className="flex items-center justify-between rounded-2xl border border-line bg-cream/70 px-4 py-3">
                  <div>
                    <p className="font-medium text-ink">{deadline.title}</p>
                    <p className="text-sm text-ink/65">{deadline.date ? prettyShortDate(deadline.date) : "No date yet"}</p>
                  </div>
                  <span className="rounded-full bg-parchment px-3 py-1 text-xs capitalize text-terracotta">{deadline.priority}</span>
                </div>
              ))
            )}
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <h2 className="font-serif text-3xl italic text-ink">Recent diary</h2>
            {data.recentDiary ? (
              <>
                <p className="mt-2 text-sm text-ink/60">{prettyShortDate(data.recentDiary.date)}</p>
                <div className="mt-4 line-clamp-4 text-sm leading-7 text-ink/75 blur-[1.2px]">
                  <div dangerouslySetInnerHTML={{ __html: data.recentDiary.content }} />
                </div>
              </>
            ) : (
              <div className="mt-4">
                <EmptyState title="No diary entry yet" description="Your latest reflection will appear here after you write your first journal entry." />
              </div>
            )}
          </Card>

          <Card>
            <h2 className="font-serif text-3xl italic text-ink">Habit week</h2>
            {data.habits.length === 0 ? (
              <div className="mt-4">
                <EmptyState title="No habits yet" description="Once you add habits later, their weekly completion rings will show up here." />
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {data.habits.map((habit) => (
                  <div key={habit.id} className="flex items-center justify-between">
                    <span className="text-sm text-ink/75">{habit.name}</span>
                    <div className="flex gap-2">
                      {Array.from({ length: 7 }).map((_, index) => {
                        const day = dayjs().subtract(6 - index, "day").startOf("day");
                        const complete = habit.logs.some((log) => dayjs(log.date).isSame(day, "day") && log.completed);

                        return <span key={`${habit.id}-${index}`} className={`h-3 w-3 rounded-full ${complete ? "bg-terracotta" : "bg-parchment border border-line"}`} />;
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </section>
  );
}
