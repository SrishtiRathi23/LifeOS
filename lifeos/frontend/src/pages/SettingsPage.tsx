import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { api, getErrorMessage } from "@/utils/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/shared/PageHeader";
import { themeOptions, useThemeStore } from "@/store/themeStore";
import { useAutosave } from "@/hooks/useAutosave";

type SettingsResponse = {
  id: string;
  name: string;
  email: string;
  settings: Record<string, unknown> | null;
};

export function SettingsPage() {
  const queryClient = useQueryClient();
  const { setTheme } = useThemeStore();
  const [name, setName] = useState("");
  const [college, setCollege] = useState("");
  const [year, setYear] = useState("");
  const [branch, setBranch] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [firstDayOfWeek, setFirstDayOfWeek] = useState("monday");

  const { data } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => (await api.get<SettingsResponse>("/settings")).data
  });

  useEffect(() => {
    if (!data) return;
    const settings = data.settings ?? {};
    setName(data.name ?? "");
    setCollege(String(settings.college ?? ""));
    setYear(String(settings.year ?? ""));
    setBranch(String(settings.branch ?? ""));
    setCurrency(String(settings.currency ?? "INR"));
    setFirstDayOfWeek(String(settings.firstDayOfWeek ?? "monday"));
  }, [data]);

  const saveSettings = useMutation({
    mutationFn: async () =>
      (
        await api.patch("/settings", {
          name,
          college,
          year,
          branch,
          currency,
          firstDayOfWeek
        })
      ).data,
    onSuccess: async () => {
      toast.success("Settings saved.");
      await queryClient.invalidateQueries({ queryKey: ["settings"] });
      await queryClient.invalidateQueries({ queryKey: ["session"] });
    },
    onError: (error) => toast.error(getErrorMessage(error))
  });

  useAutosave(
    () => {
      if (data) {
        saveSettings.mutate();
      }
    },
    [name, college, year, branch, currency, firstDayOfWeek],
    500,
    !!data
  );

  const exportData = useMutation({
    mutationFn: async () => (await api.get("/settings/export")).data,
    onSuccess: (payload) => {
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "lifeos-export.json";
      anchor.click();
      URL.revokeObjectURL(url);
    },
    onError: (error) => toast.error(getErrorMessage(error))
  });

  return (
    <section className="mx-auto max-w-6xl space-y-6 px-4 py-8 md:px-8">
      <PageHeader
        eyebrow="Your preferences"
        title="Settings"
        description="Profile and app preferences only reflect what you save. Export downloads your own data only."
      />

      <Card>
        <h2 className="font-serif text-3xl italic text-ink">Profile</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
          <Input value={data?.email ?? ""} disabled placeholder="Email" />
          <Input value={college} onChange={(e) => setCollege(e.target.value)} placeholder="College" />
          <Input value={branch} onChange={(e) => setBranch(e.target.value)} placeholder="Branch" />
          <Input value={year} onChange={(e) => setYear(e.target.value)} placeholder="Year" />
          <Input value={currency} onChange={(e) => setCurrency(e.target.value)} placeholder="Currency" />
        </div>

        <div className="mt-4">
          <label className="text-sm text-ink/65">First day of week</label>
          <div className="mt-2 flex gap-2">
            {["monday", "sunday"].map((day) => (
              <Button key={day} type="button" variant={firstDayOfWeek === day ? "primary" : "secondary"} onClick={() => setFirstDayOfWeek(day)}>
                {day}
              </Button>
            ))}
          </div>
        </div>

        <div className="mt-5 flex gap-3">
          <Button type="button" onClick={() => saveSettings.mutate()}>
            Save settings
          </Button>
          <Button type="button" variant="secondary" onClick={() => exportData.mutate()}>
            Export JSON
          </Button>
        </div>
      </Card>

      <Card>
        <h2 className="font-serif text-3xl italic text-ink">Theme preview</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {themeOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setTheme(option.id)}
              className="rounded-[1.5rem] border border-line bg-card p-4 text-left hover:shadow-glow"
            >
              <span className="block h-12 rounded-full" style={{ background: option.preview }} />
              <span className="mt-3 block text-sm text-ink">{option.label}</span>
            </button>
          ))}
        </div>
      </Card>
    </section>
  );
}
