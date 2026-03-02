"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { authService } from "../services/auth-service";
import { liffService, LiffService } from "../services/liff-service";
import type { AuthState, AuthEnvironment, LineProfile, LiffContext } from "../types";
import type { User, Session } from "@supabase/supabase-js";

// Combined Auth Context Type
interface AuthContextType extends AuthState {
  // Environment
  environment: AuthEnvironment;

  // Web Auth Methods
  signInWithLine: () => Promise<void>;
  signOut: () => Promise<void>;

  // LIFF Context & Methods
  liff: LiffContext;
  initLiff: () => Promise<void>;
  authenticateWithLiff: () => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: React.ReactNode;
  liffId?: string;
}

export function AuthProvider({ children, liffId }: AuthProviderProps) {
  // Auth State
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
  });

  // Environment
  const [environment, setEnvironment] = useState<AuthEnvironment>("unknown");

  // LIFF State
  const [liffState, setLiffState] = useState<LiffContext>({
    isLiffBrowser: false,
    isLoggedIn: false,
    isInitialized: false,
    liffId: liffId || null,
    profile: null,
    idToken: null,
    error: null,
  });

  // Initialize Auth
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Detect environment
        const env = authService.detectEnvironment();
        setEnvironment(env);

        // Get current session
        const session = await authService.getSession();
        const user = await authService.getUser();

        setAuthState({
          user,
          session,
          isLoading: false,
          isAuthenticated: !!session,
          error: null,
        });

        // If LIFF environment and liffId provided, auto-init LIFF and authenticate
        if (env === "liff" && liffId) {
          await initLiffInternal();

          // Auto-authenticate if LIFF user is logged in but no Supabase session
          if (!session) {
            const idToken = liffService.getIDToken();
            if (idToken) {
              const result = await authService.signInWithLiffToken(idToken);
              if (result.success) {
                setAuthState((prev) => ({
                  ...prev,
                  user: result.user || null,
                  session: result.session || null,
                  isAuthenticated: true,
                }));
              }
            }
          }
        }
      } catch (error) {
        setAuthState((prev) => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error : new Error("Auth init failed"),
        }));
      }
    };

    initAuth();

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = authService.onAuthStateChange((event: string, session: Session | null) => {
      setAuthState((prev) => ({
        ...prev,
        session,
        user: session?.user ?? null,
        isAuthenticated: !!session,
      }));
    });

    return () => {
      subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liffId]);

  // Internal LIFF init
  const initLiffInternal = async () => {
    const effectiveLiffId = liffId || process.env.NEXT_PUBLIC_LIFF_ID;
    if (!effectiveLiffId) return;

    try {
      await liffService.init(effectiveLiffId);
      const context = liffService.getContext();

      let profile: LineProfile | null = null;
      if (context.isLoggedIn) {
        profile = await liffService.getProfile();
      }

      setLiffState({
        ...context,
        profile,
        liffId: effectiveLiffId,
      });
    } catch (error) {
      setLiffState((prev) => ({
        ...prev,
        error: error instanceof Error ? error : new Error("LIFF init failed"),
      }));
    }
  };

  // Public LIFF init
  const initLiff = useCallback(async () => {
    await initLiffInternal();
  }, [liffId]);

  // Sign in with LINE (Web flow)
  const signInWithLine = useCallback(async () => {
    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const { error } = await authService.signInWithLine();
      if (error) {
        setAuthState((prev) => ({
          ...prev,
          isLoading: false,
          error: new Error(error.message),
        }));
      }
    } catch (error) {
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error : new Error("Sign in failed"),
      }));
    }
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    setAuthState((prev) => ({ ...prev, isLoading: true }));

    try {
      await authService.signOut();

      // Also logout from LIFF if in LIFF environment
      if (liffState.isLoggedIn) {
        try {
          liffService.logout();
        } catch {
          // Ignore LIFF logout errors
        }
      }

      setAuthState({
        user: null,
        session: null,
        isLoading: false,
        isAuthenticated: false,
        error: null,
      });

      setLiffState((prev) => ({
        ...prev,
        isLoggedIn: false,
        profile: null,
        idToken: null,
      }));
    } catch (error) {
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error : new Error("Sign out failed"),
      }));
    }
  }, [liffState.isLoggedIn]);

  // Authenticate with LIFF token
  const authenticateWithLiff = useCallback(async () => {
    const idToken = liffService.getIDToken();

    if (!idToken) {
      return {
        success: false,
        error: "No LIFF ID token available",
      };
    }

    setAuthState((prev) => ({ ...prev, isLoading: true }));

    try {
      const result = await authService.signInWithLiffToken(idToken);

      if (result.success) {
        setAuthState((prev) => ({
          ...prev,
          isLoading: false,
          user: result.user || null,
          session: result.session || null,
          isAuthenticated: true,
        }));
      } else {
        setAuthState((prev) => ({
          ...prev,
          isLoading: false,
          error: new Error(result.error || "Authentication failed"),
        }));
      }

      return {
        success: result.success,
        error: result.error,
      };
    } catch (error) {
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error : new Error("Authentication failed"),
      }));

      return {
        success: false,
        error: error instanceof Error ? error.message : "Authentication failed",
      };
    }
  }, []);

  // Memoize context value
  const value = useMemo<AuthContextType>(
    () => ({
      ...authState,
      environment,
      signInWithLine,
      signOut,
      liff: liffState,
      initLiff,
      authenticateWithLiff,
    }),
    [authState, environment, signInWithLine, signOut, liffState, initLiff, authenticateWithLiff]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook to use auth context
export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return context;
}
