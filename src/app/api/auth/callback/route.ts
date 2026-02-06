/**
 * Auth Callback Route Handler
 *
 * Handles OAuth callback from LINE (via Supabase)
 * Exchanges auth code for session using PKCE flow
 */

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Type for the find_or_create_user_by_identity RPC response
interface FindOrCreateUserResult {
  user_id: string;
  is_new_user: boolean;
  is_new_identity: boolean;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");
  const next = requestUrl.searchParams.get("next") || "/";

  // Get origin for redirects
  const origin = requestUrl.origin;

  // Handle OAuth errors
  if (error) {
    console.error("OAuth error:", error, errorDescription);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(errorDescription || error)}`
    );
  }

  // Exchange code for session
  if (code) {
    const supabase = await createClient();

    const { data, error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error("Code exchange error:", exchangeError);
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(exchangeError.message)}`
      );
    }

    // Successfully authenticated
    if (data.session) {
      // Optional: Sync user data to your users table
      await syncUserToDatabase(supabase, data.session.user);

      // Redirect to intended destination
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // No code provided - redirect to login
  return NextResponse.redirect(`${origin}/login`);
}

/**
 * Sync authenticated user to database via find_or_create_user_by_identity RPC
 * Uses the new multi-social login system with user_identities table
 */
async function syncUserToDatabase(
  supabase: Awaited<ReturnType<typeof createClient>>,
  user: { id: string; email?: string; user_metadata?: Record<string, unknown> }
) {
  try {
    const metadata = user.user_metadata || {};

    // Extract LINE profile data from user metadata
    const lineUserId =
      (metadata.line_user_id as string | undefined) ||
      (metadata.provider_id as string | undefined);
    const name = (metadata.full_name as string | undefined) || "LINE User";
    const profileImage = metadata.avatar_url as string | undefined;
    const provider = (metadata.provider as string | undefined) || "LINE";

    // Build profile JSONB
    const profile = {
      displayName: name,
      pictureUrl: profileImage,
      lineUserId: lineUserId,
    };

    // Call the RPC function to find or create user with identity
    const { data, error } = await (supabase.rpc as Function)('find_or_create_user_by_identity', {
      p_auth_id: user.id,
      p_provider: provider.toUpperCase(),
      p_provider_user_id: lineUserId || user.id,
      p_profile: profile,
      p_email: user.email?.includes('.local') ? null : user.email,
      p_phone: null,
      p_name: name,
    }) as { data: FindOrCreateUserResult[] | null; error: Error | null };

    if (error) {
      console.error("Failed to sync user via RPC:", error);
      throw error;
    }

    // Log the result
    if (data && data.length > 0) {
      const result = data[0];
      console.log(`User sync result: user_id=${result.user_id}, is_new_user=${result.is_new_user}, is_new_identity=${result.is_new_identity}`);
    }
  } catch (error) {
    // Log but don't fail - user is already authenticated
    console.error("Failed to sync user to database:", error);
  }
}
