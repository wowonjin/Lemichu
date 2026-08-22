import type { Metadata } from "next";
import { InfoArticle } from "@/components/content/InfoArticle";
import { deliveryPolicy } from "@/data/pageContent";

export const metadata: Metadata = {
  title: "배송/교환/반품 안내 — LEMICHU",
};

export default function DeliveryPolicyPage() {
  return <InfoArticle doc={deliveryPolicy} />;
}
