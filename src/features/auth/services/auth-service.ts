"use client";

/**
 * Auth Service - LINE Login with Supabase Session
 *
 * Supports both Web OAuth and LIFF token-based authentication
 * Since Supabase doesn't support LINE OAuth, we use direct LINE OAuth
 */

import { createClient } from "@/lib/supabase/client";
import type { User, Session, AuthError } from "@supabase/supabase-js";
import type { AuthEnvironment, LineOAuthOptions, LiffLoginResponse } from "../types";

// LINE OAuth URLs
const LINE_AUTH_URL = "https://access.line.me/oauth2/v2.1/authorize";

class AuthService {
  private _supabase: ReturnType<typeof createClient> | null = null;

  // Lazy initialization to avoid server-side instantiation
  private get supabase() {
    if (!this._supabase) {
      this._supabase = createClient();
    }
    return this._supabase;
  }

  /**
   * Detect current authentication environment
   */
  detectEnvironment(): AuthEnvironment {
    if (typeof window === "undefined") return "unknown";

    // Check if running inside LIFF browser
    const userAgent = navigator.userAgent.toLowerCase();
    const isLiff =
      userAgent.includes("line") ||
      userAgent.includes("liff") ||
      window.location.href.includes("liff.state");

    if (isLiff) return "liff";
    return "web";
  }

  /**
   * Sign in with LINE OAuth (Web Browser Flow)
   * Uses direct LINE OAuth since Supabase doesn't support LINE provider
   */
  async signInWithLine(options?: LineOAuthOptions): Promise<{
    error: AuthError | null;
  }> {
    try {
      const channelId = process.env.NEXT_PUBLIC_LINE_CHANNEL_ID;

      if (!channelId) {
        // Fallback: redirect to our LINE OAuth initiation endpoint
        const currentPath = window.location.pathname + window.location.search;
        window.location.href = `/api/auth/line?returnUrl=${encodeURIComponent(currentPath)}`;
        return { error: null };
      }

      const redirectUri = options?.redirectTo || `${window.location.origin}/api/auth/line/callback`;
      const csrfToken = crypto.randomUUID();
      const nonce = crypto.randomUUID();

      // Encode CSRF token + return URL in state parameter
      const statePayload = JSON.stringify({
        csrf: csrfToken,
        returnUrl: window.location.pathname + window.location.search,
      });
      const state = btoa(statePayload);

      // Store CSRF token for verification
      sessionStorage.setItem("line_oauth_state", csrfToken);

      const params = new URLSearchParams({
        response_type: "code",
        client_id: channelId,
        redirect_uri: redirectUri,
        state,
        scope: options?.scopes?.join(" ") || "profile openid email",
        nonce,
      });

      if (options?.botPrompt) {
        params.append("bot_prompt", options.botPrompt);
      }

      // Redirect to LINE OAuth
      window.location.href = `${LINE_AUTH_URL}?${params.toString()}`;

      return { error: null };
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : "Failed to initiate LINE login",
          status: 500,
        } as AuthError
      };
    }
  }

  /**
   * Sign in with LIFF ID Token
   * Sends token to server for verification and session creation
   */
  async signInWithLiffToken(idToken: string): Promise<LiffLoginResponse> {
    try {
      const response = await fetch("/api/auth/liff", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || "LIFF authentication failed",
        };
      }

      // Refresh the Supabase client to pick up the new session
      await this.supabase.auth.refreshSession();

      return {
        success: true,
        user: data.user,
        session: data.session,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get current user
   */
  async getUser(): Promise<User | null> {
    const {
      data: { user },
    } = await this.supabase.auth.getUser();
    return user;
  }

  /**
   * Get current session
   */
  async getSession(): Promise<Session | null> {
    const {
      data: { session },
    } = await this.supabase.auth.getSession();
    return session;
  }

  /**
   * Sign out
   */
  async signOut(): Promise<{ error: AuthError | null }> {
    const { error } = await this.supabase.auth.signOut();
    return { error };
  }

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(
    callback: (event: string, session: Session | null) => void
  ) {
    return this.supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
  }

  /**
   * Refresh session
   */
  async refreshSession(): Promise<{
    session: Session | null;
    error: AuthError | null;
  }> {
    const {
      data: { session },
      error,
    } = await this.supabase.auth.refreshSession();
    return { session, error };
  }
}

// Export singleton instance
export const authService = new AuthService();

// Export class for testing
export { AuthService };
