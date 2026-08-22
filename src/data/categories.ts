import {
  Briefcase,
  ShoppingBag,
  Wallet,
  Footprints,
  Watch,
  Gem,
  Shirt,
  type LucideIcon,
} from "lucide-react";

export type Category = {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  /** short english/hint label shown under the title */
  hint: string;
};

export const categories: Category[] = [
  {
    id: "women-bags",
    label: "여성 가방",
    hint: "Women's Bags",
    href: "/category/women-bags",
    icon: ShoppingBag,
  },
  {
    id: "men-bags",
    label: "남성 가방",
    hint: "Men's Bags",
    href: "/category/men-bags",
    icon: Briefcase,
  },
  {
    id: "wallets",
    label: "지갑",
    hint: "Wallets",
    href: "/category/wallets",
    icon: Wallet,
  },
  {
    id: "shoes",
    label: "슈즈",
    hint: "Shoes",
    href: "/category/shoes",
    icon: Footprints,
  },
  {
    id: "watches",
    label: "시계",
    hint: "Watches",
    href: "/category/watches",
    icon: Watch,
  },
  {
    id: "jewelry",
    label: "주얼리",
    hint: "Jewelry",
    href: "/category/jewelry",
    icon: Gem,
  },
  {
    id: "apparel",
    label: "의류",
    hint: "Apparel",
    href: "/category/apparel",
    icon: Shirt,
  },
];
