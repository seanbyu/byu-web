/**
 * LINE OAuth Callback Handler
 *
 * Handles the callback from LINE OAuth, exchanges code for tokens,
 * and creates a Supabase session using password-based auth.
 * Uses find_or_create_user_by_identity RPC to sync user data to
 * public.users and user_identities tables (multi-social login support).
 */

import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { generateLinePassword, generateLineEmail } from "@/lib/auth/password-hash";
import type { Database } from "@/lib/supabase/types";

const LINE_TOKEN_URL = "https://api.line.me/oauth2/v2.1/token";
const LINE_PROFILE_URL = "https://api.line.me/v2/profile";

function getSupabaseAdmin() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  const origin = request.nextUrl.origin;
  const stateParam = searchParams.get("state");

  // Parse returnUrl from state parameter
  let returnUrl = "/";
  if (stateParam) {
    try {
      const decoded = JSON.parse(Buffer.from(stateParam, "base64").toString());
      if (decoded.returnUrl && typeof decoded.returnUrl === "string" && decoded.returnUrl.startsWith("/")) {
        returnUrl = decoded.returnUrl;
      }
    } catch {
      // state parsing failed, default to "/"
    }
  }

  // Handle OAuth errors
  if (error) {
    console.error("LINE OAuth error:", error, errorDescription);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(errorDescription || error)}`
    );
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=No authorization code`);
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch(LINE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: `${origin}/api/auth/line/callback`,
        client_id: process.env.LINE_CHANNEL_ID!,
        client_secret: process.env.LINE_CHANNEL_SECRET!,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error("Token exchange failed:", errorData);
      return NextResponse.redirect(`${origin}/login?error=Token exchange failed`);
    }

    const tokenData = await tokenResponse.json();
    const { access_token } = tokenData;

    // Get user profile from LINE
    const profileResponse = await fetch(LINE_PROFILE_URL, {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!profileResponse.ok) {
      return NextResponse.redirect(`${origin}/login?error=Failed to get profile`);
    }

    const profile = await profileResponse.json();
    const lineUserId = profile.userId;
    const displayName = profile.displayName;
    const pictureUrl = profile.pictureUrl;
    const statusMessage = profile.statusMessage;

    // Create Supabase session
    const email = generateLineEmail(lineUserId);
    const password = generateLinePassword(lineUserId);
    const supabaseAdmin = getSupabaseAdmin();

    console.log("[LINE Auth] Processing login for:", { email, lineUserId, displayName });

    // Strategy: Try to sign in first, if fails then create user
    const supabaseClient = await createSupabaseServerClient();

    // Step 1: Try to sign in (user might already exist)
    console.log("[LINE Auth] Attempting sign in...");
    const { data: signInData, error: signInError } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (signInData?.session) {
      // User exists and signed in successfully
      console.log("[LINE Auth] Sign in successful, user exists:", signInData.user.id);

      // Update auth user metadata
      await supabaseAdmin.auth.admin.updateUserById(signInData.user.id, {
        user_metadata: {
          line_user_id: lineUserId,
          full_name: displayName,
          avatar_url: pictureUrl,
          provider: "line",
        },
      });

      // Sync to public tables
      await syncToPublicTables(supabaseAdmin, signInData.user.id, {
        email,
        lineUserId,
        displayName,
        pictureUrl,
        statusMessage,
      });

      console.log("[LINE Auth] Login complete, redirecting to home");
      return NextResponse.redirect(`${origin}${returnUrl}`);
    }

    // Step 2: Sign in failed - create new user
    console.log("[LINE Auth] Sign in failed:", signInError?.message);
    console.log("[LINE Auth] Creating new user...");

    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        line_user_id: lineUserId,
        full_name: displayName,
        avatar_url: pictureUrl,
        provider: "line",
      },
    });

    if (createError) {
      console.error("[LINE Auth] Create user error:", createError.message);

      // User might exist with different password - update and retry
      console.log("[LINE Auth] Trying to find and update existing user...");

      const { data: usersData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      const existingUser = usersData?.users?.find((u) => u.email === email);

      if (existingUser) {
        console.log("[LINE Auth] Found existing user, updating password...");

        // Update password
        await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
          password,
          user_metadata: {
            line_user_id: lineUserId,
            full_name: displayName,
            avatar_url: pictureUrl,
            provider: "line",
          },
        });

        // Try sign in again
        const { data: retrySignIn, error: retryError } = await supabaseClient.auth.signInWithPassword({
          email,
          password,
        });

        if (retrySignIn?.session) {
          console.log("[LINE Auth] Retry sign in successful");

          await syncToPublicTables(supabaseAdmin, existingUser.id, {
            email,
            lineUserId,
            displayName,
            pictureUrl,
            statusMessage,
          });

          return NextResponse.redirect(`${origin}${returnUrl}`);
        }

        console.error("[LINE Auth] Retry sign in failed:", retryError?.message);
      }

      return NextResponse.redirect(`${origin}/login?error=Failed to create user`);
    }

    if (!newUser?.user) {
      console.error("[LINE Auth] No user returned from createUser");
      return NextResponse.redirect(`${origin}/login?error=Failed to create user`);
    }

    console.log("[LINE Auth] Created new auth user:", newUser.user.id);

    // Sync to public tables
    await syncToPublicTables(supabaseAdmin, newUser.user.id, {
      email,
      lineUserId,
      displayName,
      pictureUrl,
      statusMessage,
    });

    // Sign in the new user
    console.log("[LINE Auth] Signing in new user...");
    const { data: newSignIn, error: newSignInError } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (newSignInError || !newSignIn?.session) {
      console.error("[LINE Auth] Failed to sign in new user:", newSignInError?.message);
      return NextResponse.redirect(`${origin}/login?error=Session creation failed`);
    }

    console.log("[LINE Auth] Login complete, redirecting to home");
    return NextResponse.redirect(`${origin}${returnUrl}`);

  } catch (error) {
    console.error("LINE OAuth callback error:", error);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(
        error instanceof Error ? error.message : "Authentication failed"
      )}`
    );
  }
}

// Type for the find_or_create_user_by_identity RPC response
interface FindOrCreateUserResult {
  user_id: string;
  is_new_user: boolean;
  is_new_identity: boolean;
}

// Helper function to sync user data via find_or_create_user_by_identity RPC
async function syncToPublicTables(
  supabaseAdmin: ReturnType<typeof getSupabaseAdmin>,
  userId: string,
  data: {
    email: string;
    lineUserId: string;
    displayName: string;
    pictureUrl?: string;
    statusMessage?: string;
  }
) {
  const { email, lineUserId, displayName, pictureUrl, statusMessage } = data;

  console.log("[LINE Auth] Syncing via find_or_create_user_by_identity RPC...");

  // Build LINE profile JSONB
  const lineProfile = {
    displayName: displayName,
    pictureUrl: pictureUrl,
    statusMessage: statusMessage,
    lineUserId: lineUserId,
  };

  try {
    // Call the RPC function to find or create user with identity
    // Using type assertion since the RPC function types may not be regenerated
    const { data: rpcData, error } = await (supabaseAdmin.rpc as Function)('find_or_create_user_by_identity', {
      p_auth_id: userId,
      p_provider: 'LINE',
      p_provider_user_id: lineUserId,
      p_profile: lineProfile,
      p_email: email.includes('@line.local') ? null : email,  // Don't pass fake email
      p_phone: null,  // LINE doesn't provide phone
      p_name: displayName || 'LINE User',
    }) as { data: FindOrCreateUserResult[] | null; error: Error | null };

    if (error) {
      console.error("[LINE Auth] RPC error:", error);
      throw error;
    }

    // Log the result
    if (rpcData && rpcData.length > 0) {
      const result = rpcData[0];
      console.log(`[LINE Auth] Sync result: user_id=${result.user_id}, is_new_user=${result.is_new_user}, is_new_identity=${result.is_new_identity}`);
    }
  } catch (error) {
    console.error("[LINE Auth] Failed to sync user:", error);
    // Don't fail the auth - user is already created in Supabase Auth
  }
}
