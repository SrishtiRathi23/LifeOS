import { useQuery } from "@tanstack/react-query";
import { api } from "@/utils/api";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  profilePhoto?: string | null;
  settings?: Record<string, unknown> | null;
  entitlements?: {
    plan: "free" | "premium";
    status: "active" | "trialing" | "past_due" | "canceled";
    premiumUntil?: string | null;
    isPremium: boolean;
    premiumFeatures: Record<string, boolean>;
  };
};

export function useSession() {
  return useQuery({
    queryKey: ["session"],
    queryFn: async () => (await api.get<SessionUser>("/auth/me")).data,
    retry: false
  });
}
