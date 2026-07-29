import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";

export default async function RootPage() {
  const user = await getCurrentUser();

  if (!user) redirect("/login");

  if (user.profile.role === "admin") {
    redirect("/dashboard");
  }

  redirect("/today");
}
