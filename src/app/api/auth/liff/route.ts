/**
 * LIFF Authentication Route Handler
 *
 * Verifies LINE ID Token from LIFF SDK and creates real Supabase session
 * using password-based authentication for full Supabase feature support.
 */

import { createClient, SupabaseClient, User, Session } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  generateLinePassword,
  generateLineEmail,
} from "@/lib/auth/password-hash";
import type {
  Database,
  InsertTables,
  UpdateTables,
} from "@/lib/supabase/types";

// LINE API endpoints
const LINE_VERIFY_URL = "https://api.line.me/oauth2/v2.1/verify";

// Initialize Supabase Admin client (requires Service Role Key)
function getSupabaseAdmin(): SupabaseClient<Database> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Initialize Supabase client for signInWithPassword
function getSupabaseClient(): SupabaseClient<Database> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createClient<Database>(supabaseUrl, anonKey, {
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

    // Find or create user in Supabase and get real session
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
 * Find or create user in Supabase Auth and create real session
 */
async function findOrCreateUser(
  supabaseAdmin: SupabaseClient<Database>,
  tokenData: LineTokenVerifyResponse
): Promise<{ user: User; session: Session }> {
  const lineUserId = tokenData.sub;
  const email = tokenData.email || generateLineEmail(lineUserId);
  const password = generateLinePassword(lineUserId);

  const userMetadata = {
    line_user_id: lineUserId,
    full_name: tokenData.name,
    avatar_url: tokenData.picture,
    provider: "line",
  };

  // Try to create user first
  const { data: newUser, error: createError } =
    await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: userMetadata,
    });

  let user = newUser?.user;

  // If user already exists (email taken), update their password and metadata
  if (createError && createError.message?.includes("already")) {
    // Find existing user by listing and filtering
    const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = usersData?.users?.find((u) => u.email === email);

    if (existingUser) {
      // Update existing user with new password and metadata
      const { data: updatedUser, error: updateError } =
        await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
          password, // Ensure password is always current
          user_metadata: {
            ...existingUser.user_metadata,
            ...userMetadata,
          },
        });

      if (updateError) {
        console.error("Failed to update user:", updateError);
      }
      user = updatedUser?.user ?? existingUser;
    } else {
      throw createError;
    }
  } else if (createError) {
    console.error("Failed to create user:", createError);
    throw createError;
  }

  if (!user) {
    throw new Error("Failed to find or create user");
  }

  // Sync to users table
  await syncToUsersTable(supabaseAdmin, user, tokenData);

  // Create real session using signInWithPassword
  const supabaseClient = getSupabaseClient();
  const { data: sessionData, error: sessionError } =
    await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

  if (sessionError || !sessionData.session) {
    console.error("Failed to create session:", sessionError);
    throw sessionError || new Error("Failed to create session");
  }

  return { user, session: sessionData.session };
}

/**
 * Sync user data to users table
 */
async function syncToUsersTable(
  supabaseAdmin: SupabaseClient<Database>,
  user: User,
  tokenData: LineTokenVerifyResponse
): Promise<void> {
  try {
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("id", user.id)
      .single();

    if (existingUser) {
      const updateData: UpdateTables<"users"> = {
        email: user.email,
        name: tokenData.name || "LINE User",
        profile_image: tokenData.picture,
        provider_user_id: tokenData.sub,
        updated_at: new Date().toISOString(),
      };
      await supabaseAdmin.from("users")
        .update(updateData)
        .eq("id", user.id);
    } else {
      const insertData: InsertTables<"users"> = {
        id: user.id,
        email: user.email || "",
        name: tokenData.name || "LINE User",
        profile_image: tokenData.picture,
        provider_user_id: tokenData.sub,
        user_type: "CUSTOMER",
        role: "CUSTOMER",
        is_active: true,
        is_approved: true,
      };
      await supabaseAdmin.from("users").insert(insertData);
    }
  } catch (error) {
    console.error("Failed to sync user to database:", error);
    // Don't fail the auth - user is already created in Supabase Auth
  }
}
