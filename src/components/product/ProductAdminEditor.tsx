"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2, Pencil, X } from "lucide-react";
import {
  getFirebaseIdToken,
  isAdminUser,
  observeAuthUser,
  type AuthUser,
} from "@/lib/auth";
import { cn } from "@/lib/cn";
import type { Product } from "@/types/product";

type FormState = {
  brand: string;
  name: string;
  salePrice: string;
  retailPrice: string;
  color: string;
  size: string;
  detailContent: string;
};

function toFormState(product: Product): FormState {
  return {
    brand: product.brand,
    name: product.name,
    salePrice: String(product.basePrice ?? product.price),
    retailPrice: product.retailPrice ? String(product.retailPrice) : "",
    color: product.color ?? "",
    size: product.size ?? "",
    detailContent: product.detailContent ?? "",
  };
}

export function ProductAdminEditor({ product }: { product: Product }) {
  const router = useRouter();
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(() => toFormState(product));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => observeAuthUser(setAuthUser), []);

  useEffect(() => {
    setForm(toFormState(product));
  }, [product]);

  if (!isAdminUser(authUser)) return null;

  const update = (field: keyof FormState) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
      setSaved(false);
    };

  const save = async () => {
    setError("");
    setSaved(false);

    const salePrice = Number(form.salePrice.replaceAll(",", ""));
    if (!Number.isFinite(salePrice) || salePrice < 0) {
      setError("판매가를 올바른 숫자로 입력해주세요.");
      return;
    }

    const retailPriceRaw = form.retailPrice.replaceAll(",", "").trim();
    const retailPrice = retailPriceRaw ? Number(retailPriceRaw) : null;
    if (retailPrice !== null && (!Number.isFinite(retailPrice) || retailPrice < 0)) {
      setError("정가를 올바른 숫자로 입력해주세요.");
      return;
    }

    if (!form.name.trim() || !form.brand.trim()) {
      setError("브랜드와 상품명은 비울 수 없어요.");
      return;
    }

    setSaving(true);
    try {
      const token = await getFirebaseIdToken();
      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(authUser?.email ? { "x-admin-email": authUser.email } : {}),
        },
        body: JSON.stringify({
          brand: form.brand,
          name: form.name,
          salePrice,
          retailPrice,
          color: form.color,
          size: form.size,
          detailContent: form.detailContent,
        }),
      });

      const result = (await response.json()) as { ok?: boolean; message?: string };
      if (!response.ok || !result.ok) {
        throw new Error(result.message ?? "저장에 실패했어요.");
      }

      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장 중 오류가 발생했어요.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-32 right-4 z-50 inline-flex h-11 items-center gap-1.5 rounded-md bg-foreground px-5 text-[13px] font-semibold text-background shadow-lg transition-colors hover:bg-foreground/90 md:bottom-6 md:right-6"
      >
        <Pencil className="size-3.5" />
        상품 수정
      </button>

      <AnimatePresence>
        {open ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[70] bg-foreground/30"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              role="dialog"
              aria-label="상품 정보 수정"
              className="fixed inset-y-0 right-0 z-[71] flex w-full max-w-[420px] flex-col bg-background shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-[#EEEEEE] px-5 py-4 dark:border-border">
                <div>
                  <p className="text-[15px] font-bold tracking-tight text-foreground">
                    상품 정보 수정
                  </p>
                  <p className="mt-0.5 text-xs text-[#8B8B8B] dark:text-muted-foreground">
                    저장하면 페이지에 바로 반영돼요.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="닫기"
                  className="grid size-9 place-items-center rounded-md text-foreground transition-colors hover:bg-[#F7F7F7] dark:hover:bg-muted"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
                <Field label="브랜드">
                  <input
                    value={form.brand}
                    onChange={update("brand")}
                    className={inputClassName}
                  />
                </Field>
                <Field label="상품명">
                  <input
                    value={form.name}
                    onChange={update("name")}
                    className={inputClassName}
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="판매가 (원)">
                    <input
                      value={form.salePrice}
                      onChange={update("salePrice")}
                      inputMode="numeric"
                      className={cn(inputClassName, "tabular-nums")}
                    />
                  </Field>
                  <Field label="정가 (원, 선택)">
                    <input
                      value={form.retailPrice}
                      onChange={update("retailPrice")}
                      inputMode="numeric"
                      placeholder="없음"
                      className={cn(inputClassName, "tabular-nums")}
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="색상">
                    <input
                      value={form.color}
                      onChange={update("color")}
                      className={inputClassName}
                    />
                  </Field>
                  <Field label="사이즈">
                    <input
                      value={form.size}
                      onChange={update("size")}
                      className={inputClassName}
                    />
                  </Field>
                </div>
                <Field label="상세 설명 (HTML 가능)">
                  <textarea
                    value={form.detailContent}
                    onChange={update("detailContent")}
                    rows={8}
                    className={cn(inputClassName, "min-h-[160px] resize-y leading-6")}
                  />
                </Field>
              </div>

              <div className="border-t border-[#EEEEEE] px-5 py-4 dark:border-border">
                {error ? (
                  <p className="mb-3 rounded-md bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-600 dark:bg-red-950/40 dark:text-red-400">
                    {error}
                  </p>
                ) : null}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={save}
                    disabled={saving}
                    className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-md bg-foreground text-[14px] font-semibold text-background transition-colors hover:bg-foreground/90 disabled:opacity-60"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        저장 중...
                      </>
                    ) : saved ? (
                      <>
                        <Check className="size-4" />
                        저장됨
                      </>
                    ) : (
                      "저장하기"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setForm(toFormState(product));
                      setError("");
                      setSaved(false);
                    }}
                    className="inline-flex h-12 items-center justify-center rounded-md bg-[#F7F7F7] px-5 text-[14px] font-semibold text-foreground transition-colors hover:bg-[#F0F0F0] dark:bg-muted dark:hover:bg-secondary"
                  >
                    되돌리기
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}

const inputClassName =
  "block w-full rounded-md border border-[#EBEBEB] bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-[#B0B0B0] focus:border-foreground dark:border-border dark:placeholder:text-muted-foreground";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-[#8B8B8B] dark:text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
