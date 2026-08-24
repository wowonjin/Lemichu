import Link from "next/link";
import { RotateCcw, ShieldCheck, ShoppingBag, Truck } from "lucide-react";

export default function CartPage() {
  return (
    <div className="bg-[#F5F5F7] font-sans text-[#1D1D1F] dark:bg-black dark:text-[#F5F5F7]">
      <div className="mx-auto max-w-[1040px] px-5 pb-36 pt-10 md:px-8 md:pb-24 md:pt-16">
        <header>
          <h1 className="text-[40px] font-semibold leading-[1.05] tracking-[-0.035em] md:text-[56px]">
            장바구니.
          </h1>
          <p className="mt-4 text-[17px] leading-relaxed text-[#6E6E73] md:text-[19px] dark:text-[#A1A1A6]">
            담아둔 상품이 없습니다. 검수 완료 상품을 둘러보세요.
          </p>
        </header>

        <section className="mt-8 rounded-md bg-white px-6 py-20 text-center dark:bg-[#1C1C1E]">
          <span className="mx-auto grid size-16 place-items-center rounded-md bg-[#F5F5F7] dark:bg-[#2C2C2E]">
            <ShoppingBag className="size-7 text-[#6E6E73]" strokeWidth={1.5} />
          </span>
          <h2 className="mt-6 text-[28px] font-semibold tracking-[-0.03em]">
            장바구니가 비어 있습니다.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-[#6E6E73] dark:text-[#A1A1A6]">
            상품 상세에서 색상과 사이즈를 확인한 후 구매할 수 있습니다.
          </p>
          <Link
            href="/new-arrivals"
            className="mt-7 inline-flex h-12 items-center justify-center rounded-md bg-[#0071E3] px-7 text-[17px] text-white transition-colors hover:bg-[#0077ED]"
          >
            상품 보러가기
          </Link>
        </section>

        <section className="mt-8 grid gap-3 sm:grid-cols-3">
          <TrustCard
            icon={ShieldCheck}
            title="정품 검수"
            description="전문 검수팀이 진위와 상태를 확인한 뒤에만 출고합니다."
          />
          <TrustCard
            icon={Truck}
            title="안심 배송"
            description="50만원 이상 무료 배송. 파손 방지 포장으로 보냅니다."
          />
          <TrustCard
            icon={RotateCcw}
            title="교환 · 반품"
            description="미사용 상품은 수령 후 7일 이내에 접수할 수 있습니다."
          />
        </section>
      </div>
    </div>
  );
}

function TrustCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof ShieldCheck;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-md bg-white px-5 py-5 dark:bg-[#1C1C1E]">
      <Icon className="size-5 text-[#0071E3]" strokeWidth={1.7} />
      <p className="mt-3 text-[15px] font-semibold tracking-[-0.01em]">{title}</p>
      <p className="mt-1.5 text-[13px] leading-relaxed text-[#6E6E73] dark:text-[#A1A1A6]">
        {description}
      </p>
    </div>
  );
}
