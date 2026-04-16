import { useState } from "react";
import { usePersistentState } from "@/hooks/usePersistentState";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Trash } from "lucide-react";
import { useConfirm } from "@/contexts/ConfirmContext";
import { api, getErrorMessage } from "@/utils/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";

const columns = ["shortlisted", "applied", "interviewing", "offer", "rejected"];

export function InternshipsPage() {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [company, setCompany] = usePersistentState("lifeos_int_comp", "");
  const [role, setRole] = usePersistentState("lifeos_int_role", "");
  const [status, setStatus] = usePersistentState("lifeos_int_stat", "applied");
  const [location, setLocation] = usePersistentState("lifeos_int_loc", "");
  const [notes, setNotes] = usePersistentState("lifeos_int_notes", "");

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

  const deleteItem = useMutation({
    mutationFn: async (id: string) => await api.delete(`/internships/${id}`),
    onSuccess: () => {
      toast.success("Application deleted.");
      queryClient.invalidateQueries({ queryKey: ["internships"] });
    },
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
                  <div key={item.id} className="group/internship relative rounded-2xl border border-line bg-cream/70 p-4">
                    <p className="font-medium text-ink pr-6">{item.company}</p>
                    <p className="text-sm text-ink/65">{item.role}</p>
                    <button
                      type="button"
                      title="Delete application"
                      className="absolute right-3 top-4 text-terracotta/40 hover:text-terracotta opacity-0 group-hover/internship:opacity-100 transition-all"
                      onClick={async () => {
                        if (await confirm({ title: "Delete application", message: "Are you sure you want to delete this application?" })) {
                          deleteItem.mutate(item.id);
                        }
                      }}
                    >
                      <Trash size={16} />
                    </button>
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
