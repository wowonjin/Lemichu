import { Ticket, Truck, Heart } from "lucide-react";

const benefits = [
  {
    icon: Ticket,
    title: "신규 회원 5,000원 쿠폰",
    description: "가입 즉시 바로 사용 가능한 할인 쿠폰을 드려요.",
  },
  {
    icon: Truck,
    title: "전상품 무료배송",
    description: "회원이라면 모든 상품을 무료로 받아보세요.",
  },
  {
    icon: Heart,
    title: "관심 브랜드 맞춤 알림",
    description: "관심 브랜드를 최대 5개까지 선택하고 소식을 받아보세요.",
  },
];

export function SignupBenefits() {
  return (
    <div className="rounded-2xl border border-gold/30 bg-gold-soft/30 p-6">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-gold">
        Membership
      </p>
      <h2 className="mt-2 font-serif text-xl font-semibold text-foreground">
        회원가입 혜택
      </h2>
      <ul className="mt-5 space-y-4">
        {benefits.map((benefit) => (
          <li key={benefit.title} className="flex gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-md border border-gold/30 bg-background">
              <benefit.icon className="size-5 text-gold" />
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {benefit.title}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                {benefit.description}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
