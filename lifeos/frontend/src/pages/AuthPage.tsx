import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { HeartHandshake } from "lucide-react";
import { api, getErrorMessage } from "@/utils/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function AuthPage() {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"login" | "register">("register");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const authMutation = useMutation({
    mutationFn: async () =>
      mode === "register"
        ? (await api.post("/auth/register", { name, email, password })).data
        : (await api.post("/auth/login", { email, password })).data,
    onSuccess: async () => {
      toast.success(mode === "register" ? "Welcome to LifeOS." : "Welcome back.");
      await queryClient.invalidateQueries({ queryKey: ["session"] });
    },
    onError: (error) => toast.error(getErrorMessage(error))
  });

  return (
    <section className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="paper-noise fixed inset-0 pointer-events-none opacity-50" />
      <Card className="relative w-full max-w-5xl overflow-hidden p-0">
        <div className="grid md:grid-cols-[0.95fr_1.05fr]">
          <div className="bg-parchment p-8 md:p-12">
            <p className="font-accent text-4xl text-terracotta">LifeOS</p>
            <h1 className="mt-4 font-serif text-6xl italic text-ink">A personal system that actually feels human.</h1>
            <p className="mt-5 text-sm leading-7 text-ink/70">
              Your planner, diary, goals, board, and student-life tools live here. No demo records will be created for you.
            </p>
            <div className="mt-8 rounded-[1.75rem] border border-line bg-card/80 p-5">
              <div className="flex items-center gap-3">
                <HeartHandshake className="text-terracotta" />
                <p className="text-sm text-ink/70">Free-first setup: local uploads, OCR fallback, optional AI key later if you ever want it.</p>
              </div>
            </div>
          </div>

          <div className="p-8 md:p-12">
            <p className="font-serif text-4xl italic text-ink">{mode === "register" ? "Create your space" : "Sign in"}</p>
            <div className="mt-6 space-y-4">
              {mode === "register" ? <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" /> : null}
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" />
              <Input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" />
            </div>

            <div className="mt-6 flex gap-3">
              <Button
                type="button"
                onClick={() => authMutation.mutate()}
                disabled={!email || !password || (mode === "register" && !name)}
              >
                {mode === "register" ? "Create account" : "Sign in"}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setMode(mode === "register" ? "login" : "register")}>
                {mode === "register" ? "I already have an account" : "I need an account"}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </section>
  );
}
