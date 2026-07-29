import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UpdatePasswordForm } from "./update-password-form";

export default async function UpdatePasswordPage() {
  // Reaching this page requires the recovery session the /auth/callback
  // route establishes after the user clicks their emailed reset link — not
  // the requireUser() company-session guard used elsewhere.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/reset-password");

  return <UpdatePasswordForm />;
}
