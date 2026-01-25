"use client";

import { useState, useEffect, useCallback } from "react";
import { liffService, LiffService } from "../services/liff-service";
import { authService } from "../services/auth-service";
import type { LiffContext, LineProfile } from "../types";

interface UseLiffReturn extends LiffContext {
  init: () => Promise<void>;
  login: () => void;
  logout: () => void;
  getProfile: () => Promise<LineProfile | null>;
  authenticateWithSupabase: () => Promise<{ success: boolean; error?: string }>;
}

interface UseLiffOptions {
  liffId?: string;
  autoInit?: boolean;
}

const DEFAULT_LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID || "";

export function useLiff(options?: UseLiffOptions): UseLiffReturn {
  const { liffId = DEFAULT_LIFF_ID, autoInit = true } = options || {};

  const [context, setContext] = useState<LiffContext>({
    isLiffBrowser: false,
    isLoggedIn: false,
    isInitialized: false,
    liffId: null,
    profile: null,
    idToken: null,
    error: null,
  });

  // Initialize LIFF
  const init = useCallback(async () => {
    if (!liffId) {
      setContext((prev) => ({
        ...prev,
        error: new Error("LIFF ID not configured"),
      }));
      return;
    }

    try {
      await liffService.init(liffId);
      const newContext = liffService.getContext();

      // If logged in, fetch profile
      let profile: LineProfile | null = null;
      if (newContext.isLoggedIn) {
        profile = await liffService.getProfile();
      }

      setContext({
        ...newContext,
        profile,
      });
    } catch (error) {
      setContext((prev) => ({
        ...prev,
        error: error instanceof Error ? error : new Error("LIFF init failed"),
      }));
    }
  }, [liffId]);

  // Auto-initialize if in LIFF environment
  useEffect(() => {
    if (!autoInit) return;

    const isLiffEnv = LiffService.detectLiffEnvironment();
    if (isLiffEnv && liffId) {
      init();
    }
  }, [autoInit, liffId, init]);

  // LIFF Login
  const login = useCallback(() => {
    try {
      liffService.login();
    } catch (error) {
      setContext((prev) => ({
        ...prev,
        error: error instanceof Error ? error : new Error("LIFF login failed"),
      }));
    }
  }, []);

  // LIFF Logout
  const logout = useCallback(() => {
    try {
      liffService.logout();
      setContext((prev) => ({
        ...prev,
        isLoggedIn: false,
        profile: null,
        idToken: null,
      }));
    } catch (error) {
      setContext((prev) => ({
        ...prev,
        error: error instanceof Error ? error : new Error("LIFF logout failed"),
      }));
    }
  }, []);

  // Get Profile
  const getProfile = useCallback(async () => {
    const profile = await liffService.getProfile();
    if (profile) {
      setContext((prev) => ({ ...prev, profile }));
    }
    return profile;
  }, []);

  // Authenticate with Supabase using LIFF ID Token
  const authenticateWithSupabase = useCallback(async () => {
    const idToken = liffService.getIDToken();

    if (!idToken) {
      return {
        success: false,
        error: "No LIFF ID token available. Please login to LINE first.",
      };
    }

    try {
      const result = await authService.signInWithLiffToken(idToken);
      return {
        success: result.success,
        error: result.error,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Authentication failed",
      };
    }
  }, []);

  return {
    ...context,
    init,
    login,
    logout,
    getProfile,
    authenticateWithSupabase,
  };
}
