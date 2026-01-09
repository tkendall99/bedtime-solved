"use client";

/**
 * AuthProvider - Handles automatic anonymous authentication
 *
 * This provider automatically signs users in anonymously when they don't have
 * a session. This allows users to create book previews without manual login.
 *
 * When users are ready to pay, they can convert to a permanent account.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { User, Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

type AuthState = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAnonymous: boolean;
  error: string | null;
};

type AuthContextType = AuthState & {
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    isAnonymous: false,
    error: null,
  });

  const supabase = createClient();

  // Check if user is anonymous based on JWT claims
  const checkIsAnonymous = useCallback((session: Session | null): boolean => {
    if (!session?.access_token) return false;
    try {
      // Decode JWT payload (base64)
      const payload = JSON.parse(atob(session.access_token.split(".")[1]));
      return payload.is_anonymous === true;
    } catch {
      return false;
    }
  }, []);

  // Initialize auth state
  const initializeAuth = useCallback(async () => {
    try {
      // Check for existing session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("[Auth] Error getting session:", sessionError);
        setState((prev) => ({ ...prev, error: sessionError.message, isLoading: false }));
        return;
      }

      if (session) {
        // User has a session
        setState({
          user: session.user,
          session,
          isLoading: false,
          isAnonymous: checkIsAnonymous(session),
          error: null,
        });
        return;
      }

      // No session - sign in anonymously
      console.log("[Auth] No session found, signing in anonymously...");
      const { data: anonData, error: anonError } =
        await supabase.auth.signInAnonymously();

      if (anonError) {
        console.error("[Auth] Error signing in anonymously:", anonError);
        setState((prev) => ({
          ...prev,
          error: anonError.message,
          isLoading: false,
        }));
        return;
      }

      if (anonData.session) {
        console.log("[Auth] Anonymous sign-in successful");
        setState({
          user: anonData.user,
          session: anonData.session,
          isLoading: false,
          isAnonymous: true,
          error: null,
        });
      }
    } catch (err) {
      console.error("[Auth] Unexpected error:", err);
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : "Unknown error",
        isLoading: false,
      }));
    }
  }, [supabase, checkIsAnonymous]);

  // Sign out
  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("[Auth] Sign out error:", error);
    }
    // Auth state change listener will handle the state update
  }, [supabase]);

  // Refresh session
  const refreshSession = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session) {
      setState((prev) => ({
        ...prev,
        user: session.user,
        session,
        isAnonymous: checkIsAnonymous(session),
      }));
    }
  }, [supabase, checkIsAnonymous]);

  // Set up auth state listener
  useEffect(() => {
    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[Auth] Auth state changed:", event);

      if (event === "SIGNED_OUT") {
        // User signed out - sign in anonymously again
        setState((prev) => ({ ...prev, isLoading: true }));
        const { data: anonData } = await supabase.auth.signInAnonymously();
        if (anonData.session) {
          setState({
            user: anonData.user,
            session: anonData.session,
            isLoading: false,
            isAnonymous: true,
            error: null,
          });
        }
      } else if (session) {
        setState({
          user: session.user,
          session,
          isLoading: false,
          isAnonymous: checkIsAnonymous(session),
          error: null,
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [initializeAuth, supabase, checkIsAnonymous]);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signOut,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

/**
 * Hook to ensure user is authenticated before performing an action
 * Returns true when auth is ready, false while loading
 */
export function useRequireAuth() {
  const { isLoading, user, error } = useAuth();
  return {
    isReady: !isLoading && user !== null,
    isLoading,
    user,
    error,
  };
}
