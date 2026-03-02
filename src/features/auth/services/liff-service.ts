"use client";

/**
 * LIFF Service - LINE Front-end Framework Integration
 *
 * Handles LIFF SDK initialization and LINE-specific operations
 */

import type { LineProfile, LiffContext } from "../types";

// LIFF SDK type declarations
declare global {
  interface Window {
    liff: {
      init: (config: { liffId: string }) => Promise<void>;
      isLoggedIn: () => boolean;
      login: (config?: { redirectUri?: string }) => void;
      logout: () => void;
      getProfile: () => Promise<LineProfile>;
      getIDToken: () => string | null;
      isInClient: () => boolean;
      getContext: () => {
        type: string;
        viewType: string;
        userId: string;
        utouId?: string;
        roomId?: string;
        groupId?: string;
      } | null;
      ready: Promise<void>;
    };
  }
}

class LiffService {
  private initialized = false;
  private liffId: string | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize LIFF SDK
   * Should be called once at app startup
   */
  async init(liffId: string): Promise<void> {
    if (this.initialized) return;

    // Prevent multiple initializations
    if (this.initPromise) return this.initPromise;

    this.liffId = liffId;

    this.initPromise = (async () => {
      try {
        // Load LIFF SDK if not already loaded
        if (!window.liff) {
          await this.loadLiffSdk();
        }

        await window.liff.init({ liffId });
        this.initialized = true;
      } catch (error) {
        this.initPromise = null;
        throw error;
      }
    })();

    return this.initPromise;
  }

  /**
   * Dynamically load LIFF SDK
   */
  private loadLiffSdk(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.liff) {
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = "https://static.line-scdn.net/liff/edge/2/sdk.js";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load LIFF SDK"));
      document.head.appendChild(script);
    });
  }

  /**
   * Check if running inside LINE app
   */
  isInClient(): boolean {
    if (!this.initialized || !window.liff) return false;
    return window.liff.isInClient();
  }

  /**
   * Check if user is logged in to LINE
   */
  isLoggedIn(): boolean {
    if (!this.initialized || !window.liff) return false;
    return window.liff.isLoggedIn();
  }

  /**
   * Trigger LINE login (redirects user)
   */
  login(redirectUri?: string): void {
    if (!window.liff) {
      throw new Error("LIFF SDK not initialized");
    }
    window.liff.login({ redirectUri });
  }

  /**
   * Logout from LINE
   */
  logout(): void {
    if (!window.liff) {
      throw new Error("LIFF SDK not initialized");
    }
    window.liff.logout();
  }

  /**
   * Get LINE user profile
   */
  async getProfile(): Promise<LineProfile | null> {
    if (!this.initialized || !window.liff) return null;
    if (!this.isLoggedIn()) return null;

    try {
      return await window.liff.getProfile();
    } catch {
      return null;
    }
  }

  /**
   * Get LINE ID Token for server-side verification
   */
  getIDToken(): string | null {
    if (!this.initialized || !window.liff) return null;
    if (!this.isLoggedIn()) return null;

    return window.liff.getIDToken();
  }

  /**
   * Get LIFF context information
   */
  getContext(): LiffContext {
    const base: LiffContext = {
      isLiffBrowser: false,
      isLoggedIn: false,
      isInitialized: this.initialized,
      liffId: this.liffId,
      profile: null,
      idToken: null,
      error: null,
    };

    if (!this.initialized || !window.liff) {
      return base;
    }

    return {
      ...base,
      isLiffBrowser: this.isInClient(),
      isLoggedIn: this.isLoggedIn(),
      idToken: this.getIDToken(),
    };
  }

  /**
   * Check if LIFF environment is detected
   */
  static detectLiffEnvironment(): boolean {
    if (typeof window === "undefined") return false;

    const userAgent = navigator.userAgent.toLowerCase();
    return (
      userAgent.includes("liff") ||
      window.location.href.includes("liff.state") ||
      window.location.search.includes("liff.state")
    );
  }
}

// Export singleton instance
export const liffService = new LiffService();

// Export class for testing
export { LiffService };
