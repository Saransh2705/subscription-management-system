"use server";

import { redirect } from "next/navigation";
import { requireStaffProfile } from "@/lib/auth-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function updatePasswordAction() {
    const context = await requireStaffProfile();

    if (!context.ok) {
        return { error: context.message };
    }

    const { error } = await supabaseAdmin
        .from("staff_users")
        .update({ must_change_password: false })
        .eq("id", context.user.id);

    if (error) {
        return { error: error.message };
    }

    redirect("/");
}
