import { NextResponse } from "next/server";
import { requireStaffProfile } from "@/lib/auth-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import type { AppRole } from "@/lib/roles";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await requireStaffProfile(["ADMIN", "MANAGER"]);

  if (!context.ok) {
    return NextResponse.json({ error: context.message }, { status: context.status });
  }

  const { id } = await params;
  const updates = (await request.json()) as Partial<{ role: AppRole; is_active: boolean }>;

  const payload: Partial<{ role: AppRole; is_active: boolean }> = {};

  if (updates.role) {
    payload.role = updates.role;
  }

  if (typeof updates.is_active === "boolean") {
    payload.is_active = updates.is_active;
  }

  const { error } = await supabaseAdmin.from("staff_users").update(payload).eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
