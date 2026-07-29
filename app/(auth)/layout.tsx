import { BrandMark } from "@/components/shared/brand-mark";

// The auth shell stays permanently on the dark "Boss & Friends" brand
// treatment regardless of the signed-out visitor's light/dark preference —
// it's the one place we want the marketing-site identity to show up intact.
export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div
      className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-4 py-12"
      style={{
        background:
          "radial-gradient(120% 100% at 50% -10%, #1c2f45 0%, #0e1419 60%)",
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(#e8edf2 1px, transparent 1px), linear-gradient(90deg, #e8edf2 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />
      <div className="relative mb-8 flex flex-col items-center gap-3 text-center">
        <BrandMark size="lg" showWordmark={false} />
        <div className="flex flex-col items-center gap-1">
          <span className="font-display text-xl tracking-wide text-[#e8edf2]">
            BOSS &amp; FRIENDS
          </span>
          <span className="text-xs font-semibold tracking-[0.25em] text-[#9fb0bf] uppercase">
            Job tracking &amp; crew time
          </span>
        </div>
      </div>
      <div className="relative w-full max-w-sm">{children}</div>
    </div>
  );
}
