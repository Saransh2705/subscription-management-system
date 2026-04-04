import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  let next = url.searchParams.get("next") || "/";

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.exchangeCodeForSession(code);

    // Check if user must change password
    if (data?.user) {
      const { data: staffUser } = await supabaseAdmin
        .from("staff_users")
        .select("must_change_password")
        .eq("id", data.user.id)
        .maybeSingle();

      if (staffUser?.must_change_password) {
        next = "/reset-password";
      }
    }
  }

  return NextResponse.redirect(new URL(next, request.url));
}
