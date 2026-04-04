import { NextResponse } from "next/server";
import { requireStaffProfile } from "@/lib/auth-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendMagicLinkEmail } from "@/lib/magic-link-email";
import type { AppRole } from "@/lib/roles";

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

async function findAuthUserByEmail(email: string) {
  const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });

  if (error) {
    throw error;
  }

  return data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase()) || null;
}

export async function GET() {
  const context = await requireStaffProfile(["ADMIN", "MANAGER"]);

  if (!context.ok) {
    return NextResponse.json({ error: context.message }, { status: context.status });
  }

  const { data, error } = await supabaseAdmin
    .from("staff_users")
    .select("id, email, role, is_active, must_change_password, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ users: data });
}

export async function POST(request: Request) {
  const context = await requireStaffProfile(["ADMIN", "MANAGER"]);

  if (!context.ok) {
    return NextResponse.json({ error: context.message }, { status: context.status });
  }

  const { email, role } = (await request.json()) as { email: string; role: AppRole };

  if (!email || !role) {
    return NextResponse.json({ error: "Email and role are required" }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase();
  let authUser = await findAuthUserByEmail(normalizedEmail);

  if (!authUser) {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      email_confirm: true,
    });

    if (error || !data.user) {
      return NextResponse.json({ error: error?.message || "Unable to create auth user" }, { status: 400 });
    }

    authUser = data.user;
  }

  const { error: upsertError } = await supabaseAdmin.from("staff_users").upsert(
    {
      id: authUser.id,
      email: normalizedEmail,
      role,
      is_active: true,
      must_change_password: true,
      invited_by: context.user.id,
    },
    { onConflict: "id" },
  );

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 400 });
  }

  const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: "magiclink",
    email: normalizedEmail,
    options: {
      redirectTo: `${getAppUrl()}/auth/callback?next=/`,
    },
  });

  if (linkError || !linkData?.properties?.action_link) {
    return NextResponse.json({ error: linkError?.message || "Failed to generate invite link" }, { status: 400 });
  }

  await sendMagicLinkEmail({
    to: normalizedEmail,
    subject: "You are invited to Sublytics",
    magicLink: linkData.properties.action_link,
  });

  return NextResponse.json({ ok: true });
}
