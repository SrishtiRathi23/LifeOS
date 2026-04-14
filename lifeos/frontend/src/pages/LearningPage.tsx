import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { api, getErrorMessage } from "@/utils/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";

export function LearningPage() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [platform, setPlatform] = useState("");
  const [category, setCategory] = useState("web_dev");
  const [progress, setProgress] = useState("0");
  const [studyHours, setStudyHours] = useState<Record<string, string>>({});

  const { data: resources } = useQuery({
    queryKey: ["learning"],
    queryFn: async () => (await api.get("/learning")).data
  });

  const addResource = useMutation({
    mutationFn: async () =>
      (
        await api.post("/learning", {
          title,
          platform,
          category,
          progress: Number(progress)
        })
      ).data,
    onSuccess: () => {
      setTitle("");
      setPlatform("");
      setProgress("0");
      queryClient.invalidateQueries({ queryKey: ["learning"] });
    },
    onError: (error) => toast.error(getErrorMessage(error))
  });

  const addStudyLog = useMutation({
    mutationFn: async ({ id, hours }: { id: string; hours: number }) =>
      (await api.post(`/learning/${id}/study-log`, { date: new Date().toISOString(), hours })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["learning"] }),
    onError: (error) => toast.error(getErrorMessage(error))
  });

  return (
    <section className="mx-auto max-w-6xl space-y-6 px-4 py-8 md:px-8">
      <PageHeader eyebrow="Keep learning" title="Learning Tracker" description="Courses, books, tutorials, and study logs appear only when you add your own resources." />

      <Card>
        <h2 className="font-serif text-3xl italic text-ink">Add learning resource</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
          <Input value={platform} onChange={(e) => setPlatform(e.target.value)} placeholder="Platform" />
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-2xl border border-line bg-cream px-4 py-3 text-sm text-ink outline-none">
            <option value="web_dev">Web Dev</option>
            <option value="dsa">DSA</option>
            <option value="cloud">Cloud</option>
            <option value="ai_ml">AI/ML</option>
            <option value="eee_core">EEE Core</option>
            <option value="gate_prep">GATE Prep</option>
            <option value="aptitude">Aptitude</option>
            <option value="soft_skills">Soft Skills</option>
            <option value="other">Other</option>
          </select>
          <Input value={progress} onChange={(e) => setProgress(e.target.value)} placeholder="Progress %" />
        </div>
        <div className="mt-4">
          <Button type="button" onClick={() => title.trim() && addResource.mutate()}>
            Add resource
          </Button>
        </div>
      </Card>

      {!resources || resources.length === 0 ? (
        <EmptyState title="No learning resources yet" description="Add your current course, tutorial, or book and its progress will start tracking here." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {resources.map((resource: any) => (
            <Card key={resource.id}>
              <h3 className="font-serif text-3xl italic text-ink">{resource.title}</h3>
              <p className="mt-2 text-sm text-ink/65">{resource.platform || "No platform"} · {resource.category}</p>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-parchment">
                <div className="h-full rounded-full bg-terracotta" style={{ width: `${resource.progress}%` }} />
              </div>
              <div className="mt-4 flex gap-3">
                <Input
                  value={studyHours[resource.id] ?? ""}
                  onChange={(e) => setStudyHours((prev) => ({ ...prev, [resource.id]: e.target.value }))}
                  placeholder="Study hours"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => studyHours[resource.id] && addStudyLog.mutate({ id: resource.id, hours: Number(studyHours[resource.id]) })}
                >
                  Log
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
