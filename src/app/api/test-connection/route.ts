import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // Test connection by fetching table info
    const { data: salons, error: salonsError } = await supabase
      .from("salons")
      .select("*")
      .limit(5);

    const { data: menus, error: menusError } = await supabase
      .from("services")
      .select("*")
      .limit(5);

    // Test all users (to debug)
    const { data: allUsers, error: allUsersError } = await supabase
      .from("users")
      .select("id, name, email, user_type, role, salon_id, is_active")
      .limit(10);

    // Test staff (users with staff_profiles)
    const { data: staff, error: staffError } = await supabase
      .from("users")
      .select(`
        id, name, salon_id, is_active,
        staff_profiles (is_booking_enabled)
      `)
      .eq("user_type", "SALON")
      .limit(10);

    // Test bookable staff only (is_booking_enabled = true)
    const { data: bookableStaff, error: bookableError } = await supabase
      .from("users")
      .select(`
        id, name,
        staff_profiles!inner (is_booking_enabled)
      `)
      .eq("user_type", "SALON")
      .eq("is_active", true)
      .eq("staff_profiles.is_booking_enabled", true)
      .limit(10);

    return NextResponse.json({
      success: true,
      message: "Supabase connection successful",
      data: {
        salons: salonsError ? { error: salonsError.message } : salons,
        menus: menusError ? { error: menusError.message } : menus,
        allUsers: allUsersError ? { error: allUsersError.message } : allUsers,
        staff: staffError ? { error: staffError.message } : staff,
        bookableStaff: bookableError ? { error: bookableError.message } : bookableStaff,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Supabase connection failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
