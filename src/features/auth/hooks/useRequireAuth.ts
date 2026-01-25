"use client";

import { useState, useCallback } from "react";
import { useAuthContext } from "../providers/AuthProvider";

interface UseRequireAuthOptions {
  onUnauthenticated?: () => void;
}

interface UseRequireAuthReturn {
  /** Whether user is authenticated */
  isAuthenticated: boolean;
  /** Whether login modal should be shown */
  showLoginModal: boolean;
  /** Open login modal */
  openLoginModal: () => void;
  /** Close login modal */
  closeLoginModal: () => void;
  /**
   * Require auth for an action.
   * Returns true if authenticated, opens modal and returns false otherwise.
   */
  requireAuth: (callback?: () => void) => boolean;
  /** Pending callback to execute after successful login */
  pendingCallback: (() => void) | null;
  /** Execute pending callback and clear it */
  executePendingCallback: () => void;
}

/**
 * Hook to require authentication for actions
 *
 * Usage:
 * ```tsx
 * const { requireAuth, showLoginModal, closeLoginModal } = useRequireAuth();
 *
 * const handleMyPageClick = () => {
 *   if (requireAuth(() => router.push('/my'))) {
 *     router.push('/my');
 *   }
 * };
 * ```
 */
export function useRequireAuth(
  options?: UseRequireAuthOptions
): UseRequireAuthReturn {
  const { isAuthenticated } = useAuthContext();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingCallback, setPendingCallback] = useState<(() => void) | null>(
    null
  );

  const openLoginModal = useCallback(() => {
    setShowLoginModal(true);
    options?.onUnauthenticated?.();
  }, [options]);

  const closeLoginModal = useCallback(() => {
    setShowLoginModal(false);
    setPendingCallback(null);
  }, []);

  const requireAuth = useCallback(
    (callback?: () => void): boolean => {
      if (isAuthenticated) {
        return true;
      }

      // Store callback to execute after login
      if (callback) {
        setPendingCallback(() => callback);
      }

      openLoginModal();
      return false;
    },
    [isAuthenticated, openLoginModal]
  );

  const executePendingCallback = useCallback(() => {
    if (pendingCallback) {
      pendingCallback();
      setPendingCallback(null);
    }
    closeLoginModal();
  }, [pendingCallback, closeLoginModal]);

  return {
    isAuthenticated,
    showLoginModal,
    openLoginModal,
    closeLoginModal,
    requireAuth,
    pendingCallback,
    executePendingCallback,
  };
}
