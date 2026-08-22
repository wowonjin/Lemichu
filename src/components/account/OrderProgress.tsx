import { cn } from "@/lib/cn";
import {
  getOrderProgressIndex,
  ORDER_PROGRESS_STEPS,
  ORDER_STATUS_LABELS,
} from "@/lib/orderStatus";
import type { OrderStatus } from "@/lib/orders";

export function OrderProgress({ status }: { status: OrderStatus }) {
  const currentIndex = getOrderProgressIndex(status);

  if (currentIndex < 0) {
    return (
      <p className="text-sm font-semibold text-foreground">
        {ORDER_STATUS_LABELS[status]}
      </p>
    );
  }

  return (
    <ol className="flex items-center" aria-label="주문 진행 단계">
      {ORDER_PROGRESS_STEPS.map((step, index) => {
        const complete = index < currentIndex;
        const current = index === currentIndex;
        return (
          <li key={step} className="flex flex-1 flex-col items-center">
            <div className="flex w-full items-center">
              <div className={cn("h-px flex-1", index === 0 ? "bg-transparent" : complete || current ? "bg-foreground" : "bg-border")} />
              <span
                className={cn(
                  "grid size-2.5 shrink-0 place-items-center rounded-full",
                  complete || current ? "bg-foreground" : "bg-border"
                )}
                aria-hidden
              />
              <div className={cn("h-px flex-1", index === ORDER_PROGRESS_STEPS.length - 1 ? "bg-transparent" : complete ? "bg-foreground" : "bg-border")} />
            </div>
            <span
              className={cn(
                "mt-2 text-[11px]",
                current ? "font-semibold text-foreground" : complete ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {ORDER_STATUS_LABELS[step]}
              {current ? <span className="sr-only"> 현재 단계</span> : null}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
