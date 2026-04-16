import { useState } from "react";
import { usePersistentState } from "@/hooks/usePersistentState";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Trash } from "lucide-react";
import { useConfirm } from "@/contexts/ConfirmContext";
import { api, getErrorMessage } from "@/utils/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";

export function HobbiesPage() {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [name, setName] = usePersistentState("lifeos_hob_name", "");
  const [category, setCategory] = usePersistentState("lifeos_hob_cat", "creative");
  const [durations, setDurations] = usePersistentState<Record<string, string>>("lifeos_hob_dur", {});
  const [durationUnits, setDurationUnits] = usePersistentState<Record<string, string>>("lifeos_hob_unit", {});

  const { data: hobbies } = useQuery({
    queryKey: ["hobbies"],
    queryFn: async () => (await api.get("/hobbies")).data
  });

  const addHobby = useMutation({
    mutationFn: async () => (await api.post("/hobbies", { name, category })).data,
    onSuccess: () => {
      setName("");
      queryClient.invalidateQueries({ queryKey: ["hobbies"] });
    },
    onError: (error) => toast.error(getErrorMessage(error))
  });

  const addHobbyLog = useMutation({
    mutationFn: async ({ hobbyId, duration }: { hobbyId: string; duration: number }) =>
      (await api.post("/hobbies/log", { hobbyId, date: new Date().toISOString(), duration })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["hobbies"] }),
    onError: (error) => toast.error(getErrorMessage(error))
  });

  const deleteHobby = useMutation({
    mutationFn: async (id: string) => await api.delete(`/hobbies/${id}`),
    onSuccess: () => {
      toast.success("Hobby deleted.");
      queryClient.invalidateQueries({ queryKey: ["hobbies"] });
    },
    onError: (error) => toast.error(getErrorMessage(error))
  });

  return (
    <section className="mx-auto max-w-6xl space-y-6 px-4 py-8 md:px-8">
      <PageHeader eyebrow="Make room for joy" title="Hobbies" description="This section starts empty and grows only with the hobbies and joy moments you really log." />

      <Card>
        <h2 className="font-serif text-3xl italic text-ink">Add hobby</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Hobby name" />
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-2xl border border-line bg-cream px-4 py-3 text-sm text-ink outline-none">
            <option value="creative">Creative</option>
            <option value="physical">Physical</option>
            <option value="digital">Digital</option>
            <option value="social">Social</option>
            <option value="other">Other</option>
          </select>
          <Button type="button" onClick={() => name.trim() && addHobby.mutate()}>
            Add hobby
          </Button>
        </div>
      </Card>

      {!hobbies || hobbies.length === 0 ? (
        <EmptyState title="No hobbies yet" description="Add a hobby and then log the time you spend enjoying it." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {hobbies.map((hobby: any) => (
            <Card key={hobby.id} className="group/hobby relative">
              <div className="pr-6">
                <h3 className="font-serif text-3xl italic text-ink">{hobby.name}</h3>
                <p className="mt-2 text-sm text-ink/65">{hobby.category}</p>
              </div>
              <button
                type="button"
                title="Delete hobby"
                className="absolute right-3 top-4 text-terracotta/40 hover:text-terracotta opacity-0 group-hover/hobby:opacity-100 transition-all"
                onClick={async () => (await confirm({ title: "Delete hobby", message: "Are you sure you want to delete this hobby?" })) && deleteHobby.mutate(hobby.id)}
              >
                <Trash size={16} />
              </button>
              <div className="mt-4 flex gap-2">
                <Input
                  className="flex-1"
                  value={durations[hobby.id] ?? ""}
                  onChange={(e) => setDurations((prev) => ({ ...prev, [hobby.id]: e.target.value }))}
                  placeholder="Time enjoyed"
                />
                <select
                  value={durationUnits[hobby.id] ?? "mins"}
                  onChange={(e) => setDurationUnits((prev) => ({ ...prev, [hobby.id]: e.target.value }))}
                  className="w-[85px] rounded-2xl border border-line bg-cream px-2 py-3 text-sm text-ink outline-none"
                >
                  <option value="mins">mins</option>
                  <option value="hrs">hrs</option>
                </select>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    if (!durations[hobby.id]) return;
                    const val = Number(durations[hobby.id]);
                    const duration = (durationUnits[hobby.id] ?? "mins") === "hrs" ? val * 60 : val;
                    addHobbyLog.mutate({ hobbyId: hobby.id, duration });
                  }}
                >
                  Log
                </Button>
              </div>
              <div className="mt-4 space-y-2">
                {(hobby.logs ?? []).slice(0, 5).map((log: any) => (
                  <div key={log.id} className="rounded-xl bg-cream/70 px-3 py-2 text-sm text-ink/70">
                    {log.duration >= 60 && log.duration % 60 === 0 ? `${log.duration / 60} hrs` : `${log.duration} mins`}
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
