"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react";
import { cn } from "@/lib/cn";
import { getPlaceholderGradient, isRealImage } from "@/lib/placeholder";
import { ConditionBadge } from "@/components/product/ProductBadge";
import { SoldOutOverlay, isSoldProduct } from "@/components/product/SoldOutOverlay";
import type { Product } from "@/types/product";

function galleryImagesFrom(images: string[], fallback: string) {
  const raw = images.length ? images : [fallback];
  return raw.filter((url) => Boolean(url));
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
  const galleryImages = galleryImagesFrom(images, product.imageUrl);
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
    <div className="grid gap-4 md:grid-cols-[auto_minmax(0,1fr)]">
      <ThumbnailRail imageCount={galleryImages.length}>
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
      </ThumbnailRail>

      <div>
        <div
          className="group relative aspect-[4/3] overflow-hidden rounded-md bg-[#F4F5F7] dark:bg-muted md:aspect-square md:rounded-none"
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
          {product.isPreOwned && product.condition ? (
            <div className="absolute left-4 top-4 z-10 flex flex-wrap gap-1.5">
              <ConditionBadge condition={product.condition} />
            </div>
          ) : null}

          {isRealImage(activeImage) ? (
            <div className="absolute inset-0 flex items-center justify-center p-6 md:p-8">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeImage}
                alt={`${product.brand} ${product.name}`}
                className="min-h-0 min-w-0 max-h-full max-w-full object-contain"
              />
            </div>
          ) : (
            <div
              className="absolute inset-0"
              style={{ backgroundImage: getPlaceholderGradient(`${product.id}-${activeIndex}`) }}
            />
          )}

          {isSoldProduct(product) ? (
            <SoldOutOverlay badgeClassName="size-[104px] text-[15px] md:size-[120px] md:text-[16px]" />
          ) : null}

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
              <p className="absolute bottom-3 right-3 z-10 rounded-md bg-background/90 px-2.5 py-1 text-xs font-medium tabular-nums text-foreground backdrop-blur">
                {activeIndex + 1} / {galleryImages.length}
              </p>
            </>
          ) : null}
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar md:hidden">
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

function ThumbnailRail({
  imageCount,
  children,
}: {
  imageCount: number;
  children: ReactNode;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbHeightRef = useRef(28);
  const dragOffsetRef = useRef(0);
  const [metrics, setMetrics] = useState({
    overflow: false,
    canUp: false,
    canDown: false,
    listHeight: 0,
    thumbTop: 0,
    thumbHeight: 28,
  });

  const updateMetrics = useCallback(() => {
    const list = listRef.current;
    const track = trackRef.current;
    if (!list) return;

    const { scrollTop, scrollHeight, clientHeight } = list;
    const overflow = scrollHeight > clientHeight + 1;
    const maxScroll = Math.max(scrollHeight - clientHeight, 1);
    const trackHeight = track?.clientHeight || clientHeight;
    const thumbHeight = Math.max((clientHeight / scrollHeight) * trackHeight, 24);
    const thumbTop = (scrollTop / maxScroll) * Math.max(trackHeight - thumbHeight, 1);

    thumbHeightRef.current = thumbHeight;
    setMetrics({
      overflow,
      canUp: scrollTop > 2,
      canDown: scrollTop < maxScroll - 2,
      listHeight: clientHeight,
      thumbTop,
      thumbHeight,
    });
  }, []);

  useEffect(() => {
    updateMetrics();
    const list = listRef.current;
    const content = contentRef.current;
    if (!list) return;

    list.addEventListener("scroll", updateMetrics, { passive: true });
    const observer = new ResizeObserver(updateMetrics);
    observer.observe(list);
    if (content) observer.observe(content);

    return () => {
      list.removeEventListener("scroll", updateMetrics);
      observer.disconnect();
    };
  }, [imageCount, updateMetrics]);

  useLayoutEffect(() => {
    if (!metrics.overflow) return;
    updateMetrics();
  }, [metrics.overflow, updateMetrics]);

  const scrollByStep = (direction: -1 | 1) => {
    listRef.current?.scrollBy({
      top: direction * 88,
      behavior: "smooth",
    });
  };

  const scrollFromClientY = (clientY: number, thumbOffset: number) => {
    const list = listRef.current;
    const track = trackRef.current;
    if (!list || !track) return;

    const rect = track.getBoundingClientRect();
    const thumbHeight = thumbHeightRef.current;
    const maxThumbTop = Math.max(rect.height - thumbHeight, 1);
    const nextThumbTop = Math.min(Math.max(clientY - rect.top - thumbOffset, 0), maxThumbTop);
    const maxScroll = Math.max(list.scrollHeight - list.clientHeight, 1);
    list.scrollTop = (nextThumbTop / maxThumbTop) * maxScroll;
  };

  const onThumbPointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    dragOffsetRef.current = event.clientY - event.currentTarget.getBoundingClientRect().top;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onThumbPointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    scrollFromClientY(event.clientY, dragOffsetRef.current);
  };

  return (
    <div className="hidden md:flex md:items-start md:gap-1.5">
      <div
        ref={listRef}
        className="no-scrollbar w-[76px] max-h-[min(36rem,70vh)] overflow-y-auto overscroll-contain"
      >
        <div ref={contentRef} className="space-y-3">
          {children}
        </div>
      </div>

      {metrics.overflow ? (
        <div
          className="flex w-4 shrink-0 flex-col items-center"
          style={{ height: metrics.listHeight || undefined }}
        >
          <button
            type="button"
            aria-label="이전 썸네일"
            disabled={!metrics.canUp}
            onClick={() => scrollByStep(-1)}
            className="flex size-4 items-center justify-center text-[#B0B0B0] transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-25"
          >
            <ChevronUp className="size-3.5" />
          </button>

          <div
            ref={trackRef}
            className="relative my-1 w-full flex-1 cursor-pointer"
            onPointerDown={(event) => {
              if (event.target !== event.currentTarget) return;
              scrollFromClientY(event.clientY, thumbHeightRef.current / 2);
            }}
          >
            <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 rounded-full bg-[#E8E8E8] dark:bg-border" />
            <button
              type="button"
              aria-label="썸네일 스크롤"
              onPointerDown={onThumbPointerDown}
              onPointerMove={onThumbPointerMove}
              className="group absolute left-1/2 flex w-3 -translate-x-1/2 cursor-grab justify-center active:cursor-grabbing"
              style={{
                top: metrics.thumbTop,
                height: metrics.thumbHeight,
              }}
            >
              <span className="h-full w-1 rounded-full bg-[#C2C2C2] transition-colors group-hover:bg-[#8A8A8A] dark:bg-muted-foreground/60" />
            </button>
          </div>

          <button
            type="button"
            aria-label="다음 썸네일"
            disabled={!metrics.canDown}
            onClick={() => scrollByStep(1)}
            className="flex size-4 items-center justify-center text-[#B0B0B0] transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-25"
          >
            <ChevronDown className="size-3.5" />
          </button>
        </div>
      ) : null}
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
        "aspect-square overflow-hidden border-2 bg-[#F7F7F7] p-1 transition-colors dark:bg-muted",
        selected ? "border-foreground" : "border-transparent hover:border-[#D9D9D9]",
        className
      )}
    >
      <div
        className="h-full overflow-hidden"
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
        "absolute top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-md bg-background/90 text-foreground shadow-sm backdrop-blur transition-[opacity,background-color] hover:bg-background",
        "pointer-events-none opacity-0 duration-200",
        "group-hover:pointer-events-auto group-hover:opacity-100",
        "group-focus-within:pointer-events-auto group-focus-within:opacity-100",
        "[@media(hover:none)]:pointer-events-auto [@media(hover:none)]:opacity-100",
        direction === "prev" ? "left-3" : "right-3"
      )}
    >
      <Icon className="size-5" />
    </button>
  );
}
