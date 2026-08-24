import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, ShieldAlert, Truck } from "lucide-react";
import { CustomerPageHero, CustomerPageShell } from "@/components/layout/CustomerPage";
import { AuthenticationGuide } from "@/components/home/AuthenticationGuide";
import { authenticationDoc } from "@/data/pageContent";

export const metadata: Metadata = {
  title: "정품 검수 안내",
};

const highlights = [
  {
    icon: ShieldCheck,
    title: "전문 검수팀 1:1 확인",
    description: "카테고리별 전문 검수팀이 모든 상품의 정품 여부를 직접 확인합니다.",
  },
  {
    icon: ShieldAlert,
    title: "가품 시 200% 보상",
    description: "가품으로 판정될 경우 결제 금액의 200%를 보상해드립니다.",
  },
  {
    icon: Truck,
    title: "검수 후 안전 배송",
    description: "검수를 통과한 상품만 안전하게 포장하여 발송합니다.",
  },
];

export default function AuthenticationPage() {
  return (
    <div className="bg-background">
      <CustomerPageShell className="bg-transparent">
        <CustomerPageHero
          eyebrow="Authentication"
          title={authenticationDoc.title}
          description={authenticationDoc.description}
        />

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {highlights.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-border bg-sand p-6 text-center"
            >
              <span className="mx-auto grid size-12 place-items-center rounded-md bg-background text-gold shadow-sm">
                <item.icon className="size-6" strokeWidth={1.8} />
              </span>
              <h2 className="mt-4 text-sm font-semibold text-foreground">
                {item.title}
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </CustomerPageShell>

      <AuthenticationGuide />

      <div className="container py-12 text-center">
        <p className="text-sm text-muted-foreground">
          정책이 궁금하신가요?
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <Link
            href="/policy/guarantee"
            className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-background px-6 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            가품 보상 정책
          </Link>
          <Link
            href="/policy/delivery"
            className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-background px-6 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            배송/교환/반품
          </Link>
        </div>
      </div>
    </div>
  );
}
