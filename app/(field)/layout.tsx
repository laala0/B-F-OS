import { requireRole } from "@/lib/auth/guards";
import { FieldTabBar } from "@/components/field/field-tab-bar";
import { UserMenu } from "@/components/shared/user-menu";

// One-handed, gloves-on, sunlight-readable. Admins can land here too (e.g.
// to check in on a site themselves).
export default async function FieldLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await requireRole("admin", "employee");

  return (
    <div className="flex h-full flex-1 flex-col bg-neutral-50">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-4">
        <span className="text-sm font-semibold tracking-tight text-neutral-900">
          Boss &amp; Friends
        </span>
        <UserMenu
          firstName={user.profile.first_name}
          lastName={user.profile.last_name}
          email={user.email}
          avatarUrl={user.profile.avatar_url}
        />
      </header>
      <main className="flex-1 overflow-y-auto pb-20">{children}</main>
      <FieldTabBar />
    </div>
  );
}
