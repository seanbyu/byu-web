"use client";

import { AuthProvider } from "./AuthProvider";

interface ClientAuthProviderProps {
  children: React.ReactNode;
  liffId?: string;
}

/**
 * Client-side Auth Provider wrapper
 *
 * Use this in Server Components to wrap client components that need auth
 */
export function ClientAuthProvider({
  children,
  liffId,
}: ClientAuthProviderProps) {
  return <AuthProvider liffId={liffId}>{children}</AuthProvider>;
}
