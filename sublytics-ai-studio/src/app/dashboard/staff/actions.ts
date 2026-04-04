"use server";

import { redirect } from "next/navigation";
import { requireStaffProfile } from "@/lib/auth-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendStaffInviteEmail } from "@/lib/staff-invite-email";

function generateRandomPassword(length = 12) {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
}

export async function addStaffAction(formData: FormData) {
    const context = await requireStaffProfile(["ADMIN", "MANAGER"]);

    if (!context.ok) {
        return { error: context.message };
    }

    const email = (formData.get("email") as string)?.toLowerCase();
    const role = (formData.get("role") as string) || "VIEWER";

    if (!email) {
        return { error: "Email is required" };
    }

    // Check if user already exists
    const { data: existingStaff } = await supabaseAdmin
        .from("staff_users")
        .select("email")
        .eq("email", email)
        .maybeSingle();

    if (existingStaff) {
        return { error: "Staff member already exists" };
    }

    // Generate random password
    const password = generateRandomPassword();

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
    });

    if (authError || !authData.user) {
        return { error: authError?.message || "Failed to create user" };
    }

    // Create staff profile
    const { error: staffError } = await supabaseAdmin.from("staff_users").insert({
        id: authData.user.id,
        email,
        role,
        is_active: true,
        must_change_password: true,
        invited_by: context.user.id,
    });

    if (staffError) {
        // Rollback: delete auth user if staff creation fails
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        return { error: staffError.message };
    }

        // Send invitation email asynchronously so the UI doesn't block.
        const emailPromise = sendStaffInviteEmail({
                to: email,
                password,
                invitedBy: context.profile.email,
        });

        // Fire-and-forget: update invite metadata when the send completes or fails.
        emailPromise
            .then(async (emailResult: any) => {
                // eslint-disable-next-line no-console
                console.log("Staff invite result for", email, emailResult);
                try {
                    await supabaseAdmin.from("staff_users").update({
                        invite_sent: emailResult?.ok ?? false,
                        invite_error: emailResult?.error ?? null,
                        invite_id: (emailResult as any)?.id ?? null,
                    }).eq("id", authData.user.id);
                } catch (e) {
                    // eslint-disable-next-line no-console
                    console.warn("Failed to persist invite metadata for", email, e);
                }
            })
            .catch((err: any) => {
                // eslint-disable-next-line no-console
                console.error("Staff invite async send failed for", email, err);
                try {
                    supabaseAdmin.from("staff_users").update({
                        invite_sent: false,
                        invite_error: err?.message ?? String(err),
                    }).eq("id", authData.user.id);
                } catch (e) {
                    // eslint-disable-next-line no-console
                    console.warn("Failed to persist invite error for", email, e);
                }
            });

        return {
                success: true,
                message: "Staff member added successfully",
                inviteQueued: true,
        };
}

export async function getStaffListAction() {
    const context = await requireStaffProfile(["ADMIN", "MANAGER"]);

    if (!context.ok) {
        return { error: context.message, staff: [] };
    }

    const { data: staff, error } = await supabaseAdmin
        .from("staff_users")
        .select("id, email, role, is_active, created_at")
        .order("created_at", { ascending: false });

    if (error) {
        return { error: error.message, staff: [] };
    }

    return { staff: staff || [] };
}
