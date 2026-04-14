import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { api, getErrorMessage } from "@/utils/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { PrintButton } from "@/components/shared/PrintButton";

type VisionImage = {
  id: string;
  imageUrl: string;
  title: string | null;
  affirmation: string | null;
  category: string;
  year: number | null;
};

export function VisionBoardPage() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [affirmation, setAffirmation] = useState("");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [category, setCategory] = useState("other");

  const { data: images } = useQuery({
    queryKey: ["visionImages"],
    queryFn: async () => (await api.get<VisionImage[]>("/vision")).data
  });

  const uploadAndCreate = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("image", file);
      const upload = await api.post<{ imageUrl: string }>("/vision/upload", formData);

      return (
        await api.post("/vision", {
          imageUrl: upload.data.imageUrl,
          title,
          affirmation,
          year: Number.isNaN(Number(year)) ? null : Number(year),
          category,
          position: images?.length ?? 0
        })
      ).data;
    },
    onSuccess: () => {
      toast.success("Image added to your vision board.");
      setTitle("");
      setAffirmation("");
      queryClient.invalidateQueries({ queryKey: ["visionImages"] });
    },
    onError: (error) => toast.error(getErrorMessage(error))
  });

  return (
    <section className="mx-auto max-w-7xl space-y-6 px-4 py-8 md:px-8">
      <PageHeader
        eyebrow="A visual promise"
        title="Vision Board"
        description="This board is empty until you upload your own images. No stock goals, no fake aspirations."
        actions={<PrintButton />}
      />

      <Card>
        <h2 className="font-serif text-3xl italic text-ink">Add a vision image</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
          <Input value={affirmation} onChange={(e) => setAffirmation(e.target.value)} placeholder="Affirmation" />
          <Input value={year} onChange={(e) => setYear(e.target.value)} placeholder="Year" />
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-2xl border border-line bg-cream px-4 py-3 text-sm text-ink outline-none">
            <option value="career">Career</option>
            <option value="finance">Finance</option>
            <option value="health">Health</option>
            <option value="travel">Travel</option>
            <option value="relationships">Relationships</option>
            <option value="skills">Skills</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="mt-4">
          <label className="inline-flex cursor-pointer items-center rounded-full bg-terracotta px-5 py-3 text-sm text-white">
            Choose image
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) uploadAndCreate.mutate(file);
              }}
            />
          </label>
        </div>
      </Card>

      {!images || images.length === 0 ? (
        <EmptyState title="Your board is still blank" description="Upload the first image that represents something you truly want to build, become, or experience." />
      ) : (
        <div className="columns-1 gap-4 md:columns-2 xl:columns-3">
          {images.map((image) => (
            <Card key={image.id} className="mb-4 break-inside-avoid overflow-hidden p-0">
              <img src={`http://localhost:4000${image.imageUrl}`} alt={image.title ?? "Vision"} className="h-auto w-full object-cover" />
              <div className="p-4">
                <p className="font-serif text-3xl italic text-ink">{image.title || "Untitled"}</p>
                <p className="mt-2 text-sm leading-6 text-ink/70">{image.affirmation || "No affirmation added yet."}</p>
                <div className="mt-3 flex items-center justify-between text-xs uppercase tracking-[0.18em] text-ink/50">
                  <span>{image.category}</span>
                  <span>{image.year ?? "No year"}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
