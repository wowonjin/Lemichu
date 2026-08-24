import { cn } from "@/lib/cn";

export const KOBOYO_ICONS = {
  "magnifying-glass": "돋보기",
  "shield-check": "방패 체크",
  "speech-bubble": "말풍선",
  truck: "트럭",
} as const;

export type KoboyoIconName = keyof typeof KOBOYO_ICONS;

export function KoboyoIcon({
  name,
  className,
}: {
  name: keyof typeof KOBOYO_ICONS;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn("inline-block bg-current", className)}
      style={{
        WebkitMaskImage: `url(/icons/koboyo/${name}.svg)`,
        maskImage: `url(/icons/koboyo/${name}.svg)`,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        WebkitMaskSize: "contain",
        maskSize: "contain",
      }}
    />
  );
}
