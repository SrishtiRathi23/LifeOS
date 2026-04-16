import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import { Trash } from "lucide-react";
import { useConfirm } from "@/contexts/ConfirmContext";
import { api, getErrorMessage } from "@/utils/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { PrintButton } from "@/components/shared/PrintButton";

const chartColors = ["#C4956A", "#A8B89A", "#D4A5A0", "#8B5E3C", "#E8C4A0", "#3D3027"];

export function ExpensesPage() {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("food");
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [budget, setBudget] = useState("");
  const [savingsGoal, setSavingsGoal] = useState("");

  const { data: expenses } = useQuery({
    queryKey: ["expenses"],
    queryFn: async () => (await api.get("/expenses")).data
  });

  const { data: summary } = useQuery({
    queryKey: ["expenseSummary"],
    queryFn: async () => (await api.get("/expenses/summary")).data
  });

  const addExpense = useMutation({
    mutationFn: async () =>
      (
        await api.post("/expenses", {
          amount: Number(amount),
          category,
          date: new Date().toISOString(),
          note,
          paymentMethod,
          isRecurring: false
        })
      ).data,
    onSuccess: () => {
      setAmount("");
      setNote("");
      setPaymentMethod("");
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expenseSummary"] });
    },
    onError: (error) => toast.error(getErrorMessage(error))
  });

  const saveBudget = useMutation({
    mutationFn: async () =>
      (
        await api.post("/expenses/budget", {
          month: dayjs().month() + 1,
          year: dayjs().year(),
          totalBudget: Number(budget),
          savingsGoal: savingsGoal ? Number(savingsGoal) : null
        })
      ).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["expenseSummary"] }),
    onError: (error) => toast.error(getErrorMessage(error))
  });

  const deleteExpense = useMutation({
    mutationFn: async (id: string) => await api.delete(`/expenses/${id}`),
    onSuccess: () => {
      toast.success("Expense deleted.");
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expenseSummary"] });
    },
    onError: (error) => toast.error(getErrorMessage(error))
  });

  const pieData = summary ? Object.entries(summary.byCategory ?? {}).map(([name, value]) => ({ name, value })) : [];

  return (
    <section className="mx-auto max-w-7xl space-y-6 px-4 py-8 md:px-8">
      <PageHeader eyebrow="Money with clarity" title="Expense Tracker" description="Only your real expenses appear here. Nothing is prefilled." actions={<PrintButton />} />

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-6">
          <Card>
            <h2 className="font-serif text-3xl italic text-ink">Add expense</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" />
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-2xl border border-line bg-cream px-4 py-3 text-sm text-ink outline-none">
                <option value="food">Food</option>
                <option value="transport">Transport</option>
                <option value="college_fees">College Fees</option>
                <option value="books">Books</option>
                <option value="entertainment">Entertainment</option>
                <option value="health">Health</option>
                <option value="savings">Savings</option>
                <option value="misc">Misc</option>
              </select>
              <Input value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} placeholder="Payment method" />
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Short note" />
            </div>
            <div className="mt-4">
              <Button type="button" onClick={() => amount && addExpense.mutate()}>
                Add expense
              </Button>
            </div>
          </Card>

          <Card>
            <h2 className="font-serif text-3xl italic text-ink">Monthly budget</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <Input value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="Total budget" />
              <Input value={savingsGoal} onChange={(e) => setSavingsGoal(e.target.value)} placeholder="Savings goal" />
            </div>
            <div className="mt-4">
              <Button type="button" variant="secondary" onClick={() => budget && saveBudget.mutate()}>
                Save budget
              </Button>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card><p className="text-sm text-ink/65">Spent</p><p className="mt-3 font-serif text-4xl italic text-ink">{summary?.totalSpent ?? 0}</p></Card>
            <Card><p className="text-sm text-ink/65">Remaining</p><p className="mt-3 font-serif text-4xl italic text-ink">{summary?.remaining ?? "—"}</p></Card>
            <Card><p className="text-sm text-ink/65">Savings goal</p><p className="mt-3 font-serif text-4xl italic text-ink">{summary?.savingsGoal ?? "—"}</p></Card>
          </div>

          {!expenses || expenses.length === 0 ? (
            <EmptyState title="No expenses yet" description="Your charts and spending history will appear once you log your first expense." />
          ) : (
            <>
              <Card className="h-80">
                <h2 className="font-serif text-3xl italic text-ink">Category split</h2>
                <ResponsiveContainer width="100%" height="85%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90}>
                      {pieData.map((_, index) => <Cell key={index} fill={chartColors[index % chartColors.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
              <Card className="h-80">
                <h2 className="font-serif text-3xl italic text-ink">Daily spending</h2>
                <ResponsiveContainer width="100%" height="85%">
                  <BarChart data={summary?.daily ?? []}>
                    <XAxis dataKey="date" tickFormatter={(value) => dayjs(value).format("DD")} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="amount" fill="var(--terracotta)" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              <Card>
                <h2 className="font-serif text-3xl italic text-ink mb-4">Recent Expenses</h2>
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                  {(expenses ?? []).map((exp: any) => (
                    <div key={exp.id} className="group/expense relative flex items-center justify-between rounded-2xl border border-line bg-cream/70 px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-ink capitalize pr-8">{exp.category} <span className="font-normal text-ink/60 lowercase px-2">{exp.note && `· ${exp.note}`}</span></p>
                        <p className="text-xs text-ink/50 mt-0.5">{dayjs(exp.date).format("MMM D, YYYY")}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-serif text-lg text-ink font-medium">₹{exp.amount}</p>
                      </div>
                      <button
                        type="button"
                        title="Delete expense"
                        className="absolute right-[-10px] top-[-10px] bg-cream rounded-full border border-line p-1.5 text-terracotta/40 hover:text-terracotta hover:border-terracotta opacity-0 group-hover/expense:opacity-100 transition-all"
                        onClick={async () => {
                          if (await confirm({ title: "Delete expense", message: "Are you sure you want to delete this expense?" })) {
                            deleteExpense.mutate(exp.id);
                          }
                        }}
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
