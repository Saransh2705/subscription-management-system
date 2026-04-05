import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { syncCustomerForUser } from "@/lib/customer-sync";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  let next = url.searchParams.get("next") || "/";

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.exchangeCodeForSession(code);

    // Check if user must change password and sync customer
    if (data?.user) {
      const { data: staffUser } = await supabaseAdmin
        .from("staff_users")
        .select("must_change_password, email, customer_id, customer_synced_at")
        .eq("id", data.user.id)
        .maybeSingle();

      if (staffUser?.must_change_password) {
        next = "/reset-password";
      }

      // Sync customer if not already synced
      if (staffUser && !staffUser.customer_id) {
        console.log('🔄 [Auth Callback] Syncing customer for user:', staffUser.email);
        
        // Don't await - run in background to avoid blocking login
        syncCustomerForUser(
          data.user.id,
          staffUser.email || data.user.email || '',
          data.user.user_metadata?.name
        ).catch((error) => {
          console.error('❌ [Auth Callback] Customer sync failed:', error);
        });
      }
    }
  }

  return NextResponse.redirect(new URL(next, request.url));
}
