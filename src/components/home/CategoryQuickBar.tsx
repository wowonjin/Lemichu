import Image from "next/image";
import Link from "next/link";

type QuickItem = {
  id: string;
  label: string;
  href: string;
  imageSrc: string;
  accent?: boolean;
};

const items: QuickItem[] = [
  { id: "deal", label: "오늘특가", href: "/promotions", imageSrc: "/quick-products/new.png", accent: true },
  { id: "new", label: "신상품", href: "/new-arrivals", imageSrc: "/quick-products/new.png" },
  { id: "best", label: "랭킹", href: "/ranking", imageSrc: "/quick-products/best.png" },
  { id: "pre-owned", label: "중고명품", href: "/pre-owned", imageSrc: "/quick-products/pre-owned.png" },
  { id: "women", label: "여성가방", href: "/category/women-bags", imageSrc: "/quick-products/women.png" },
  { id: "men", label: "남성가방", href: "/category/men-bags", imageSrc: "/quick-products/men.png" },
  { id: "wallet", label: "지갑", href: "/category/wallets", imageSrc: "/quick-products/wallet.png" },
  { id: "shoes", label: "슈즈", href: "/category/shoes", imageSrc: "/quick-products/shoes.png" },
  { id: "watch", label: "시계", href: "/category/watches", imageSrc: "/quick-products/watch.png" },
  { id: "jewelry", label: "주얼리", href: "/category/jewelry", imageSrc: "/quick-products/jewelry.png" },
];

export function CategoryQuickBar() {
  return (
    <section className="bg-background">
      <div className="container py-6">
        <ul className="flex justify-start gap-3 overflow-x-auto no-scrollbar md:justify-center md:gap-4">
          {items.map((item) => (
            <li key={item.id} className="shrink-0">
              <Link
                href={item.href}
                className="group flex w-20 flex-col items-center gap-2.5"
              >
                <span className="relative grid size-[72px] place-items-center overflow-hidden rounded-full bg-[#f7f8f9] transition-colors group-hover:bg-secondary md:size-20">
                  <Image
                    src={item.imageSrc}
                    alt=""
                    fill
                    sizes="80px"
                    className="object-contain p-1.5 mix-blend-multiply"
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
