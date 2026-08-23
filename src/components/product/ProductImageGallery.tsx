"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { getPlaceholderGradient, isRealImage } from "@/lib/placeholder";
import {
  AuthenticationBadge,
  ConditionBadge,
} from "@/components/product/ProductBadge";
import type { Product } from "@/types/product";

function uniqueImages(images: string[]) {
  return images.filter((url, index) => url && images.indexOf(url) === index);
}

export function ProductImageGallery({
  product,
  images,
  children,
}: {
  product: Product;
  images: string[];
  children?: ReactNode;
}) {
  const galleryImages = uniqueImages(images.length ? images : [product.imageUrl]);
  const [activeIndex, setActiveIndex] = useState(0);
  const thumbnailRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const activeImage = galleryImages[activeIndex] ?? galleryImages[0];
  const canNavigate = galleryImages.length > 1;

  const goTo = useCallback(
    (index: number) => {
      if (!galleryImages.length) return;
      const nextIndex = (index + galleryImages.length) % galleryImages.length;
      setActiveIndex(nextIndex);
    },
    [galleryImages.length]
  );

  useEffect(() => {
    const node = thumbnailRefs.current[activeIndex];
    if (!node || node.offsetParent === null) return;
    node.scrollIntoView({
      block: "nearest",
      inline: "nearest",
    });
  }, [activeIndex]);

  return (
    <div className="grid gap-4 md:grid-cols-[76px_minmax(0,1fr)]">
      <div className="hidden max-h-[min(36rem,70vh)] space-y-3 overflow-y-auto md:block">
        {galleryImages.map((imageUrl, index) => (
          <ThumbnailButton
            key={`${imageUrl}-${index}`}
            ref={(node) => {
              thumbnailRefs.current[index] = node;
            }}
            imageUrl={imageUrl}
            productId={product.id}
            index={index}
            alt={`${product.brand} ${product.name} ${index + 1}`}
            selected={index === activeIndex}
            onSelect={() => goTo(index)}
          />
        ))}
      </div>

      <div>
        <div
          className="relative -mx-4 aspect-square overflow-hidden bg-[#F7F7F7] dark:bg-muted md:mx-0 md:rounded-[20px]"
          onKeyDown={(event) => {
            if (!canNavigate) return;
            if (event.key === "ArrowLeft") {
              event.preventDefault();
              goTo(activeIndex - 1);
            }
            if (event.key === "ArrowRight") {
              event.preventDefault();
              goTo(activeIndex + 1);
            }
          }}
          tabIndex={canNavigate ? 0 : undefined}
        >
          <div className="absolute left-4 top-4 z-10 flex flex-wrap gap-1.5">
            <AuthenticationBadge status={product.authenticationStatus} />
            {product.isPreOwned && product.condition ? (
              <ConditionBadge condition={product.condition} />
            ) : null}
          </div>

          {isRealImage(activeImage) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={activeImage}
              alt={`${product.brand} ${product.name}`}
              className="h-full w-full object-contain"
            />
          ) : (
            <div
              className="h-full w-full"
              style={{ backgroundImage: getPlaceholderGradient(`${product.id}-${activeIndex}`) }}
            />
          )}

          {canNavigate ? (
            <>
              <NavButton
                direction="prev"
                onClick={() => goTo(activeIndex - 1)}
              />
              <NavButton
                direction="next"
                onClick={() => goTo(activeIndex + 1)}
              />
              <p className="absolute bottom-3 right-3 z-10 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium tabular-nums text-foreground backdrop-blur">
                {activeIndex + 1} / {galleryImages.length}
              </p>
            </>
          ) : null}
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto md:hidden">
          {galleryImages.map((imageUrl, index) => (
            <ThumbnailButton
              key={`mobile-${imageUrl}-${index}`}
              imageUrl={imageUrl}
              productId={product.id}
              index={index}
              alt={`${product.brand} ${product.name} ${index + 1}`}
              selected={index === activeIndex}
              onSelect={() => goTo(index)}
              className="w-16 shrink-0"
            />
          ))}
        </div>
        {children}
      </div>
    </div>
  );
}

function ThumbnailButton({
  ref,
  imageUrl,
  productId,
  index,
  alt,
  selected,
  onSelect,
  className,
}: {
  ref?: (node: HTMLButtonElement | null) => void;
  imageUrl: string;
  productId: string;
  index: number;
  alt: string;
  selected: boolean;
  onSelect: () => void;
  className?: string;
}) {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onSelect}
      aria-current={selected ? "true" : undefined}
      aria-label={`${index + 1}번째 사진 보기`}
      className={cn(
        "aspect-square overflow-hidden rounded-[12px] border-2 bg-[#F7F7F7] p-1 transition-colors dark:bg-muted",
        selected ? "border-foreground" : "border-transparent hover:border-[#D9D9D9]",
        className
      )}
    >
      <div
        className="h-full overflow-hidden rounded-[8px]"
        style={
          isRealImage(imageUrl)
            ? undefined
            : { backgroundImage: getPlaceholderGradient(`${productId}-${index}`) }
        }
      >
        {isRealImage(imageUrl) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={alt}
            className="h-full w-full object-contain p-1 mix-blend-multiply"
          />
        ) : null}
      </div>
    </button>
  );
}

function NavButton({
  direction,
  onClick,
}: {
  direction: "prev" | "next";
  onClick: () => void;
}) {
  const Icon = direction === "prev" ? ChevronLeft : ChevronRight;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === "prev" ? "이전 사진" : "다음 사진"}
      className={cn(
        "absolute top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm backdrop-blur transition-colors hover:bg-background",
        direction === "prev" ? "left-3" : "right-3"
      )}
    >
      <Icon className="size-5" />
    </button>
  );
}
