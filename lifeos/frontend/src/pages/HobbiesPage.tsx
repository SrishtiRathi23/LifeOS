import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { api, getErrorMessage } from "@/utils/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";

export function HobbiesPage() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("creative");
  const [durations, setDurations] = useState<Record<string, string>>({});

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
            <Card key={hobby.id}>
              <h3 className="font-serif text-3xl italic text-ink">{hobby.name}</h3>
              <p className="mt-2 text-sm text-ink/65">{hobby.category}</p>
              <div className="mt-4 flex gap-3">
                <Input
                  value={durations[hobby.id] ?? ""}
                  onChange={(e) => setDurations((prev) => ({ ...prev, [hobby.id]: e.target.value }))}
                  placeholder="Minutes enjoyed"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => durations[hobby.id] && addHobbyLog.mutate({ hobbyId: hobby.id, duration: Number(durations[hobby.id]) })}
                >
                  Log
                </Button>
              </div>
              <div className="mt-4 space-y-2">
                {(hobby.logs ?? []).slice(0, 5).map((log: any) => (
                  <div key={log.id} className="rounded-xl bg-cream/70 px-3 py-2 text-sm text-ink/70">
                    {log.duration} min
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
