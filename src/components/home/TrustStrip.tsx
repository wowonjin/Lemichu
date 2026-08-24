import { trustItems } from "@/data/campaigns";

export function TrustStrip() {
  return (
    <section className="bg-background">
      <div className="container py-5">
        <ul className="grid grid-cols-5 justify-items-center gap-x-4 gap-y-5">
          {trustItems.map((item) => (
            <li key={item.id}>
              <span className="grid size-10 shrink-0 place-items-center rounded-md border border-gold/30 bg-gold-soft/40">
                <item.icon className="size-5 text-gold" />
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
