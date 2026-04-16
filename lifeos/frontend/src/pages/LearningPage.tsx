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

export function LearningPage() {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [title, setTitle] = usePersistentState("lifeos_lrn_title", "");
  const [platform, setPlatform] = usePersistentState("lifeos_lrn_plat", "");
  const [category, setCategory] = usePersistentState("lifeos_lrn_cat", "web_dev");
  const [progress, setProgress] = usePersistentState("lifeos_lrn_prog", "0");
  const [studyHours, setStudyHours] = usePersistentState<Record<string, string>>("lifeos_lrn_hrs", {});
  const [studyUnits, setStudyUnits] = usePersistentState<Record<string, string>>("lifeos_lrn_units", {});

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

  const deleteResource = useMutation({
    mutationFn: async (id: string) => await api.delete(`/learning/${id}`),
    onSuccess: () => {
      toast.success("Learning resource deleted.");
      queryClient.invalidateQueries({ queryKey: ["learning"] });
    },
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
            <Card key={resource.id} className="group/learning relative">
              <div className="pr-6">
                <h3 className="font-serif text-3xl italic text-ink">{resource.title}</h3>
                <p className="mt-2 text-sm text-ink/65">{resource.platform || "No platform"} · {resource.category}</p>
              </div>
              <button
                type="button"
                title="Delete resource"
                className="absolute right-3 top-4 text-terracotta/40 hover:text-terracotta opacity-0 group-hover/learning:opacity-100 transition-all"
                onClick={async () => (await confirm({ title: "Delete resource", message: "Are you sure you want to delete this resource?" })) && deleteResource.mutate(resource.id)}
              >
                <Trash size={16} />
              </button>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-parchment">
                <div className="h-full rounded-full bg-terracotta" style={{ width: `${resource.progress}%` }} />
              </div>
              <div className="mt-4 flex gap-2">
                <Input
                  className="flex-1"
                  value={studyHours[resource.id] ?? ""}
                  onChange={(e) => setStudyHours((prev) => ({ ...prev, [resource.id]: e.target.value }))}
                  placeholder="Time spent"
                />
                <select
                  value={studyUnits[resource.id] ?? "hrs"}
                  onChange={(e) => setStudyUnits((prev) => ({ ...prev, [resource.id]: e.target.value }))}
                  className="w-[85px] rounded-2xl border border-line bg-cream px-2 py-3 text-sm text-ink outline-none"
                >
                  <option value="hrs">hrs</option>
                  <option value="mins">mins</option>
                </select>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    if (!studyHours[resource.id]) return;
                    const val = Number(studyHours[resource.id]);
                    const hours = (studyUnits[resource.id] ?? "hrs") === "mins" ? val / 60 : val;
                    addStudyLog.mutate({ id: resource.id, hours });
                  }}
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
