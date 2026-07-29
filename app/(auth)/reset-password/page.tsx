import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { ResetPasswordForm } from "./reset-password-form";

export default async function ResetPasswordPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect(user.profile.role === "admin" ? "/dashboard" : "/today");
  }

  return <ResetPasswordForm />;
}
