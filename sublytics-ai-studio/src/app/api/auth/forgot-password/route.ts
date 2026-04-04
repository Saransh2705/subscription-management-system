import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendMagicLinkEmail } from "@/lib/magic-link-email";

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export async function POST(request: Request) {
  const { email } = await request.json();

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const normalizedEmail = String(email).toLowerCase();

  const { data: staff } = await supabaseAdmin
    .from("staff_users")
    .select("email, is_active")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (!staff || !staff.is_active) {
    return NextResponse.json({ error: "Account is not authorized" }, { status: 403 });
  }

  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: "recovery",
    email: normalizedEmail,
    options: {
      redirectTo: `${getAppUrl()}/auth/callback?next=/reset-password`,
    },
  });

  if (error || !data?.properties?.action_link) {
    return NextResponse.json({ error: error?.message || "Failed to generate recovery link" }, { status: 400 });
  }

  await sendMagicLinkEmail({
    to: normalizedEmail,
    subject: "Reset Your Password",
    magicLink: data.properties.action_link,
  });

  return NextResponse.json({ ok: true });
}
