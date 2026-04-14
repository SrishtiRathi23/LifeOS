import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import { api, getErrorMessage } from "@/utils/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";

export function CollegePage() {
  const queryClient = useQueryClient();
  const [subjectName, setSubjectName] = useState("");
  const [credits, setCredits] = useState("");
  const [semester, setSemester] = useState("");
  const [assignmentTitle, setAssignmentTitle] = useState("");
  const [assignmentSubjectId, setAssignmentSubjectId] = useState("");
  const [examType, setExamType] = useState("");
  const [examSubjectId, setExamSubjectId] = useState("");

  const { data } = useQuery({
    queryKey: ["college"],
    queryFn: async () => (await api.get("/college")).data
  });

  const addSubject = useMutation({
    mutationFn: async () =>
      (
        await api.post("/college/subjects", {
          name: subjectName,
          credits: Number(credits),
          semester,
          attendedClasses: 0,
          totalClasses: 0
        })
      ).data,
    onSuccess: () => {
      setSubjectName("");
      setCredits("");
      setSemester("");
      queryClient.invalidateQueries({ queryKey: ["college"] });
    },
    onError: (error) => toast.error(getErrorMessage(error))
  });

  const addAssignment = useMutation({
    mutationFn: async () =>
      (
        await api.post("/college/assignments", {
          subjectId: assignmentSubjectId,
          title: assignmentTitle,
          dueDate: dayjs().add(7, "day").toISOString(),
          status: "pending"
        })
      ).data,
    onSuccess: () => {
      setAssignmentTitle("");
      queryClient.invalidateQueries({ queryKey: ["college"] });
    },
    onError: (error) => toast.error(getErrorMessage(error))
  });

  const addExam = useMutation({
    mutationFn: async () =>
      (
        await api.post("/college/exams", {
          subjectId: examSubjectId,
          type: examType,
          date: dayjs().add(14, "day").toISOString()
        })
      ).data,
    onSuccess: () => {
      setExamType("");
      queryClient.invalidateQueries({ queryKey: ["college"] });
    },
    onError: (error) => toast.error(getErrorMessage(error))
  });

  return (
    <section className="mx-auto max-w-7xl space-y-6 px-4 py-8 md:px-8">
      <PageHeader eyebrow="Academic rhythm" title="College Tracker" description="Subjects, assignments, and exams appear only when you add your own academic data." />

      <div className="grid gap-6 xl:grid-cols-3">
        <Card>
          <h2 className="font-serif text-3xl italic text-ink">Add subject</h2>
          <div className="mt-4 space-y-3">
            <Input value={subjectName} onChange={(e) => setSubjectName(e.target.value)} placeholder="Subject name" />
            <Input value={credits} onChange={(e) => setCredits(e.target.value)} placeholder="Credits" />
            <Input value={semester} onChange={(e) => setSemester(e.target.value)} placeholder="Semester" />
          </div>
          <div className="mt-4"><Button type="button" onClick={() => subjectName && credits && semester && addSubject.mutate()}>Add subject</Button></div>
        </Card>

        <Card>
          <h2 className="font-serif text-3xl italic text-ink">Add assignment</h2>
          <div className="mt-4 space-y-3">
            <select value={assignmentSubjectId} onChange={(e) => setAssignmentSubjectId(e.target.value)} className="w-full rounded-2xl border border-line bg-cream px-4 py-3 text-sm text-ink outline-none">
              <option value="">Choose subject</option>
              {(data?.subjects ?? []).map((subject: any) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
            </select>
            <Input value={assignmentTitle} onChange={(e) => setAssignmentTitle(e.target.value)} placeholder="Assignment title" />
          </div>
          <div className="mt-4"><Button type="button" onClick={() => assignmentSubjectId && assignmentTitle && addAssignment.mutate()}>Add assignment</Button></div>
        </Card>

        <Card>
          <h2 className="font-serif text-3xl italic text-ink">Add exam</h2>
          <div className="mt-4 space-y-3">
            <select value={examSubjectId} onChange={(e) => setExamSubjectId(e.target.value)} className="w-full rounded-2xl border border-line bg-cream px-4 py-3 text-sm text-ink outline-none">
              <option value="">Choose subject</option>
              {(data?.subjects ?? []).map((subject: any) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
            </select>
            <Input value={examType} onChange={(e) => setExamType(e.target.value)} placeholder="Exam type" />
          </div>
          <div className="mt-4"><Button type="button" onClick={() => examSubjectId && examType && addExam.mutate()}>Add exam</Button></div>
        </Card>
      </div>

      {!data || (data.subjects.length === 0 && data.assignments.length === 0 && data.exams.length === 0) ? (
        <EmptyState title="No academic data yet" description="Add your subjects first, then assignments and exams will build your tracker." />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card>
            <h2 className="font-serif text-3xl italic text-ink">Subjects</h2>
            <div className="mt-4 space-y-3">
              {(data.subjects ?? []).map((subject: any) => (
                <div key={subject.id} className="rounded-2xl border border-line bg-cream/70 px-4 py-3">
                  <p className="text-sm text-ink">{subject.name}</p>
                  <p className="text-xs text-ink/60">{subject.semester} · {subject.credits} credits</p>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <h2 className="font-serif text-3xl italic text-ink">Assignments</h2>
            <div className="mt-4 space-y-3">
              {(data.assignments ?? []).map((item: any) => (
                <div key={item.id} className="rounded-2xl border border-line bg-cream/70 px-4 py-3">
                  <p className="text-sm text-ink">{item.title}</p>
                  <p className="text-xs text-ink/60">{item.dueDate ? dayjs(item.dueDate).format("DD MMM") : "No date"} · {item.status}</p>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <h2 className="font-serif text-3xl italic text-ink">Exams</h2>
            <div className="mt-4 space-y-3">
              {(data.exams ?? []).map((item: any) => (
                <div key={item.id} className="rounded-2xl border border-line bg-cream/70 px-4 py-3">
                  <p className="text-sm text-ink">{item.type}</p>
                  <p className="text-xs text-ink/60">{dayjs(item.date).format("DD MMM YYYY")}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </section>
  );
}
