// One-time bootstrap: creates the very first company + admin account.
// Everyone after this gets invited from inside the app (Crew > Invite),
// which is why this script exists at all — accept-invite needs an existing
// admin to send the invite, and the first user has no one to invite them.
//
// Usage (Node 24+, no install needed):
//   node --env-file=.env.local scripts/create-first-admin.mjs \
//     "Boss & Friends Construction" admin@example.com "a-strong-password" Balkar Singh

import { createClient } from "@supabase/supabase-js";

const [companyName, email, password, firstName, lastName] =
  process.argv.slice(2);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n" +
      "Run this with --env-file=.env.local (see the usage comment at the top of this file)."
  );
  process.exit(1);
}

if (!companyName || !email || !password || !firstName || !lastName) {
  console.error(
    'Usage: node --env-file=.env.local scripts/create-first-admin.mjs "Company Name" admin@example.com password FirstName LastName'
  );
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: created, error: createError } = await admin.auth.admin.createUser(
  { email, password, email_confirm: true }
);

if (createError || !created.user) {
  console.error("Couldn't create the auth user:", createError?.message);
  process.exit(1);
}

const { data: company, error: rpcError } = await admin.rpc(
  "bootstrap_company",
  {
    p_owner_id: created.user.id,
    p_company_name: companyName,
    p_first_name: firstName,
    p_last_name: lastName,
    p_email: email,
  }
);

if (rpcError) {
  console.error("Couldn't create the company:", rpcError.message);
  console.error("Rolling back the auth user...");
  await admin.auth.admin.deleteUser(created.user.id);
  process.exit(1);
}

console.log(`Created "${company.name}" (${company.id})`);
console.log(`Admin: ${email} — log in at /login with the password you gave this script.`);
