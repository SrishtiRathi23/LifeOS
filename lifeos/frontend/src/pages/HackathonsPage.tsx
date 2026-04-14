import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import { api, getErrorMessage } from "@/utils/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";

export function HackathonsPage() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [mode, setMode] = useState("");
  const [theme, setTheme] = useState("");
  const [status, setStatus] = useState("planning");
  const [idea, setIdea] = useState("");

  const { data: items } = useQuery({
    queryKey: ["hackathons"],
    queryFn: async () => (await api.get("/hackathons")).data
  });

  const createItem = useMutation({
    mutationFn: async () =>
      (
        await api.post("/hackathons", {
          name,
          mode,
          theme,
          status,
          idea,
          date: dayjs().add(30, "day").toISOString()
        })
      ).data,
    onSuccess: () => {
      setName("");
      setMode("");
      setTheme("");
      setIdea("");
      queryClient.invalidateQueries({ queryKey: ["hackathons"] });
    },
    onError: (error) => toast.error(getErrorMessage(error))
  });

  return (
    <section className="mx-auto max-w-6xl space-y-6 px-4 py-8 md:px-8">
      <PageHeader eyebrow="Build in public" title="Hackathon Tracker" description="Track only the hackathons you actually join, plan, or submit to." />

      <Card>
        <h2 className="font-serif text-3xl italic text-ink">Add hackathon</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Hackathon name" />
          <Input value={mode} onChange={(e) => setMode(e.target.value)} placeholder="Mode" />
          <Input value={theme} onChange={(e) => setTheme(e.target.value)} placeholder="Theme" />
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-2xl border border-line bg-cream px-4 py-3 text-sm text-ink outline-none">
            <option value="planning">Planning</option>
            <option value="registered">Registered</option>
            <option value="building">Building</option>
            <option value="submitted">Submitted</option>
            <option value="results">Results</option>
          </select>
        </div>
        <Textarea value={idea} onChange={(e) => setIdea(e.target.value)} className="mt-3" placeholder="Idea notes" />
        <div className="mt-4"><Button type="button" onClick={() => name && createItem.mutate()}>Add hackathon</Button></div>
      </Card>

      {!items || items.length === 0 ? (
        <EmptyState title="No hackathons yet" description="Your archive and progress list will start once you add your first hackathon." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((item: any) => (
            <Card key={item.id}>
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-3xl italic text-ink">{item.name}</h3>
                <span className="rounded-full bg-parchment px-3 py-1 text-xs capitalize text-terracotta">{item.status}</span>
              </div>
              <p className="mt-2 text-sm text-ink/65">{item.mode || "No mode"} · {item.theme || "No theme"}</p>
              <p className="mt-3 text-sm leading-6 text-ink/70">{item.idea || "No idea notes yet."}</p>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
