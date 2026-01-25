"use client";

import { useState, useEffect, useCallback } from "react";
import { authService } from "../services/auth-service";
import type { AuthState, AuthEnvironment } from "../types";
import type { User, Session } from "@supabase/supabase-js";

interface UseAuthReturn extends AuthState {
  environment: AuthEnvironment;
  signInWithLine: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
  });

  const [environment, setEnvironment] = useState<AuthEnvironment>("unknown");

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Detect environment
        const env = authService.detectEnvironment();
        setEnvironment(env);

        // Get initial session
        const session = await authService.getSession();
        const user = await authService.getUser();

        setState({
          user,
          session,
          isLoading: false,
          isAuthenticated: !!session,
          error: null,
        });
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error : new Error("Auth init failed"),
        }));
      }
    };

    initAuth();

    // Subscribe to auth state changes
    const {
      data: { subscription },
    } = authService.onAuthStateChange(
      (event: string, session: Session | null) => {
        setState((prev) => ({
          ...prev,
          session,
          user: session?.user ?? null,
          isAuthenticated: !!session,
          isLoading: false,
        }));
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sign in with LINE
  const signInWithLine = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const { error } = await authService.signInWithLine();
      if (error) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: new Error(error.message),
        }));
      }
      // If successful, page will redirect to LINE OAuth
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error : new Error("Sign in failed"),
      }));
    }
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const { error } = await authService.signOut();
      if (error) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: new Error(error.message),
        }));
      } else {
        setState({
          user: null,
          session: null,
          isLoading: false,
          isAuthenticated: false,
          error: null,
        });
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error : new Error("Sign out failed"),
      }));
    }
  }, []);

  // Refresh session
  const refreshSession = useCallback(async () => {
    try {
      const { session, error } = await authService.refreshSession();
      if (error) {
        setState((prev) => ({
          ...prev,
          error: new Error(error.message),
        }));
      } else if (session) {
        setState((prev) => ({
          ...prev,
          session,
          user: session.user,
          isAuthenticated: true,
        }));
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error : new Error("Refresh failed"),
      }));
    }
  }, []);

  return {
    ...state,
    environment,
    signInWithLine,
    signOut,
    refreshSession,
  };
}
