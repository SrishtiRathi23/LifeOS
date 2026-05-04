import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { HeartHandshake } from "lucide-react";
import { api, getErrorMessage } from "@/utils/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function AuthPage() {
  const queryClient = useQueryClient();
  const googleButtonRef = useRef<HTMLDivElement | null>(null);
  const [mode, setMode] = useState<"login" | "register">("register");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [googleStatus, setGoogleStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");

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

  const googleMutation = useMutation({
    mutationFn: async (credential: string) => (await api.post("/auth/google", { credential })).data,
    onSuccess: async () => {
      toast.success("Signed in with Google.");
      await queryClient.invalidateQueries({ queryKey: ["session"] });
    },
    onError: (error) => toast.error(getErrorMessage(error))
  });

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId || !googleButtonRef.current) return;
    setGoogleStatus("loading");

    const renderGoogleButton = () => {
      if (!window.google || !googleButtonRef.current) return;

      googleButtonRef.current.innerHTML = "";
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          if (response.credential) {
            googleMutation.mutate(response.credential);
          }
        }
      });
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "large",
        width: 320,
        text: mode === "register" ? "signup_with" : "signin_with"
      });
      setGoogleStatus("ready");
    };

    if (window.google) {
      renderGoogleButton();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = renderGoogleButton;
    script.onerror = () => setGoogleStatus("error");
    document.head.appendChild(script);
  }, [googleMutation, mode]);

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

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
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

            {import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
              <>
                <div className="my-6 flex items-center gap-3">
                  <span className="h-px flex-1 bg-line" />
                  <span className="text-xs font-medium uppercase tracking-[0.2em] text-ink/45">or</span>
                  <span className="h-px flex-1 bg-line" />
                </div>
                <div className="rounded-lg border border-line bg-cream p-3">
                  <p className="mb-3 text-sm font-medium text-ink">Google account login</p>
                  <div ref={googleButtonRef} className="min-h-11" />
                  {googleStatus === "loading" && <p className="mt-2 text-xs text-ink/55">Loading Google sign-in...</p>}
                  {googleStatus === "error" && (
                    <p className="mt-2 text-xs text-terracotta">
                      Google sign-in script did not load. Check internet access and the Google OAuth origin settings.
                    </p>
                  )}
                </div>
              </>
            ) : (
              <p className="mt-5 rounded-lg border border-line bg-cream p-3 text-xs leading-5 text-ink/55">
                Google sign-in is ready in the code. Add your free Google OAuth Client ID to enable the button.
              </p>
            )}
          </div>
        </div>
      </Card>
    </section>
  );
}
