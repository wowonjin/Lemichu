"use client";

import { useState, type MouseEvent, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CatalogImage } from "@/components/product/CatalogImage";
import { cn } from "@/lib/cn";
import type { Product } from "@/types/product";

export function getProductPreviewImages(product: Pick<Product, "imageUrl" | "imageUrls">) {
  const raw = product.imageUrls?.length ? product.imageUrls : [product.imageUrl];
  return raw.filter((url, index) => Boolean(url) && raw.indexOf(url) === index);
}

function stopCardNavigation(event: MouseEvent<HTMLButtonElement>) {
  event.preventDefault();
  event.stopPropagation();
}

export function ProductPreviewMedia({
  product,
  sizes,
  imageClassName,
  children,
}: {
  product: Product;
  sizes: string;
  imageClassName?: string;
  children?: ReactNode;
}) {
  const images = getProductPreviewImages(product);
  const [index, setIndex] = useState(0);
  const currentIndex = images.length
    ? ((index % images.length) + images.length) % images.length
    : 0;
  const current = images[currentIndex] ?? product.imageUrl;
  const canNavigate = images.length > 1;

  function goTo(step: 1 | -1) {
    setIndex((prev) => prev + step);
  }

  return (
    <>
      <CatalogImage
        key={current}
        src={current}
        alt={`${product.brand} ${product.name}`}
        seed={product.id}
        sizes={sizes}
        className={imageClassName}
      />
      {children}
      {canNavigate ? (
        <>
          <NavArrow
            direction="prev"
            label={`이전 사진, ${currentIndex + 1} / ${images.length}`}
            onClick={() => goTo(-1)}
          />
          <NavArrow
            direction="next"
            label={`다음 사진, ${currentIndex + 1} / ${images.length}`}
            onClick={() => goTo(1)}
          />
        </>
      ) : null}
    </>
  );
}

function NavArrow({
  direction,
  label,
  onClick,
}: {
  direction: "prev" | "next";
  label: string;
  onClick: () => void;
}) {
  const Icon = direction === "prev" ? ChevronLeft : ChevronRight;

  return (
    <button
      type="button"
      aria-label={label}
      onMouseDown={stopCardNavigation}
      onClick={(event) => {
        stopCardNavigation(event);
        onClick();
      }}
      className={cn(
        "absolute top-1/2 z-20 grid size-8 -translate-y-1/2 place-items-center rounded-md bg-white/35 text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.7)] ring-1 ring-white/55 backdrop-blur-md transition-[opacity,background-color,transform] hover:bg-white/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground active:scale-95 dark:bg-white/10 dark:ring-white/20 dark:shadow-[0_1px_2px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.18)]",
        "pointer-events-none opacity-0 duration-200",
        "group-hover:pointer-events-auto group-hover:opacity-100",
        "group-focus-within:pointer-events-auto group-focus-within:opacity-100",
        "[@media(hover:none)]:pointer-events-auto [@media(hover:none)]:opacity-100",
        direction === "prev" ? "left-2" : "right-2"
      )}
    >
      <Icon className="size-4" strokeWidth={2} />
    </button>
  );
}
