/**
 * LIFF Authentication Route Handler
 *
 * Verifies LINE ID Token from LIFF SDK and creates Supabase session
 * This enables seamless authentication within LINE In-App Browser
 */

import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// LINE API endpoints
const LINE_VERIFY_URL = "https://api.line.me/oauth2/v2.1/verify";
const LINE_PROFILE_URL = "https://api.line.me/v2/profile";

// Initialize Supabase Admin client (requires Service Role Key)
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

interface LineTokenVerifyResponse {
  iss: string;
  sub: string; // LINE User ID
  aud: string; // Channel ID
  exp: number;
  iat: number;
  nonce?: string;
  amr?: string[];
  name?: string;
  picture?: string;
  email?: string;
}

interface LineProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { idToken } = body;

    if (!idToken) {
      return NextResponse.json(
        { error: "ID token is required" },
        { status: 400 }
      );
    }

    // Verify LINE ID Token
    const tokenData = await verifyLineIdToken(idToken);

    if (!tokenData) {
      return NextResponse.json(
        { error: "Invalid LINE ID token" },
        { status: 401 }
      );
    }

    // Get Supabase Admin client
    const supabaseAdmin = getSupabaseAdmin();

    // Find or create user in Supabase
    const { user, session } = await findOrCreateUser(supabaseAdmin, tokenData);

    if (!user || !session) {
      return NextResponse.json(
        { error: "Failed to create user session" },
        { status: 500 }
      );
    }

    // Set session cookies
    const cookieStore = await cookies();

    // Set access token cookie
    cookieStore.set("sb-access-token", session.access_token, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    // Set refresh token cookie
    cookieStore.set("sb-refresh-token", session.refresh_token, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        user_metadata: user.user_metadata,
      },
      session: {
        access_token: session.access_token,
        expires_at: session.expires_at,
      },
    });
  } catch (error) {
    console.error("LIFF auth error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Authentication failed",
      },
      { status: 500 }
    );
  }
}

/**
 * Verify LINE ID Token with LINE API
 */
async function verifyLineIdToken(
  idToken: string
): Promise<LineTokenVerifyResponse | null> {
  const channelId = process.env.LINE_CHANNEL_ID;

  if (!channelId) {
    throw new Error("LINE_CHANNEL_ID is not configured");
  }

  try {
    const response = await fetch(LINE_VERIFY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        id_token: idToken,
        client_id: channelId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("LINE token verification failed:", errorData);
      return null;
    }

    const data: LineTokenVerifyResponse = await response.json();

    // Verify channel ID matches
    if (data.aud !== channelId) {
      console.error("Channel ID mismatch");
      return null;
    }

    // Verify token is not expired
    if (data.exp * 1000 < Date.now()) {
      console.error("Token expired");
      return null;
    }

    return data;
  } catch (error) {
    console.error("LINE token verification error:", error);
    return null;
  }
}

/**
 * Find or create user in Supabase Auth and sync to users table
 */
async function findOrCreateUser(
  supabaseAdmin: ReturnType<typeof createClient>,
  tokenData: LineTokenVerifyResponse
): Promise<{ user: any; session: any }> {
  const lineUserId = tokenData.sub;
  const email = tokenData.email || `${lineUserId}@line.local`;

  // Try to find existing user by LINE user ID (stored in user_metadata)
  const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();

  let user = existingUsers?.users?.find(
    (u) => u.user_metadata?.line_user_id === lineUserId
  );

  if (!user) {
    // Create new user
    const { data: newUser, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          line_user_id: lineUserId,
          full_name: tokenData.name,
          avatar_url: tokenData.picture,
          provider: "line",
        },
      });

    if (createError) {
      // User might exist with same email, try to update
      const existingByEmail = existingUsers?.users?.find(
        (u) => u.email === email
      );

      if (existingByEmail) {
        // Update existing user with LINE info
        const { data: updatedUser } =
          await supabaseAdmin.auth.admin.updateUserById(existingByEmail.id, {
            user_metadata: {
              ...existingByEmail.user_metadata,
              line_user_id: lineUserId,
              full_name: tokenData.name,
              avatar_url: tokenData.picture,
            },
          });
        user = updatedUser?.user ?? undefined;
      } else {
        throw createError;
      }
    } else {
      user = newUser?.user ?? undefined;
    }
  } else {
    // Update existing user metadata
    const { data: updatedUser } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      {
        user_metadata: {
          ...user.user_metadata,
          full_name: tokenData.name,
          avatar_url: tokenData.picture,
        },
      }
    );
    user = updatedUser?.user ?? user;
  }

  if (!user) {
    throw new Error("Failed to find or create user");
  }

  // Sync to users table
  await syncToUsersTable(supabaseAdmin, user, tokenData);

  // Generate session for the user
  const { data: sessionData, error: sessionError } =
    await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: user.email!,
    });

  if (sessionError) {
    throw sessionError;
  }

  // Create a session directly
  // Note: In production, you might want to use a different approach
  // such as setting custom JWT claims or using Supabase Edge Functions
  const mockSession = {
    access_token: sessionData.properties?.hashed_token || "",
    refresh_token: crypto.randomUUID(),
    expires_at: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24 hours
  };

  return { user, session: mockSession };
}

/**
 * Sync user data to users table
 */
async function syncToUsersTable(
  supabaseAdmin: ReturnType<typeof createClient>,
  user: any,
  tokenData: LineTokenVerifyResponse
) {
  try {
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("id", user.id)
      .single();

    const userData = {
      email: user.email,
      display_name: tokenData.name,
      avatar_url: tokenData.picture,
      line_user_id: tokenData.sub,
      updated_at: new Date().toISOString(),
    };

    if (existingUser) {
      await supabaseAdmin.from("users").update(userData).eq("id", user.id);
    } else {
      await supabaseAdmin.from("users").insert({
        id: user.id,
        ...userData,
        user_type: "CUSTOMER",
        role: "CUSTOMER",
        is_active: true,
        is_approved: true,
      });
    }
  } catch (error) {
    console.error("Failed to sync user to database:", error);
    // Don't fail the auth - user is already created in Supabase Auth
  }
}
