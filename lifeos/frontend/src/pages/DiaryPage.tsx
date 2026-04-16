import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import { Sparkles } from "lucide-react";
import { api, getErrorMessage } from "@/utils/api";
import { isoDay, prettyDate, prettyShortDate } from "@/utils/dateHelpers";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { PrintButton } from "@/components/shared/PrintButton";
import { Trash } from "lucide-react";
import { useConfirm } from "@/contexts/ConfirmContext";
type DiaryEntry = {
  id: string;
  date: string;
  content: string;
  mood: number | null;
  weather: string | null;
  gratitude: string[];
  tomorrowPlan: string[];
  tags: string[];
  aiReflection: string | null;
};

export function DiaryPage() {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const today = isoDay();
  const [content, setContent] = useState("");
  const [weather, setWeather] = useState("");
  const [tags, setTags] = useState("");
  const [gratitude, setGratitude] = useState(["", "", ""]);
  const [tomorrowPlan, setTomorrowPlan] = useState(["", "", "", "", ""]);
  const [mood, setMood] = useState<number | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const { data: entries } = useQuery({
    queryKey: ["diaryEntries"],
    queryFn: async () => (await api.get<DiaryEntry[]>("/diary")).data
  });

  useEffect(() => {
    if (!activeId) {
      setContent("");
      setWeather("");
      setTags("");
      setGratitude(["", "", ""]);
      setTomorrowPlan(["", "", "", "", ""]);
      setMood(null);
      return;
    }

    const current = entries?.find((entry) => entry.id === activeId);

    if (current) {
      setContent(current.content);
      setWeather(current.weather ?? "");
      setTags(current.tags.join(" "));
      setGratitude([current.gratitude?.[0] ?? "", current.gratitude?.[1] ?? "", current.gratitude?.[2] ?? ""]);
      setTomorrowPlan([
        current.tomorrowPlan?.[0] ?? "",
        current.tomorrowPlan?.[1] ?? "",
        current.tomorrowPlan?.[2] ?? "",
        current.tomorrowPlan?.[3] ?? "",
        current.tomorrowPlan?.[4] ?? ""
      ]);
      setMood(current.mood ?? null);
    }
  }, [entries, activeId]);

  const saveEntry = useMutation({
    mutationFn: async () =>
      (
        await api.post("/diary", {
          date: activeId ? entries?.find((entry) => entry.id === activeId)?.date ?? today : today,
          content,
          weather,
          mood,
          tags: tags.split(" ").filter(Boolean),
          gratitude: gratitude.filter(Boolean),
          tomorrowPlan: tomorrowPlan.filter(Boolean),
          photos: []
        })
      ).data,
    onSuccess: () => {
      toast.success("Diary entry saved.");
      setActiveId(null);
      queryClient.invalidateQueries({ queryKey: ["diaryEntries"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error) => toast.error(getErrorMessage(error))
  });

  const deleteEntry = useMutation({
    mutationFn: async (id: string) => await api.delete(`/diary/${id}`),
    onSuccess: () => {
      toast.success("Diary entry deleted.");
      queryClient.invalidateQueries({ queryKey: ["diaryEntries"] });
      if (activeId) setActiveId(null);
    },
    onError: (error) => toast.error(getErrorMessage(error))
  });

  const reflect = useMutation({
    mutationFn: async (entryId: string) => (await api.post(`/diary/${entryId}/ai-reflect`)).data,
    onSuccess: () => {
      toast.success("Reflection added.");
      queryClient.invalidateQueries({ queryKey: ["diaryEntries"] });
    },
    onError: (error) => toast.error(getErrorMessage(error))
  });



  return (
    <section className="mx-auto max-w-7xl space-y-6 px-4 py-8 md:px-8">
      <PageHeader
        eyebrow="Letters to yourself"
        title={prettyDate(today)}
        description="This journal stays empty until you write in it. Nothing here is prefilled with fake prompts or sample entries."
        actions={
          <>
            <Button type="button" onClick={() => saveEntry.mutate()}>
              Save entry
            </Button>
            <PrintButton />
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[0.42fr_0.58fr]">
        <Card className="h-fit">
          <h2 className="font-serif text-3xl italic text-ink">Past entries</h2>
          <div className="mt-4 space-y-3">
            {!entries || entries.length === 0 ? (
              <EmptyState title="No diary entries yet" description="Your journal index will begin once you save your first entry." />
            ) : (
              entries.map((entry) => (
                <div key={entry.id} className={`group/diary relative flex w-full flex-col rounded-2xl border px-4 py-3 text-left ${activeId === entry.id ? "border-terracotta bg-parchment" : "border-line bg-cream/70"}`}>
                  <button type="button" onClick={() => setActiveId(entry.id)} className="w-full text-left pr-6">
                    <p className="font-medium text-ink">{prettyShortDate(entry.date)}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-ink/65" dangerouslySetInnerHTML={{ __html: entry.content }} />
                  </button>
                  <button
                    type="button"
                    title="Delete entry"
                    className="absolute right-3 top-4 text-terracotta/40 hover:text-terracotta opacity-0 group-hover/diary:opacity-100 transition-all"
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (await confirm({ title: "Delete entry", message: "Are you sure you want to delete this diary entry?" })) {
                        deleteEntry.mutate(entry.id);
                      }
                    }}
                  >
                    <Trash size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <h2 className="font-serif text-3xl italic text-ink">Entry editor</h2>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Input value={weather} onChange={(e) => setWeather(e.target.value)} placeholder="Weather tag" />
            <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="#college #growth #personal" />
          </div>

          <div className="mt-4 flex gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setMood(value)}
                className={`rounded-full px-4 py-2 ${mood === value ? "bg-terracotta text-white" : "bg-parchment text-ink"}`}
              >
                {["😔", "😐", "🙂", "😊", "✨"][value - 1]}
              </button>
            ))}
          </div>

          <Textarea value={content} onChange={(e) => setContent(e.target.value)} className="mt-4 min-h-60" placeholder="Write honestly. This page only reflects what you actually save." />

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-ink/70">Today I’m grateful for...</p>
              <div className="mt-2 space-y-2">
                {gratitude.map((item, index) => (
                  <Input
                    key={index}
                    value={item}
                    onChange={(e) => {
                      const next = [...gratitude];
                      next[index] = e.target.value;
                      setGratitude(next);
                    }}
                    placeholder={`Gratitude ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm text-ink/70">Tomorrow I plan to...</p>
              <div className="mt-2 space-y-2">
                {tomorrowPlan.map((item, index) => (
                  <Input
                    key={index}
                    value={item}
                    onChange={(e) => {
                      const next = [...tomorrowPlan];
                      next[index] = e.target.value;
                      setTomorrowPlan(next);
                    }}
                    placeholder={`Plan ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button type="button" variant="secondary" onClick={() => activeId && reflect.mutate(activeId)} disabled={!activeId}>
              <Sparkles size={16} className="mr-2" />
              AI reflection
            </Button>
          </div>

          {activeId ? (
            <div className="mt-5 rounded-[1.5rem] border border-line bg-parchment/80 p-4">
              <p className="font-accent text-2xl text-terracotta">Reflection</p>
              <p className="mt-2 text-sm leading-7 text-ink/75">
                {entries?.find((entry) => entry.id === activeId)?.aiReflection ?? "No reflection yet. Save the entry first, then ask for one if you want it."}
              </p>
            </div>
          ) : null}
        </Card>
      </div>
    </section>
  );
}
