/**
 * Auth Callback Route Handler
 *
 * Handles OAuth callback from LINE (via Supabase)
 * Exchanges auth code for session using PKCE flow
 */

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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
 * Sync authenticated user to database
 * Creates or updates user record in the users table
 */
async function syncUserToDatabase(
  supabase: Awaited<ReturnType<typeof createClient>>,
  user: { id: string; email?: string; user_metadata?: Record<string, unknown> }
) {
  try {
    const metadata = user.user_metadata || {};

    // Extract LINE profile data from user metadata
    const lineUserId = metadata.provider_id as string | undefined;
    const displayName = metadata.full_name as string | undefined;
    const avatarUrl = metadata.avatar_url as string | undefined;

    // Check if user exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("id", user.id)
      .single();

    if (existingUser) {
      // Update existing user
      await supabase
        .from("users")
        .update({
          email: user.email,
          display_name: displayName,
          avatar_url: avatarUrl,
          line_user_id: lineUserId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);
    } else {
      // Create new user
      await supabase.from("users").insert({
        id: user.id,
        email: user.email,
        display_name: displayName,
        avatar_url: avatarUrl,
        line_user_id: lineUserId,
        user_type: "CUSTOMER",
        role: "CUSTOMER",
        is_active: true,
        is_approved: true,
      });
    }
  } catch (error) {
    // Log but don't fail - user is already authenticated
    console.error("Failed to sync user to database:", error);
  }
}
