import type { Metadata } from "next";
import { CustomerPageShell } from "@/components/layout/CustomerPage";
import { GuestOrderLookup } from "@/components/orders/GuestOrderLookup";

export const metadata: Metadata = {
  title: "비회원 주문조회",
  description: "전화번호 또는 이메일로 비회원 주문 상태를 확인하세요.",
};

export default function GuestOrderLookupPage() {
  return (
    <CustomerPageShell>
      <section className="mx-auto max-w-xl">
        <h1 className="text-[26px] font-bold tracking-tight text-foreground">
          비회원 주문조회
        </h1>
        <p className="mt-2 text-[14px] leading-6 text-muted-foreground">
          주문할 때 입력한 휴대전화 번호 또는 이메일로 주문상태, 택배사, 송장번호를
          확인할 수 있어요.
        </p>
        <div className="mt-8">
          <GuestOrderLookup />
        </div>
      </section>
    </CustomerPageShell>
  );
}
