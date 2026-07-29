import "server-only";
import { redirect } from "next/navigation";
import { getCurrentUser, type CurrentUser } from "@/lib/auth/session";
import type { UserRole } from "@/types/database";

// Call at the top of any (admin) or (field) layout/page/action. Not a
// replacement for RLS — a bug here fails open to "no data" (RLS still
// blocks the query), not open to another company's data.
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(...roles: UserRole[]): Promise<CurrentUser> {
  const user = await requireUser();
  if (!roles.includes(user.profile.role)) {
    redirect("/today");
  }
  return user;
}

// requireProjectAccess(projectId) belongs here once `projects` and
// `project_assignments` exist (Phase 2 migration) — it doesn't have
// anything to check against yet, so it isn't stubbed out in this pass.
