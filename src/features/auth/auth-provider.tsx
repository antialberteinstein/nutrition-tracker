import type { Session } from "@supabase/supabase-js";
import { useQuery } from "@tanstack/react-query";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import { supabase } from "@/lib/supabase";

type AuthState = { session: Session | null; initializing: boolean };

const AuthContext = createContext<AuthState>({
  session: null,
  initializing: true,
});

/** Holds the Supabase session and keeps it in sync with sign-in, sign-out and token refresh. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    session: null,
    initializing: true,
  });

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) setState({ session: data.session, initializing: false });
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({ session, initializing: false });
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  return useContext(AuthContext);
}

export const profileExistsKey = (userId: string | undefined) =>
  ["profile-exists", userId] as const;

/** Whether the signed-in user has finished onboarding (has a profiles row). */
export function useHasProfile() {
  const { session } = useAuth();
  const userId = session?.user.id;
  return useQuery({
    queryKey: profileExistsKey(userId),
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("user_id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data !== null;
    },
  });
}
