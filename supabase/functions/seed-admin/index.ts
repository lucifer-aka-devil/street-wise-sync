// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables");
}

const ADMIN_EMAIL = "admin@civic.gov";
const ADMIN_PASSWORD = "admin123";
const ADMIN_NAME = "Administrator";

const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function ensureAdminUser() {
  // If an admin already exists, do nothing (idempotent)
  const { data: existingAdmins, error: adminsError } = await adminClient
    .from('profiles')
    .select('user_id')
    .eq('role', 'admin')
    .limit(1);

  if (!adminsError && existingAdmins && existingAdmins.length > 0) {
    return { ok: true, already: true };
  }

  // Try to create the admin user
  let adminUserId: string | null = null;
  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: ADMIN_NAME },
  });

  if (created?.user?.id) {
    adminUserId = created.user.id;
  }

  if (createError) {
    // If user already exists, find the user by listing users and filtering by email
    // Note: This is acceptable for small projects; adjust pagination if you have many users
    const { data: usersList, error: listError } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 } as any);
    if (listError) throw listError;
    const found = usersList?.users?.find((u: any) => u.email?.toLowerCase() === ADMIN_EMAIL);
    if (!found) throw createError;
    adminUserId = found.id;
  }

  if (!adminUserId) {
    throw new Error('Failed to resolve admin user id');
  }

  // Ensure profile exists and promote to admin
  const { error: upsertError } = await adminClient.from('profiles').upsert({
    user_id: adminUserId,
    full_name: ADMIN_NAME,
    email: ADMIN_EMAIL,
    role: 'admin',
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });

  if (upsertError) throw upsertError;

  return { ok: true, created: true };
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const result = await ensureAdminUser();
    return new Response(JSON.stringify(result), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || 'Unknown error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});
