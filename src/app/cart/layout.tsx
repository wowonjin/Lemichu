import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "장바구니 — LEMICHU",
  description: "검수 완료 상품을 확인하고 결제하세요.",
};

export default function CartLayout({ children }: { children: ReactNode }) {
  return children;
}
