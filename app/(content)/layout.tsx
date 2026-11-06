import Link from "next/link";
import { requireRole } from "@/lib/auth/guards";
import { UserMenu } from "@/components/shared/user-menu";

const NAV = [
  { href: "/content", label: "One photo" },
  { href: "/content/posts", label: "One post" },
  { href: "/content/library", label: "Library" },
  { href: "/content/jobs", label: "Jobs" },
];

// The private side of Form2Finish, thumb-first: one decision per screen. Its own
// shell so it never leans on the crew-facing nav. RLS keeps the data to the
// Form2Finish admin, so a Boss & Friends admin landing here just sees nothing.
export default async function ContentLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await requireRole("admin");

  return (
    <div className="flex min-h-full flex-1 flex-col bg-[#15181b] text-[#f4f1ea]">
      <header className="sticky top-0 z-10 border-b border-[#2a2e32] bg-[#15181b]">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-2">
          <p className="font-[family-name:var(--font-display)] text-lg tracking-wide">FORM2FINISH</p>
          <UserMenu
            firstName={user.profile.first_name}
            lastName={user.profile.last_name}
            email={user.email}
            avatarUrl={user.profile.avatar_url}
          />
        </div>
        <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-3 pb-2" aria-label="Content">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="min-h-11 shrink-0 rounded px-3 py-2.5 text-sm font-medium text-[#c9c6bf] hover:bg-[#23272b] hover:text-[#f4f1ea]"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-4">{children}</main>
    </div>
  );
}
