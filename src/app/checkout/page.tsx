import type { Metadata } from "next";
import { CheckoutPageClient } from "@/components/checkout/CheckoutPageClient";

export const metadata: Metadata = {
  title: "주문/결제",
  description: "비회원 주문 및 결제",
};

export default function CheckoutPage() {
  return <CheckoutPageClient />;
}
