/**
 * LINE OAuth Callback Handler
 *
 * Handles the callback from LINE OAuth, exchanges code for tokens,
 * and creates a Supabase session using password-based auth.
 * Also syncs user data to public.users and customer_profiles tables.
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
      return NextResponse.redirect(`${origin}/`);
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

          return NextResponse.redirect(`${origin}/`);
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
    return NextResponse.redirect(`${origin}/`);

  } catch (error) {
    console.error("LINE OAuth callback error:", error);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(
        error instanceof Error ? error.message : "Authentication failed"
      )}`
    );
  }
}

// Helper function to sync user data to public tables
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

  // Sync to public.users table
  console.log("[LINE Auth] Syncing to public.users...");

  const { data: existingUser, error: selectError } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (selectError) {
    console.error("[LINE Auth] Error checking public.users:", selectError.message);
  }

  if (!existingUser) {
    const { error: insertError } = await supabaseAdmin
      .from("users")
      .insert({
        id: userId,
        user_type: "CUSTOMER",
        role: "CUSTOMER",
        email: email,
        name: displayName,
        profile_image: pictureUrl || null,
        auth_provider: "LINE",
        provider_user_id: lineUserId,
        is_active: true,
        is_approved: true,
      });

    if (insertError) {
      console.error("[LINE Auth] Insert public.users error:", insertError.message);
    } else {
      console.log("[LINE Auth] Created public.users entry");
    }
  } else {
    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({
        name: displayName,
        profile_image: pictureUrl || null,
        auth_provider: "LINE",
        provider_user_id: lineUserId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (updateError) {
      console.error("[LINE Auth] Update public.users error:", updateError.message);
    } else {
      console.log("[LINE Auth] Updated public.users entry");
    }
  }

  // Sync to customer_profiles table
  console.log("[LINE Auth] Syncing to customer_profiles...");

  const { data: existingProfile, error: profileSelectError } = await supabaseAdmin
    .from("customer_profiles")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (profileSelectError) {
    console.error("[LINE Auth] Error checking customer_profiles:", profileSelectError.message);
  }

  if (!existingProfile) {
    const { error: insertProfileError } = await supabaseAdmin
      .from("customer_profiles")
      .insert({
        user_id: userId,
        user_type: "CUSTOMER",
        line_user_id: lineUserId,
        line_display_name: displayName,
        line_picture_url: pictureUrl || null,
        line_status_message: statusMessage || null,
      });

    if (insertProfileError) {
      console.error("[LINE Auth] Insert customer_profiles error:", insertProfileError.message);
    } else {
      console.log("[LINE Auth] Created customer_profiles entry");
    }
  } else {
    const { error: updateProfileError } = await supabaseAdmin
      .from("customer_profiles")
      .update({
        line_user_id: lineUserId,
        line_display_name: displayName,
        line_picture_url: pictureUrl || null,
        line_status_message: statusMessage || null,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (updateProfileError) {
      console.error("[LINE Auth] Update customer_profiles error:", updateProfileError.message);
    } else {
      console.log("[LINE Auth] Updated customer_profiles entry");
    }
  }
}
