import { HardHat } from "lucide-react";
import { cn } from "@/lib/utils";

export function BrandMark({
  size = "md",
  showWordmark = true,
  className,
}: {
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
  className?: string;
}) {
  const box =
    size === "lg" ? "h-14 w-14 rounded-2xl" : size === "sm" ? "h-8 w-8 rounded-lg" : "h-10 w-10 rounded-xl";
  const glyph = size === "lg" ? "h-8 w-8" : size === "sm" ? "h-5 w-5" : "h-6 w-6";

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "flex shrink-0 items-center justify-center border border-white/10 bg-gradient-to-br from-[#1c2832] to-[#0e1419] text-gold",
          box
        )}
      >
        <HardHat className={glyph} strokeWidth={2.25} />
      </span>
      {showWordmark && (
        <span className="flex flex-col leading-none">
          <span
            className={cn(
              "font-display tracking-wide text-sidebar-foreground",
              size === "lg" ? "text-2xl" : "text-base"
            )}
          >
            BOSS &amp; FRIENDS
          </span>
          <span className="mt-1 text-[10px] font-semibold tracking-[0.2em] text-sidebar-foreground/55 uppercase">
            Construction Ltd.
          </span>
        </span>
      )}
    </div>
  );
}
