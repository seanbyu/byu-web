// Auth Types for LINE Login + LIFF Integration

import type { User, Session } from "@supabase/supabase-js";

// Auth State
export interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: Error | null;
}

// LINE Profile from LIFF SDK
export interface LineProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

// LIFF Context
export interface LiffContext {
  isLiffBrowser: boolean;
  isLoggedIn: boolean;
  isInitialized: boolean;
  liffId: string | null;
  profile: LineProfile | null;
  idToken: string | null;
  error: Error | null;
}

// Auth Environment Detection
export type AuthEnvironment = "web" | "liff" | "unknown";

// LIFF Login Request
export interface LiffLoginRequest {
  idToken: string;
}

// LIFF Login Response
export interface LiffLoginResponse {
  success: boolean;
  user?: User;
  session?: Session;
  error?: string;
}

// Auth Service Options
export interface AuthServiceOptions {
  redirectTo?: string;
  scopes?: string[];
}

// LINE OAuth Options
export interface LineOAuthOptions extends AuthServiceOptions {
  botPrompt?: "normal" | "aggressive";
}
