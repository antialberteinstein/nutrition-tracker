import type { Session } from "@supabase/supabase-js";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import { supabase } from "@/lib/supabase";

type AuthState = {
  session: Session | null;
  initializing: boolean;
  /** Signed in from a password-recovery link; cleared once the new password is saved. */
  recovering: boolean;
};

const initialState: AuthState = {
  session: null,
  initializing: true,
  recovering: false,
};

const AuthContext = createContext<AuthState>(initialState);

/** Holds the Supabase session and keeps it in sync with sign-in, sign-out and token refresh. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<AuthState>(initialState);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active)
        setState((s) =>
          s.initializing
            ? { ...s, session: data.session, initializing: false }
            : s,
        );
    });
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      // Cached queries belong to the previous user; never show them to the next one.
      if (event === "SIGNED_OUT") queryClient.clear();
      setState((s) => ({
        session,
        initializing: false,
        recovering:
          event === "PASSWORD_RECOVERY"
            ? true
            : event === "USER_UPDATED" || event === "SIGNED_OUT"
              ? false
              : s.recovering,
      }));
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [queryClient]);

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
