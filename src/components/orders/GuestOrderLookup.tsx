"use client";

import { useState, type FormEvent } from "react";
import { PackageSearch } from "lucide-react";
import {
  lookupGuestOrders,
  type GuestOrderLookupItem,
} from "@/lib/guest-order-lookup";
import { OrderShipmentSummary } from "@/components/orders/OrderShipmentSummary";

export function GuestOrderLookup() {
  const [query, setQuery] = useState("");
  const [orders, setOrders] = useState<GuestOrderLookupItem[] | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setOrders(null);

    try {
      setOrders(await lookupGuestOrders(query));
    } catch (lookupError) {
      setError(
        lookupError instanceof Error
          ? lookupError.message
          : "주문을 조회하지 못했어요."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-xl">
      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-semibold text-foreground">
            전화번호 또는 이메일
          </span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="01012345678 또는 you@example.com"
            autoComplete="off"
            className="h-12 w-full rounded-[12px] border border-[#E5E8EB] bg-background px-4 text-[15px] outline-none transition-colors placeholder:text-[#8B95A1] focus:border-[#3182F6] focus:ring-2 focus:ring-[#3182F6]/20"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="flex h-12 w-full items-center justify-center rounded-[12px] bg-[#191F28] text-[15px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "조회 중..." : "주문 조회하기"}
        </button>
      </form>

      {error ? (
        <p className="mt-4 rounded-[12px] bg-rose-50 px-4 py-3 text-[13px] font-medium text-rose-600">
          {error}
        </p>
      ) : null}

      {orders ? (
        orders.length === 0 ? (
          <div className="mt-8 rounded-[16px] border border-dashed border-[#E5E8EB] px-5 py-10 text-center">
            <PackageSearch className="mx-auto size-8 text-[#8B95A1]" />
            <p className="mt-3 text-[15px] font-semibold text-[#191F28]">
              조회된 주문이 없어요
            </p>
            <p className="mt-1 text-[13px] text-[#8B95A1]">
              주문할 때 입력한 휴대전화 또는 이메일을 확인해 주세요.
            </p>
          </div>
        ) : (
          <ul className="mt-8 space-y-3">
            {orders.map((order) => (
              <li
                key={order.orderId}
                className="rounded-[16px] border border-[#E5E8EB] bg-background px-5 py-4"
              >
                <p className="text-[12px] font-semibold text-[#8B95A1]">
                  주문번호 {order.orderNo}
                </p>
                <p className="mt-1 text-[15px] font-bold text-[#191F28]">
                  {order.productName}
                </p>
                <div className="mt-4">
                  <OrderShipmentSummary
                    statusLabel={order.statusLabel}
                    courier={order.courier}
                    invoiceNo={order.invoiceNo}
                  />
                </div>
              </li>
            ))}
          </ul>
        )
      ) : null}
    </div>
  );
}
