import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string | number;
  tone?: "default" | "amber" | "green" | "red";
}) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <p className="text-xs font-medium text-neutral-500">{label}</p>
      <p
        className={cn(
          "mt-1 text-xl font-semibold",
          tone === "default" && "text-neutral-900",
          tone === "amber" && "text-amber-600",
          tone === "green" && "text-green-600",
          tone === "red" && "text-red-600"
        )}
      >
        {value}
      </p>
    </div>
  );
}
