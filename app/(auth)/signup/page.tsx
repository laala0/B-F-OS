import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { SignupForm } from "./signup-form";

export default async function SignupPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect(user.profile.role === "admin" ? "/dashboard" : "/today");
  }

  return <SignupForm />;
}
