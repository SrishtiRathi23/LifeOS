import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import { Trash } from "lucide-react";
import { useConfirm } from "@/contexts/ConfirmContext";
import { api, getErrorMessage } from "@/utils/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";

export function HackathonsPage() {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
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

  const deleteItem = useMutation({
    mutationFn: async (id: string) => await api.delete(`/hackathons/${id}`),
    onSuccess: () => {
      toast.success("Hackathon deleted.");
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
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h3 className="font-serif text-3xl italic text-ink break-words">{item.name}</h3>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-parchment px-3 py-1 text-xs capitalize text-terracotta whitespace-nowrap">{item.status}</span>
                  <button
                    type="button"
                    title="Delete hackathon"
                    className="absolute right-3 top-4 text-terracotta/40 hover:text-terracotta opacity-0 group-hover/hackathon:opacity-100 transition-all"
                    onClick={async () => {
                      if (await confirm({ title: "Delete hackathon", message: "Are you sure you want to delete this hackathon?" })) {
                        deleteItem.mutate(item.id);
                      }
                    }}
                  >
                    <Trash size={18} />
                  </button>
                </div>
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
