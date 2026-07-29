import { requireRole } from "@/lib/auth/guards";
import { FieldTabBar } from "@/components/field/field-tab-bar";
import { UserMenu } from "@/components/shared/user-menu";
import { BrandMark } from "@/components/shared/brand-mark";

// One-handed, gloves-on, sunlight-readable. Admins can land here too (e.g.
// to check in on a site themselves).
export default async function FieldLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await requireRole("admin", "employee");

  return (
    <div className="flex h-full flex-1 flex-col bg-muted/40">
      <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between border-b border-sidebar-border bg-sidebar px-4">
        <BrandMark size="sm" showWordmark={false} />
        <UserMenu
          firstName={user.profile.first_name}
          lastName={user.profile.last_name}
          email={user.email}
          avatarUrl={user.profile.avatar_url}
        />
      </header>
      <main className="flex-1 overflow-y-auto pb-24">{children}</main>
      <FieldTabBar />
    </div>
  );
}
