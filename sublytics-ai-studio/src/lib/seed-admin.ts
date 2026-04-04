import { supabaseAdmin } from "@/lib/supabase-admin";

async function findUserByEmail(email: string) {
  const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });

  if (error) {
    throw error;
  }

  return data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase()) ?? null;
}

export async function seedAdminIfNeeded() {
  const seedEmail = process.env.SEED_ADMIN_EMAIL;
  const seedPassword = process.env.SEED_ADMIN_PASSWORD;

  if (!seedEmail || !seedPassword) {
    return;
  }

  const { data: existingAdmin } = await supabaseAdmin
    .from("staff_users")
    .select("id")
    .eq("role", "ADMIN")
    .limit(1)
    .maybeSingle();

  if (existingAdmin) {
    return;
  }

  let user = await findUserByEmail(seedEmail);

  if (!user) {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: seedEmail,
      password: seedPassword,
      email_confirm: true,
    });

    if (error || !data.user) {
      throw error ?? new Error("Unable to create seed admin user");
    }

    user = data.user;
  }

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
    throw upsertError;
  }
}
