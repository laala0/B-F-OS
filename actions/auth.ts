"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  loginSchema,
  signupSchema,
  acceptInviteSchema,
  requestPasswordResetSchema,
  updatePasswordSchema,
  type LoginInput,
  type SignupInput,
  type AcceptInviteInput,
  type RequestPasswordResetInput,
  type UpdatePasswordInput,
} from "@/lib/validation/auth";
import { actionOk, actionError, type ActionResult } from "@/types/domain";
import type { UserRole } from "@/types/database";

function landingPathForRole(role: UserRole): string {
  return role === "admin" ? "/dashboard" : "/today";
}

export async function login(input: LoginInput): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(
      "Check the highlighted fields.",
      parsed.error.flatten().fieldErrors
    );
  }

  const supabase = await createClient();
  const { email, password } = parsed.data;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return actionError("That email or password isn't right.");
  }

  // Admin client, deliberately: after 0006_security_hardening.sql, the
  // regular client can no longer see a suspended profile's own row at all
  // (company_id()/is_admin() return NULL/false for it, and profiles_select
  // is gated on company_id()). Reading via the regular client here would
  // make a suspended login look identical to "no profile exists" and lose
  // the accurate message below. Safe: password is already verified above,
  // and this reads exactly one row by that verified user's own id.
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role, status")
    .eq("id", data.user.id)
    .is("deleted_at", null)
    .single();

  if (!profile) {
    await supabase.auth.signOut();
    return actionError("This account isn't set up yet. Ask your admin to invite you.");
  }

  if (profile.status === "suspended") {
    await supabase.auth.signOut();
    return actionError("This account has been suspended.");
  }

  redirect(landingPathForRole(profile.role));
}

// Self-service version of scripts/create-first-admin.mjs — creates a brand
// new company and its first (admin) user in one step. Same admin-client +
// bootstrap_company RPC pattern as that script, just reachable from the
// browser instead of a terminal. Everyone after this account gets invited
// from Crew, same as before.
export async function signup(input: SignupInput): Promise<ActionResult> {
  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(
      "Check the highlighted fields.",
      parsed.error.flatten().fieldErrors
    );
  }
  const { companyName, firstName, lastName, email, password } = parsed.data;

  const admin = createAdminClient();

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError || !created.user) {
    if (createError?.message.includes("already been registered")) {
      return actionError("An account with this email already exists. Try logging in instead.");
    }
    return actionError("Couldn't create your account. Please try again.");
  }

  const { error: rpcError } = await admin.rpc("bootstrap_company", {
    p_owner_id: created.user.id,
    p_company_name: companyName,
    p_first_name: firstName,
    p_last_name: lastName,
    p_email: email,
  });

  if (rpcError) {
    await admin.auth.admin.deleteUser(created.user.id);
    return actionError("Couldn't create your company. Please try again.");
  }

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    return actionError(
      "Your account was created — please log in with your new password."
    );
  }

  redirect("/dashboard");
}

export async function logout(): Promise<never> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function acceptInvite(
  input: AcceptInviteInput
): Promise<ActionResult> {
  const parsed = acceptInviteSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(
      "Check the highlighted fields.",
      parsed.error.flatten().fieldErrors
    );
  }
  const { token, firstName, lastName, password } = parsed.data;

  const admin = createAdminClient();

  // Read-only pre-check so we don't create a stranded auth user for a
  // token that's already expired/accepted/revoked. accept_invite() below
  // re-checks this for real, inside a row lock — this step is purely to
  // fail fast with a clear message in the common case.
  const { data: invite } = await admin
    .from("invites")
    .select("email, accepted_at, revoked_at, expires_at")
    .eq("token", token)
    .single();

  if (
    !invite ||
    invite.accepted_at ||
    invite.revoked_at ||
    new Date(invite.expires_at) <= new Date()
  ) {
    return actionError("This invite link is invalid or has expired.");
  }

  const { data: created, error: createError } =
    await admin.auth.admin.createUser({
      email: invite.email,
      password,
      email_confirm: true,
    });

  if (createError || !created.user) {
    if (createError?.message.includes("already been registered")) {
      return actionError("An account with this email already exists. Try logging in instead.");
    }
    return actionError("Couldn't create your account. Please try again.");
  }

  const { error: rpcError } = await admin.rpc("accept_invite", {
    p_token: token,
    p_user_id: created.user.id,
    p_first_name: firstName,
    p_last_name: lastName,
  });

  if (rpcError) {
    // Invite got accepted/expired/revoked in the gap between the check
    // above and here — don't leave an orphaned auth user with no profile.
    await admin.auth.admin.deleteUser(created.user.id);
    return actionError("This invite link is invalid or has expired.");
  }

  // Establish the actual browser session (the admin client above has none).
  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: invite.email,
    password,
  });

  if (signInError) {
    return actionError(
      "Your account was created — please log in with your new password."
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", created.user.id)
    .single();

  redirect(landingPathForRole(profile?.role ?? "employee"));
}

export async function requestPasswordReset(
  input: RequestPasswordResetInput
): Promise<ActionResult> {
  const parsed = requestPasswordResetSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(
      "Enter a valid email address.",
      parsed.error.flatten().fieldErrors
    );
  }

  const supabase = await createClient();
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ?? (await headers()).get("origin") ?? "";

  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password/update`,
  });

  // Always return success — confirming/denying account existence here
  // would let anyone enumerate which emails have accounts.
  return actionOk(undefined);
}

export async function updatePassword(
  input: UpdatePasswordInput
): Promise<ActionResult> {
  const parsed = updatePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(
      "Check the highlighted fields.",
      parsed.error.flatten().fieldErrors
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return actionError(
      "Couldn't update your password — the reset link may have expired."
    );
  }

  redirect("/login");
}
