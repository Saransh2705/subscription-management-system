"use server";

import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendMagicLinkEmail } from "@/lib/magic-link-email";
import { createSupabaseServerClient } from "@/lib/supabase-server";

function getAppUrl() {
    return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

async function findUserByEmail(email: string) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (error) {
        return null;
    }
    return data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase()) ?? null;
}

export async function loginAction(formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email) {
        return { error: "Email is required" };
    }

    const normalizedEmail = String(email).toLowerCase();
    const seedEmail = process.env.SEED_ADMIN_EMAIL?.toLowerCase();
    const seedPassword = process.env.SEED_ADMIN_PASSWORD;

    // Handle seed user login with password
    if (password && seedEmail && seedPassword && normalizedEmail === seedEmail && password === seedPassword) {
        let user = await findUserByEmail(normalizedEmail);

        // Auto-create seed user if doesn't exist
        if (!user) {
            const { data, error } = await supabaseAdmin.auth.admin.createUser({
                email: seedEmail,
                password: seedPassword,
                email_confirm: true,
            });

            if (error || !data.user) {
                return { error: error?.message || "Failed to create user" };
            }

            user = data.user;

            // Create staff profile
            const { error: upsertError } = await supabaseAdmin.from("staff_users").upsert(
                {
                    id: user.id,
                    email: seedEmail,
                    role: "ADMIN",
                    is_active: true,
                    must_change_password: true,
                },
                { onConflict: "id" },
            );

            if (upsertError) {
                return { error: upsertError.message };
            }
        }

        // Sign in the user
        const supabase = await createSupabaseServerClient();
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: seedEmail,
            password: seedPassword,
        });

        if (signInError) {
            return { error: signInError.message };
        }

        redirect("/reset-password");
    }

    // Handle regular magic link flow
    const { data: staff } = await supabaseAdmin
        .from("staff_users")
        .select("email, is_active")
        .eq("email", normalizedEmail)
        .maybeSingle();

    if (!staff || !staff.is_active) {
        return { error: "Account is not authorized" };
    }

    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email: normalizedEmail,
        options: {
            redirectTo: `${getAppUrl()}/auth/callback?next=/`,
        },
    });

    if (error || !data?.properties?.action_link) {
        return { error: error?.message || "Failed to generate magic link" };
    }

    await sendMagicLinkEmail({
        to: normalizedEmail,
        subject: "Your Login Magic Link",
        magicLink: data.properties.action_link,
    });

    return { ok: true, magicLinkSent: true };
}
