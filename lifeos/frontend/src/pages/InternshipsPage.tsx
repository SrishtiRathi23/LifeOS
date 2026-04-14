import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { api, getErrorMessage } from "@/utils/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";

const columns = ["shortlisted", "applied", "interviewing", "offer", "rejected"];

export function InternshipsPage() {
  const queryClient = useQueryClient();
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("applied");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");

  const { data: items } = useQuery({
    queryKey: ["internships"],
    queryFn: async () => (await api.get("/internships")).data
  });

  const createItem = useMutation({
    mutationFn: async () =>
      (
        await api.post("/internships", {
          company,
          role,
          status,
          location,
          notes,
          resumeSent: false,
          coverLetterUsed: false
        })
      ).data,
    onSuccess: () => {
      setCompany("");
      setRole("");
      setLocation("");
      setNotes("");
      queryClient.invalidateQueries({ queryKey: ["internships"] });
    },
    onError: (error) => toast.error(getErrorMessage(error))
  });

  const moveItem = useMutation({
    mutationFn: async ({ id, nextStatus }: { id: string; nextStatus: string }) => (await api.patch(`/internships/${id}`, { status: nextStatus })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["internships"] }),
    onError: (error) => toast.error(getErrorMessage(error))
  });

  return (
    <section className="mx-auto max-w-7xl space-y-6 px-4 py-8 md:px-8">
      <PageHeader eyebrow="Career pipeline" title="Internship Tracker" description="Your application board stays empty until you add real opportunities." />

      <Card>
        <h2 className="font-serif text-3xl italic text-ink">Add application</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company" />
          <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Role" />
          <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" />
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-2xl border border-line bg-cream px-4 py-3 text-sm text-ink outline-none">
            {columns.map((column) => <option key={column} value={column}>{column}</option>)}
          </select>
        </div>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-3" placeholder="Notes" />
        <div className="mt-4"><Button type="button" onClick={() => company && role && createItem.mutate()}>Add application</Button></div>
      </Card>

      {!items || items.length === 0 ? (
        <EmptyState title="No internship applications yet" description="Once you start adding companies, this kanban-style board becomes your pipeline." />
      ) : (
        <div className="grid gap-4 xl:grid-cols-5">
          {columns.map((column) => (
            <Card key={column}>
              <h2 className="font-serif text-3xl italic capitalize text-ink">{column}</h2>
              <div className="mt-4 space-y-3">
                {items.filter((item: any) => item.status === column).map((item: any) => (
                  <div key={item.id} className="rounded-2xl border border-line bg-cream/70 p-4">
                    <p className="font-medium text-ink">{item.company}</p>
                    <p className="text-sm text-ink/65">{item.role}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {columns.filter((value) => value !== column).slice(0, 2).map((next) => (
                        <Button key={next} type="button" variant="secondary" className="px-3 py-2 text-xs" onClick={() => moveItem.mutate({ id: item.id, nextStatus: next })}>
                          Move to {next}
                        </Button>
                      ))}
                    </div>
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
