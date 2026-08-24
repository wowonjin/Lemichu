import type { Metadata } from "next";
import { InfoArticle } from "@/components/content/InfoArticle";
import { guaranteePolicy } from "@/data/pageContent";

export const metadata: Metadata = {
  title: "가품 보상 정책",
};

export default function GuaranteePolicyPage() {
  return <InfoArticle doc={guaranteePolicy} />;
}
