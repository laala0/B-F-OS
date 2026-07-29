export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-neutral-50 px-4 py-12">
      <div className="mb-8 flex flex-col items-center gap-1 text-center">
        <span className="text-lg font-semibold tracking-tight text-neutral-900">
          Boss &amp; Friends
        </span>
        <span className="text-sm text-neutral-500">Job tracking &amp; crew time</span>
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
