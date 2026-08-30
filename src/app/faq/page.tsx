import type { Metadata } from "next";
import { CustomerPageShell } from "@/components/layout/CustomerPage";
import { PublishedFaqList } from "@/components/content/PublishedFaqList";
import { getKakaoChatUrl } from "@/lib/kakao-inquiry";

export const metadata: Metadata = {
  title: "자주 묻는 질문",
};

export default function FaqPage() {
  return (
    <CustomerPageShell className="bg-background font-sans">
      <section>
        <div className="flex flex-col gap-3 pb-2 md:flex-row md:items-end md:justify-between">
          <h1 className="mt-2 text-xl font-semibold tracking-tight text-foreground md:text-2xl">
            자주 묻는 질문
          </h1>
        </div>
        <p className="mb-6 mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          배송, 정품 검수, 결제, 교환/반품 관련 궁금한 점을 카테고리별로 정리했습니다.
          원하는 답이 없으면{" "}
          <a
            href={getKakaoChatUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-foreground underline underline-offset-2"
          >
            카카오톡 고객센터
          </a>
          로 문의해 주세요.
        </p>

        <PublishedFaqList />
      </section>
    </CustomerPageShell>
  );
}
