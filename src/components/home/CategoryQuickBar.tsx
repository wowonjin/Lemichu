import Image from "next/image";
import Link from "next/link";
import type { HomeCategoryItem } from "@/lib/homeCatalog";

export function CategoryQuickBar({ items }: { items: HomeCategoryItem[] }) {
  return (
    <section className="bg-background">
      <div className="container py-6 md:py-8">
        <ul className="flex justify-start gap-3 overflow-x-auto no-scrollbar md:justify-center md:gap-5">
          {items.map((item) => (
            <li key={item.id} className="shrink-0">
              <Link href={item.href} className="group flex w-20 flex-col items-center gap-2.5">
                <span className="relative grid size-[72px] place-items-center overflow-hidden rounded-full bg-[#f4f6f8] transition-colors group-hover:bg-[#e8ecf0] md:size-20">
                  <Image
                    src={item.imageSrc}
                    alt=""
                    fill
                    sizes="80px"
                    unoptimized
                    className="object-contain p-3"
                  />
                </span>
                <span className="text-center text-[12px] font-medium text-foreground md:text-[13px]">
                  {item.label}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
