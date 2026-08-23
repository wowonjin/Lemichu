import Image from "next/image";
import { getPlaceholderGradient, isRealImage, isRemoteImage } from "@/lib/placeholder";

export function CatalogImage({
  src,
  alt,
  className,
  sizes,
  seed,
}: {
  src: string;
  alt: string;
  className?: string;
  sizes: string;
  seed?: string;
}) {
  if (!isRealImage(src)) {
    return (
      <div
        className="h-full w-full"
        style={{ backgroundImage: getPlaceholderGradient(seed ?? src) }}
        aria-hidden
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      unoptimized={isRemoteImage(src)}
      className={className}
    />
  );
}
