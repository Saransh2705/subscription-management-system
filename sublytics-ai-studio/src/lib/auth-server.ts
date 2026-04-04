import { createSupabaseServerClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import type { AppRole, StaffUser } from "@/lib/roles";

export async function getSessionUser() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return null;
  }

  return data.user;
}

export async function getStaffProfileByUserId(userId: string): Promise<StaffUser | null> {
  const { data, error } = await supabaseAdmin
    .from("staff_users")
    .select("id, email, role, is_active, must_change_password, created_at, updated_at")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as StaffUser;
}

export async function requireStaffProfile(allowedRoles?: AppRole[]) {
  const user = await getSessionUser();

  if (!user) {
    return { ok: false as const, status: 401, message: "Unauthorized" };
  }

  const profile = await getStaffProfileByUserId(user.id);

  if (!profile || !profile.is_active) {
    return { ok: false as const, status: 403, message: "Inactive or missing staff profile" };
  }

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    return { ok: false as const, status: 403, message: "Insufficient role" };
  }

  return { ok: true as const, user, profile };
}
