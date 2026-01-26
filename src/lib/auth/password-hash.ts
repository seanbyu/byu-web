/**
 * Password Hash Utility for LINE Authentication
 *
 * Generates a deterministic password from LINE User ID for Supabase authentication.
 * This enables real Supabase sessions (access_token, refresh_token) instead of mock tokens.
 */

import { createHash } from "crypto";

/**
 * Generate a secure password from LINE User ID
 * Uses SHA256 hash of LINE User ID combined with a secret
 *
 * @param lineUserId - The LINE user's unique ID (sub claim from token)
 * @returns A 64-character hexadecimal password
 */
export function generateLinePassword(lineUserId: string): string {
  const secret =
    process.env.LINE_PASSWORD_SECRET || process.env.LINE_CHANNEL_SECRET;

  if (!secret) {
    throw new Error(
      "LINE_PASSWORD_SECRET or LINE_CHANNEL_SECRET must be configured"
    );
  }

  // Create deterministic password: hash(lineUserId:secret)
  const hash = createHash("sha256");
  hash.update(`${lineUserId}:${secret}`);
  return hash.digest("hex");
}

/**
 * Generate email for LINE user
 * Creates a consistent email format for users without email from LINE
 *
 * @param lineUserId - The LINE user's unique ID
 * @returns Email address in format: {lineUserId}@line.local
 */
export function generateLineEmail(lineUserId: string): string {
  return `${lineUserId}@line.local`;
}
