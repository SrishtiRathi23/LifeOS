import { useState } from "react";
import { usePersistentState } from "@/hooks/usePersistentState";
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

export function ExercisePage() {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [type, setType] = usePersistentState("lifeos_ex_type", "walk");
  const [duration, setDuration] = usePersistentState("lifeos_ex_dur", "");
  const [durationUnit, setDurationUnit] = usePersistentState("lifeos_ex_dur_u", "mins");
  const [intensity, setIntensity] = usePersistentState("lifeos_ex_int", "3");
  const [notes, setNotes] = usePersistentState("lifeos_ex_notes", "");

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
          duration: durationUnit === "hrs" ? Number(duration) * 60 : Number(duration),
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

  const deleteLog = useMutation({
    mutationFn: async (id: string) => await api.delete(`/exercise/${id}`),
    onSuccess: () => {
      toast.success("Workout deleted.");
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
          <div className="flex gap-2">
            <Input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="Time" className="flex-1" />
            <select value={durationUnit} onChange={(e) => setDurationUnit(e.target.value)} className="w-[85px] rounded-2xl border border-line bg-cream px-2 py-3 text-sm text-ink outline-none">
              <option value="mins">mins</option>
              <option value="hrs">hrs</option>
            </select>
          </div>
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
            <div key={log.id} className="group/exercise relative rounded-2xl border border-line bg-cream/70 px-4 py-3">
              <div className="flex items-center justify-between pr-6">
                <h3 className="font-serif text-3xl italic text-ink capitalize">{log.type.replace("_", " ")}</h3>
                <span className="text-sm text-ink/60 whitespace-nowrap">{dayjs(log.date).format("DD MMM")}</span>
              </div>
              <p className="mt-2 text-sm text-ink/70">
                {log.duration >= 60 && log.duration % 60 === 0 ? `${log.duration / 60} hrs` : `${log.duration} mins`} · intensity {log.intensity}/5
              </p>
              <p className="mt-2 text-sm leading-6 text-ink/65">{log.notes || "No notes."}</p>
              <button
                type="button"
                title="Delete workout"
                className="absolute right-3 top-4 text-terracotta/40 hover:text-terracotta opacity-0 group-hover/exercise:opacity-100 transition-all"
                onClick={async () => (await confirm({ title: "Delete workout", message: "Are you sure you want to delete this workout?" })) && deleteLog.mutate(log.id)}
              >
                <Trash size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
