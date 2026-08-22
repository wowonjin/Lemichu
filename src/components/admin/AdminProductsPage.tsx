"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  ImagePlus,
  Loader2,
  PlusCircle,
  ShoppingBag,
  UploadCloud,
  X,
  XCircle,
} from "lucide-react";
import { AdminPageHeader, AdminShell } from "@/components/admin/AdminShell";
import { AdminNotice, EmptyAdminState } from "@/components/admin/AdminDashboard";
import { fetchAdminProducts } from "@/lib/admin";
import {
  createStoreProduct,
  deleteStoreProduct,
  toNaverProductInput,
  type CreateStoreProductInput,
  type NaverSyncInfo,
  type StoreProduct,
} from "@/lib/products";
import { storeCategoryOptions } from "@/data/homeCategories";
import { formatPriceWithUnit } from "@/lib/formatPrice";
import { cn } from "@/lib/cn";
import {
  deleteProductImageAssets,
  uploadProductImage,
  type ProductImageAsset,
} from "@/lib/product-images";

type FormState = {
  name: string;
  brand: string;
  size: string;
  salePrice: string;
  retailPrice: string;
  stockQuantity: string;
  detailContent: string;
  leafCategoryId: string;
  originAreaCode: string;
  deliveryFee: string;
  afterServiceTelephoneNumber: string;
  afterServiceGuideContent: string;
  storeCategoryId: string;
};

type UploadTarget = "local" | "smartstore" | "both";

const emptyForm: FormState = {
  name: "",
  brand: "",
  size: "",
  salePrice: "",
  retailPrice: "",
  stockQuantity: "1",
  detailContent: "",
  leafCategoryId: "",
  originAreaCode: "",
  deliveryFee: "0",
  afterServiceTelephoneNumber: "",
  afterServiceGuideContent: "",
  storeCategoryId: "",
};

const maxOptionalImages = 8;
const productDraftStorageKey = "lemichu-admin-product-draft";

const uploadTargetOptions: Array<{
  value: UploadTarget;
  label: string;
  description: string;
}> = [
  {
    value: "local",
    label: "자사몰 업로드",
    description: "LEMICHU 쇼핑몰에만 상품을 저장합니다.",
  },
  {
    value: "smartstore",
    label: "스마트스토어 업로드",
    description: "네이버 스마트스토어에만 상품을 등록합니다.",
  },
  {
    value: "both",
    label: "자사몰+스마트스토어 업로드",
    description: "자사몰 저장 후 스마트스토어에도 함께 등록합니다.",
  },
];

function requiresSmartstoreUpload(target: UploadTarget) {
  return target === "smartstore" || target === "both";
}

function requiresLocalUpload(target: UploadTarget) {
  return target === "local" || target === "both";
}

export function AdminProductsPage() {
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProducts();

    const params = new URLSearchParams(window.location.search);
    const created = params.get("created");
    if (created === "both") {
      setSuccess("상품이 우리 쇼핑몰과 네이버 스마트스토어에 동시 등록되었습니다.");
    } else if (created === "smartstore") {
      setSuccess("상품이 네이버 스마트스토어에 등록되었습니다. (자사몰 저장 생략)");
    } else if (created === "local") {
      setSuccess("상품이 우리 쇼핑몰에 저장되었습니다. (네이버 등록 생략)");
    }

    if (created) {
      params.delete("created");
      const query = params.toString();
      window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
    }
  }, []);

  async function loadProducts() {
    setIsLoading(true);
    try {
      setProducts(await fetchAdminProducts());
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "상품 목록을 불러오지 못했어요."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AdminShell>
      <AdminPageHeader
        title="상품 관리"
        actions={
          <Link
            href="/admin/products/new"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <PlusCircle className="size-4" />
            신규 상품 등록
          </Link>
        }
      />

      {error ? <AdminNotice message={error} /> : null}
      {success ? (
        <div className="mb-6 border-l-2 border-emerald-400 bg-emerald-50/60 px-4 py-3 text-sm font-medium text-emerald-700">
          {success}
        </div>
      ) : null}

      <section>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-foreground">등록된 상품</h3>
          <span className="text-xs font-semibold text-muted-foreground">{products.length}개</span>
        </div>

        <div className="mt-4 divide-y divide-border">
          {isLoading ? (
            <EmptyAdminState text="상품 목록을 불러오는 중입니다." />
          ) : products.length === 0 ? (
            <EmptyAdminState text="아직 등록된 상품이 없습니다." />
          ) : (
            products.map((product) => (
              <ProductRow
                key={product.id}
                product={product}
                onDeleted={(id) => setProducts((current) => current.filter((item) => item.id !== id))}
                onError={setError}
              />
            ))
          )}
        </div>
      </section>
    </AdminShell>
  );
}

export function AdminProductCreatePage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [representativeImageFile, setRepresentativeImageFile] = useState<File | null>(null);
  const [optionalImageFiles, setOptionalImageFiles] = useState<File[]>([]);
  const [uploadTarget, setUploadTarget] = useState<UploadTarget>("both");
  const [naverConfigured, setNaverConfigured] = useState<boolean | null>(null);
  const [error, setError] = useState("");
  const [draftMessage, setDraftMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreOwned, setIsPreOwned] = useState(false);
  const [todayShip, setTodayShip] = useState(false);

  useEffect(() => {
    const savedDraft = window.localStorage.getItem(productDraftStorageKey);
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft) as {
          form?: Partial<FormState>;
          syncToNaver?: boolean;
          uploadTarget?: UploadTarget;
        };
        setForm({ ...emptyForm, ...draft.form });
        if (draft.uploadTarget) {
          setUploadTarget(draft.uploadTarget);
        } else if (typeof draft.syncToNaver === "boolean") {
          setUploadTarget(draft.syncToNaver ? "both" : "local");
        }
        setDraftMessage("임시 저장된 내용을 불러왔습니다. 이미지는 다시 선택해주세요.");
      } catch {
        window.localStorage.removeItem(productDraftStorageKey);
      }
    }

    fetch("/api/naver/products")
      .then((res) => res.json())
      .then((data) => setNaverConfigured(Boolean(data?.configured)))
      .catch(() => setNaverConfigured(false));
  }, []);

  const update = (key: keyof FormState) => (value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  function buildInput({
    representativeImage,
    optionalImages,
  }: {
    representativeImage: ProductImageAsset;
    optionalImages: ProductImageAsset[];
  }): CreateStoreProductInput {
    return {
      name: form.name.trim(),
      brand: form.brand.trim(),
      size: form.size.trim() || undefined,
      salePrice: Number(form.salePrice) || 0,
      retailPrice: form.retailPrice ? Number(form.retailPrice) : undefined,
      stockQuantity: Number(form.stockQuantity) || 0,
      representativeImageUrl: representativeImage.original.url,
      optionalImageUrls: optionalImages.map((image) => image.original.url),
      representativeImage,
      optionalImages,
      detailContent: form.detailContent.trim(),
      leafCategoryId: form.leafCategoryId.trim(),
      originAreaCode: form.originAreaCode.trim(),
      deliveryFee: Number(form.deliveryFee) || 0,
      afterServiceTelephoneNumber: form.afterServiceTelephoneNumber.trim(),
      afterServiceGuideContent: form.afterServiceGuideContent.trim(),
      storeCategoryId: form.storeCategoryId || undefined,
      isPreOwned,
      todayShip,
    };
  }

  function validate(): string | null {
    if (!form.name.trim()) return "상품명을 입력해주세요.";
    if (!form.brand.trim()) return "브랜드를 입력해주세요.";
    if ((Number(form.salePrice) || 0) <= 0) return "판매가를 올바르게 입력해주세요.";
    if ((Number(form.stockQuantity) || 0) <= 0) return "재고 수량을 1 이상 입력해주세요.";
    if (!representativeImageFile) return "대표 이미지를 업로드해주세요.";
    if (requiresSmartstoreUpload(uploadTarget)) {
      const targetLabel =
        uploadTarget === "smartstore" ? "스마트스토어 업로드" : "자사몰+스마트스토어 업로드";
      if (!form.leafCategoryId.trim()) return `${targetLabel} 시 카테고리 ID는 필수입니다.`;
      if (!form.originAreaCode.trim()) return `${targetLabel} 시 원산지 코드는 필수입니다.`;
      if (!form.detailContent.trim()) return `${targetLabel} 시 상세 설명은 필수입니다.`;
      if (!form.afterServiceTelephoneNumber.trim()) return `${targetLabel} 시 A/S 전화번호는 필수입니다.`;
      if (!form.afterServiceGuideContent.trim()) return `${targetLabel} 시 A/S 안내는 필수입니다.`;
    }
    return null;
  }

  function handleDraftSave() {
    window.localStorage.setItem(
      productDraftStorageKey,
      JSON.stringify({
        form,
        uploadTarget,
        savedAt: new Date().toISOString(),
      })
    );
    setDraftMessage("입력한 내용을 임시 저장했습니다. 이미지는 보안상 다시 선택해야 합니다.");
    setError("");
  }

  function handleRepresentativeImageAdded(files: File[]) {
    if (files.length > 0) setRepresentativeImageFile(files[0]);
  }

  function handleOptionalImagesAdded(files: File[]) {
    setOptionalImageFiles((current) =>
      [...current, ...files].slice(0, maxOptionalImages)
    );
  }

  function handleOptionalImageRemove(index: number) {
    setOptionalImageFiles((current) => current.filter((_, i) => i !== index));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    const selectedRepresentativeImageFile = representativeImageFile;
    if (!selectedRepresentativeImageFile) return;

    setIsSubmitting(true);
    let uploadedImages: ProductImageAsset[] = [];
    let naverWasCreated = false;
    try {
      let naverSync: NaverSyncInfo = { status: "skipped" };
      const imageDirectory = `products/${Date.now()}-${crypto.randomUUID()}`;
      const imageAlt = `${form.brand.trim()} ${form.name.trim()}`.trim();
      const representativeImage = await uploadProductImage({
        file: selectedRepresentativeImageFile,
        directory: imageDirectory,
        alt: imageAlt,
        index: 0,
      });
      const optionalImages = await Promise.all(
        optionalImageFiles.map((file, index) =>
          uploadProductImage({
            file,
            directory: `${imageDirectory}/optional`,
            alt: `${imageAlt} 추가 이미지 ${index + 1}`,
            index,
          })
        )
      );
      uploadedImages = [representativeImage, ...optionalImages];
      const input = buildInput({ representativeImage, optionalImages });

      if (requiresSmartstoreUpload(uploadTarget)) {
        const response = await fetch("/api/naver/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(toNaverProductInput(input)),
        });
        const data = await response.json();

        if (!response.ok || !data.ok) {
          // 네이버 등록 실패 시 로컬 저장도 중단하여 반쪽 상태를 방지합니다.
          await deleteProductImageAssets(uploadedImages);
          setError(
            `네이버 스마트스토어 등록 실패: ${data?.message ?? `HTTP ${response.status}`}`
          );
          setIsSubmitting(false);
          return;
        }

        naverSync = {
          status: "synced",
          originProductNo: data.originProductNo,
          channelProductNo: data.channelProductNo,
          syncedAt: new Date().toISOString(),
        };
        naverWasCreated = true;
      }

      if (requiresLocalUpload(uploadTarget)) {
        await createStoreProduct(input, naverSync);
      }

      setForm(emptyForm);
      setRepresentativeImageFile(null);
      setOptionalImageFiles([]);
      setIsPreOwned(false);
      setTodayShip(false);
      window.localStorage.removeItem(productDraftStorageKey);
      router.push(`/admin/products?created=${uploadTarget}`);
    } catch (submitError) {
      if (!naverWasCreated) {
        await deleteProductImageAssets(uploadedImages);
      }
      setError(
        submitError instanceof Error ? submitError.message : "상품 저장 중 오류가 발생했습니다."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const naverBanner = useMemo(() => {
    if (naverConfigured === null || naverConfigured) return null;
    return (
      <div className="mb-6 border-l-2 border-amber-400 bg-amber-50/60 px-4 py-3 text-sm text-amber-700">
        네이버 커머스 API 환경변수(NAVER_COMMERCE_CLIENT_ID / SECRET)가 설정되지 않았습니다. 동시
        등록을 사용하려면 .env.local에 값을 추가하고 서버를 재시작해주세요. 현재는 우리 쇼핑몰
        저장만 가능합니다.
      </div>
    );
  }, [naverConfigured]);

  return (
    <AdminShell>
      <AdminPageHeader
        title="상품 등록"
        actions={
          <Link
            href="/admin/products"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
          >
            <ArrowLeft className="size-4" />
            목록으로
          </Link>
        }
      />

      {naverBanner}
      {error ? <AdminNotice message={error} /> : null}
      {draftMessage ? (
        <div className="mb-6 border-l-2 border-gold bg-gold-soft/50 px-4 py-3 text-sm font-medium text-foreground">
          {draftMessage}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
        <FormSection
          title="업로드 대상"
          description="상품을 등록할 위치를 선택하세요."
        >
          <div className="grid gap-3 md:grid-cols-3">
            {uploadTargetOptions.map((option) => {
              const selected = uploadTarget === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => {
                    setUploadTarget(option.value);
                    setError("");
                  }}
                  className={cn(
                    "rounded-lg border p-4 text-left transition-colors disabled:opacity-60",
                    selected
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-secondary/40 text-foreground hover:border-muted-foreground"
                  )}
                >
                  <span className="block text-sm font-semibold">{option.label}</span>
                  <span
                    className={cn(
                      "mt-1 block text-xs leading-5",
                      selected ? "text-background/70" : "text-muted-foreground"
                    )}
                  >
                    {option.description}
                  </span>
                </button>
              );
            })}
          </div>
        </FormSection>

        <FormSection
          title="기본 정보"
          description="쇼핑몰 목록과 상세 페이지에 노출되는 핵심 정보입니다."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="상품명" required className="sm:col-span-2">
              <Input value={form.name} onChange={update("name")} placeholder="샤넬 클래식 플랩백" />
            </Field>
            <Field label="브랜드" required>
              <Input value={form.brand} onChange={update("brand")} placeholder="샤넬" />
            </Field>
            <Field label="사이즈">
              <Input value={form.size} onChange={update("size")} placeholder="미디움 / 36 / 단일 사이즈" />
            </Field>
            <Field label="재고 수량" required>
              <Input value={form.stockQuantity} onChange={update("stockQuantity")} type="number" />
            </Field>
            <Field label="판매가 (원)" required>
              <Input value={form.salePrice} onChange={update("salePrice")} type="number" />
            </Field>
            <Field label="정가 (원, 선택)">
              <Input value={form.retailPrice} onChange={update("retailPrice")} type="number" />
            </Field>
            <Field label="진열 카테고리">
              <select
                value={form.storeCategoryId}
                onChange={(event) => update("storeCategoryId")(event.target.value)}
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-gold"
              >
                <option value="">상품명으로 자동 분류</option>
                {storeCategoryOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <div className="flex flex-col justify-end gap-2 sm:col-span-2">
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={isPreOwned}
                  onChange={(event) => setIsPreOwned(event.target.checked)}
                />
                중고명품으로 진열
              </label>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={todayShip}
                  onChange={(event) => setTodayShip(event.target.checked)}
                />
                오늘출고로 진열
              </label>
            </div>
          </div>
        </FormSection>

        <FormSection
          title="상품 이미지"
          description="이미지를 박스에 끌어다 놓거나, 박스를 클릭해 파일을 선택할 수 있습니다."
        >
          <div className="space-y-5">
            <Field label="대표 이미지" required>
              <ImageDropzone
                files={representativeImageFile ? [representativeImageFile] : []}
                onFilesAdded={handleRepresentativeImageAdded}
                onFileRemove={() => setRepresentativeImageFile(null)}
                disabled={isSubmitting}
                emptyTitle="대표 이미지를 끌어다 놓거나 클릭해서 선택하세요"
                emptyHint="목록용 썸네일과 상세용 이미지를 자동 생성합니다. (JPEG, PNG, WebP, AVIF)"
              />
            </Field>
            <Field label={`추가 이미지 (최대 ${maxOptionalImages}장)`}>
              <ImageDropzone
                files={optionalImageFiles}
                onFilesAdded={handleOptionalImagesAdded}
                onFileRemove={handleOptionalImageRemove}
                disabled={isSubmitting || optionalImageFiles.length >= maxOptionalImages}
                multiple
                maxFiles={maxOptionalImages}
                emptyTitle="추가 이미지를 끌어다 놓거나 클릭해서 선택하세요"
                emptyHint="상세 갤러리에 사용할 이미지를 여러 장 넣을 수 있습니다."
              />
            </Field>
          </div>
        </FormSection>

        <FormSection
          title="네이버 스마트스토어 등록 정보"
          description={
            requiresSmartstoreUpload(uploadTarget)
              ? "스마트스토어 업로드에 필요한 필수 정보입니다."
              : "자사몰 업로드만 선택하면 입력하지 않아도 됩니다."
          }
        >
          <div
            className={cn(
              "grid gap-4 sm:grid-cols-2 transition-opacity",
              !requiresSmartstoreUpload(uploadTarget) && "opacity-50"
            )}
          >
            <Field label="카테고리 ID (leafCategoryId)" required={requiresSmartstoreUpload(uploadTarget)}>
              <Input
                value={form.leafCategoryId}
                onChange={update("leafCategoryId")}
                placeholder="50000837"
              />
            </Field>
            <Field label="원산지 코드 (originAreaCode)" required={requiresSmartstoreUpload(uploadTarget)}>
              <Input
                value={form.originAreaCode}
                onChange={update("originAreaCode")}
                placeholder="0200037"
              />
            </Field>
            <Field label="배송비 (원, 0=무료)">
              <Input value={form.deliveryFee} onChange={update("deliveryFee")} type="number" />
            </Field>
            <Field label="A/S 전화번호" required={requiresSmartstoreUpload(uploadTarget)}>
              <Input
                value={form.afterServiceTelephoneNumber}
                onChange={update("afterServiceTelephoneNumber")}
                placeholder="1600-0000"
              />
            </Field>
            <Field label="A/S 안내" required={requiresSmartstoreUpload(uploadTarget)} className="sm:col-span-2">
              <Input
                value={form.afterServiceGuideContent}
                onChange={update("afterServiceGuideContent")}
                placeholder="평일 10:00~18:00 고객센터 운영"
              />
            </Field>
            <Field label="상품 상세 설명 (HTML 가능)" required={requiresSmartstoreUpload(uploadTarget)} className="sm:col-span-2">
              <Textarea
                value={form.detailContent}
                onChange={update("detailContent")}
                rows={4}
                placeholder="<p>정품 보장, 검수 완료된 상품입니다.</p>"
              />
            </Field>
          </div>
        </FormSection>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleDraftSave}
            className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-background px-6 text-sm font-semibold text-foreground transition-colors hover:bg-secondary disabled:opacity-60"
          >
            임시 저장
          </button>
          <Link
            href="/admin/products"
            className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-background px-6 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
          >
            취소
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-8 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <ShoppingBag className="size-4" />}
            {isSubmitting ? "이미지 업로드 및 등록 중..." : "상품 등록"}
          </button>
        </div>
      </form>
    </AdminShell>
  );
}

function ProductRow({
  product,
  onDeleted,
  onError,
}: {
  product: StoreProduct;
  onDeleted: (id: string) => void;
  onError: (message: string) => void;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const imageUrl = product.representativeImage?.thumbnail.url ?? product.representativeImageUrl;
  const imageAlt = product.representativeImage?.alt ?? product.name;

  async function handleDelete() {
    if (!window.confirm(`‘${product.brand} ${product.name}’ 상품을 삭제할까요?`)) return;
    setIsDeleting(true);
    try {
      const assets = [
        product.representativeImage,
        ...(product.optionalImages ?? []),
      ].filter((asset): asset is ProductImageAsset => Boolean(asset));
      await deleteStoreProduct(product);
      await deleteProductImageAssets(assets);
      onDeleted(product.id);
    } catch (deleteError) {
      onError(deleteError instanceof Error ? deleteError.message : "상품을 삭제하지 못했어요.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt={imageAlt}
        width={48}
        height={48}
        loading="lazy"
        className="size-12 shrink-0 rounded-md object-cover"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">
          {product.brand} {product.name}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {formatPriceWithUnit(product.salePrice)} · 재고 {product.stockQuantity}개
          {product.storeCategoryId
            ? ` · ${storeCategoryOptions.find((option) => option.id === product.storeCategoryId)?.label ?? product.storeCategoryId}`
            : ""}
        </p>
      </div>
      <NaverSyncBadge sync={product.naverSync} />
      <button
        type="button"
        disabled={isDeleting}
        onClick={() => void handleDelete()}
        className="inline-flex h-8 items-center rounded-md border border-border px-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-60"
      >
        {isDeleting ? "삭제 중" : "삭제"}
      </button>
    </div>
  );
}

function NaverSyncBadge({ sync }: { sync: NaverSyncInfo }) {
  if (sync.status === "synced") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
        <CheckCircle2 className="size-3.5" />
        네이버 연동
      </span>
    );
  }
  if (sync.status === "failed") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600">
        <XCircle className="size-3.5" />
        연동 실패
      </span>
    );
  }
  return <span className="text-xs font-semibold text-muted-foreground">로컬만</span>;
}

function FormSection({
  title,
  description,
  headerRight,
  children,
}: {
  title: string;
  description?: string;
  headerRight?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-background p-5 md:p-6">
      <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
        <div>
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          {description ? (
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {headerRight}
      </div>
      <div className="pt-5">{children}</div>
    </section>
  );
}

const acceptedImageTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const acceptedImageExtensions = /\.(jpe?g|png|webp|avif)$/i;

function isAcceptedImageFile(file: File) {
  if (file.type) return acceptedImageTypes.includes(file.type);
  // 일부 환경에서는 file.type이 비어 있으므로 확장자로도 판별한다.
  return acceptedImageExtensions.test(file.name);
}

function ImageDropzone({
  files,
  onFilesAdded,
  onFileRemove,
  disabled,
  multiple,
  maxFiles,
  emptyTitle,
  emptyHint,
}: {
  files: File[];
  onFilesAdded: (files: File[]) => void;
  onFileRemove: (index: number) => void;
  disabled?: boolean;
  multiple?: boolean;
  maxFiles?: number;
  emptyTitle: string;
  emptyHint: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [rejectMessage, setRejectMessage] = useState("");

  function acceptFiles(incoming: FileList | null) {
    if (!incoming || incoming.length === 0) return;
    const selected = Array.from(incoming);
    const imageFiles = selected.filter(isAcceptedImageFile);
    if (imageFiles.length === 0) {
      setRejectMessage("JPEG, PNG, WebP, AVIF 형식의 이미지 파일만 업로드할 수 있습니다.");
      return;
    }
    setRejectMessage("");
    onFilesAdded(multiple ? imageFiles : imageFiles.slice(0, 1));
  }

  function handleDrop(event: React.DragEvent) {
    event.preventDefault();
    setIsDragOver(false);
    if (disabled) return;
    acceptFiles(event.dataTransfer.files);
  }

  function openFilePicker(event?: React.SyntheticEvent) {
    // 부모 Field가 <label>이라 기본 동작을 막지 않으면 파일 대화상자가 중복으로 열린다.
    event?.preventDefault();
    event?.stopPropagation();
    if (!disabled) inputRef.current?.click();
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={acceptedImageTypes.join(",")}
        multiple={multiple}
        disabled={disabled}
        onClick={(event) => event.stopPropagation()}
        onChange={(event) => {
          acceptFiles(event.target.files);
          event.target.value = "";
        }}
        className="sr-only"
      />

      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={openFilePicker}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            openFilePicker(event);
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          "grid min-h-32 cursor-pointer place-items-center rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors",
          isDragOver
            ? "border-gold bg-gold-soft/40"
            : "border-border bg-secondary/40 hover:border-muted-foreground/40 hover:bg-secondary/70",
          disabled && "cursor-not-allowed opacity-60"
        )}
      >
        <div>
          <span className="mx-auto grid size-11 place-items-center rounded-full bg-background text-muted-foreground shadow-sm">
            {isDragOver ? <ImagePlus className="size-5" /> : <UploadCloud className="size-5" />}
          </span>
          <p className="mt-3 text-sm font-semibold text-foreground">{emptyTitle}</p>
          <p className="mt-1 text-xs text-muted-foreground">{emptyHint}</p>
          {maxFiles ? (
            <p className="mt-1 text-xs font-medium text-muted-foreground">
              {files.length}/{maxFiles}장 선택됨
            </p>
          ) : null}
        </div>
      </div>

      {rejectMessage ? (
        <p className="mt-2 text-xs font-medium text-rose-500">{rejectMessage}</p>
      ) : null}

      {files.length > 0 ? (
        <ul className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
          {files.map((file, index) => (
            <ImagePreviewItem
              key={`${file.name}-${file.size}-${index}`}
              file={file}
              disabled={disabled}
              onRemove={() => onFileRemove(index)}
            />
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function ImagePreviewItem({
  file,
  disabled,
  onRemove,
}: {
  file: File;
  disabled?: boolean;
  onRemove: () => void;
}) {
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <li className="group relative overflow-hidden rounded-lg border border-border bg-secondary">
      {previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previewUrl}
          alt={file.name}
          className="aspect-square w-full object-cover"
        />
      ) : (
        <div className="aspect-square w-full" />
      )}
      <button
        type="button"
        disabled={disabled}
        onClick={(event) => {
          event.stopPropagation();
          onRemove();
        }}
        aria-label={`${file.name} 삭제`}
        className="absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-full bg-foreground/70 text-background opacity-0 transition-opacity hover:bg-foreground focus-visible:opacity-100 group-hover:opacity-100 disabled:hidden"
      >
        <X className="size-3.5" />
      </button>
      <p className="truncate px-2 py-1.5 text-[11px] font-medium text-muted-foreground">
        {file.name} · {(file.size / 1024 / 1024).toFixed(2)}MB
      </p>
    </li>
  );
}

function Field({
  label,
  required,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
        {label}
        {required ? <span className="ml-0.5 text-rose-500">*</span> : null}
      </span>
      {children}
    </label>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-gold placeholder:text-muted-foreground"
    />
  );
}

function Textarea({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-gold placeholder:text-muted-foreground"
    />
  );
}
