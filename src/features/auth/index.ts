/**
 * Auth Feature Module
 *
 * LINE Login + LIFF Integration for Supabase Auth
 *
 * Note: This module is client-only. Import from specific files if needed in Server Components.
 */

// Services
export { authService, AuthService } from "./services/auth-service";
export { liffService, LiffService } from "./services/liff-service";

// Hooks
export { useAuth } from "./hooks/useAuth";
export { useLiff } from "./hooks/useLiff";
export { useRequireAuth } from "./hooks/useRequireAuth";

// Provider
export { AuthProvider, useAuthContext } from "./providers/AuthProvider";
export { ClientAuthProvider } from "./providers/ClientAuthProvider";

// Components
export { LineLoginButton } from "./components/LineLoginButton";
export { LoginModal } from "./components/LoginModal";
export { AuthBottomNav } from "./components/AuthBottomNav";

// Utils
export { getDeviceInfo, getLoginStrategy, isLikelyLineInstalled } from "./utils/device";
export type { DeviceInfo, LoginStrategy } from "./utils/device";

// Types
export type {
  AuthState,
  LiffContext,
  LineProfile,
  AuthEnvironment,
  LineOAuthOptions,
  LiffLoginRequest,
  LiffLoginResponse,
  AuthServiceOptions,
} from "./types";
