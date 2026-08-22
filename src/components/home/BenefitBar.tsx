import { homeBenefitItems } from "@/data/homeContent";

export function BenefitBar() {
  return (
    <section className="border-b border-border bg-background">
      <div className="container">
        <ul className="grid grid-cols-2 gap-x-4 gap-y-3 py-4 sm:grid-cols-4 sm:py-3.5">
          {homeBenefitItems.map((item) => (
            <li key={item.id} className="min-w-0 text-center sm:text-left">
              <p className="text-[13px] font-semibold text-foreground">{item.title}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{item.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
