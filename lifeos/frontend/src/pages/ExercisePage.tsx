import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import { api, getErrorMessage } from "@/utils/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";

export function ExercisePage() {
  const queryClient = useQueryClient();
  const [type, setType] = useState("walk");
  const [duration, setDuration] = useState("");
  const [intensity, setIntensity] = useState("3");
  const [notes, setNotes] = useState("");

  const { data: logs } = useQuery({
    queryKey: ["exercise"],
    queryFn: async () => (await api.get("/exercise")).data
  });

  const addLog = useMutation({
    mutationFn: async () =>
      (
        await api.post("/exercise", {
          date: new Date().toISOString(),
          type,
          duration: Number(duration),
          intensity: Number(intensity),
          notes
        })
      ).data,
    onSuccess: () => {
      setDuration("");
      setNotes("");
      queryClient.invalidateQueries({ queryKey: ["exercise"] });
    },
    onError: (error) => toast.error(getErrorMessage(error))
  });

  return (
    <section className="mx-auto max-w-6xl space-y-6 px-4 py-8 md:px-8">
      <PageHeader eyebrow="Move your body" title="Exercise Log" description="Log only the exercise sessions you actually do. This section starts blank by design." />

      <Card>
        <h2 className="font-serif text-3xl italic text-ink">Log workout</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <select value={type} onChange={(e) => setType(e.target.value)} className="rounded-2xl border border-line bg-cream px-4 py-3 text-sm text-ink outline-none">
            <option value="walk">Walk</option>
            <option value="gym">Gym</option>
            <option value="yoga">Yoga</option>
            <option value="sports">Sports</option>
            <option value="cycling">Cycling</option>
            <option value="home_workout">Home Workout</option>
            <option value="other">Other</option>
          </select>
          <Input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="Duration (min)" />
          <Input value={intensity} onChange={(e) => setIntensity(e.target.value)} placeholder="Intensity 1-5" />
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes" />
        </div>
        <div className="mt-4">
          <Button type="button" onClick={() => duration && addLog.mutate()}>
            Save workout
          </Button>
        </div>
      </Card>

      {!logs || logs.length === 0 ? (
        <EmptyState title="No workouts logged yet" description="When you log a walk, gym session, or workout, your exercise history will appear here." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {logs.map((log: any) => (
            <Card key={log.id}>
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-3xl italic text-ink capitalize">{log.type.replace("_", " ")}</h3>
                <span className="text-sm text-ink/60">{dayjs(log.date).format("DD MMM")}</span>
              </div>
              <p className="mt-2 text-sm text-ink/70">{log.duration} min · intensity {log.intensity}/5</p>
              <p className="mt-2 text-sm leading-6 text-ink/65">{log.notes || "No notes."}</p>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
