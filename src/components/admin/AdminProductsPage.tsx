"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ImagePlus,
  Loader2,
  PlusCircle,
  RotateCcw,
  Search,
  ShoppingBag,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { AdminNotice, EmptyAdminState } from "@/components/admin/AdminDashboard";
import { fetchAdminProducts } from "@/lib/admin";
import {
  createStoreProduct,
  deleteStoreProduct,
  updateStoreProduct,
  type CreateStoreProductInput,
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
import { isConditionGrade, type ConditionGrade } from "@/types/product";

type FormState = {
  name: string;
  brand: string;
  color: string;
  size: string;
  salePrice: string;
  retailPrice: string;
  stockQuantity: string;
  storeCategoryId: string;
  condition: string;
  detailContent: string;
};

const emptyForm: FormState = {
  name: "",
  brand: "",
  color: "",
  size: "",
  salePrice: "",
  retailPrice: "",
  stockQuantity: "1",
  storeCategoryId: "",
  condition: "A",
  detailContent: "",
};

const maxOptionalImages = 8;
const productDraftStorageKey = "lemichu-admin-product-draft";
const conditionGradeOptions: Array<{ value: ConditionGrade; label: string }> = [
  { value: "NEW", label: "NEW · 새상품" },
  { value: "S", label: "S · 미사용에 가까움" },
  { value: "A", label: "A · 사용감이 적음" },
  { value: "B", label: "B · 사용감이 있음" },
];

function productToFormState(product: StoreProduct): FormState {
  return {
    name: product.name,
    brand: product.brand,
    color: product.color ?? "",
    size: product.size ?? "",
    salePrice: String(product.salePrice),
    retailPrice: product.retailPrice ? String(product.retailPrice) : "",
    stockQuantity: String(product.stockQuantity),
    storeCategoryId: product.storeCategoryId ?? "",
    condition: product.condition ?? "A",
    detailContent: product.detailContent ?? "",
  };
}

export function AdminProductsPage() {
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [conditionFilter, setConditionFilter] = useState("all");

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
    if (params.get("updated") === "1") {
      setSuccess("상품 정보가 수정되었습니다.");
    }

    if (created || params.has("updated")) {
      params.delete("created");
      params.delete("updated");
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

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return products.filter((product) => {
      const soldOut = product.availability === "sold" || product.stockQuantity <= 0;
      const matchesQuery =
        !normalizedQuery ||
        [product.name, product.brand, product.color, product.size, product.id].some((value) =>
          String(value ?? "").toLowerCase().includes(normalizedQuery)
        );
      const matchesCategory =
        categoryFilter === "all" || product.storeCategoryId === categoryFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "selling" ? !soldOut : soldOut);
      const matchesCondition =
        conditionFilter === "all" || product.condition === conditionFilter;

      return matchesQuery && matchesCategory && matchesStatus && matchesCondition;
    });
  }, [categoryFilter, conditionFilter, products, query, statusFilter]);

  const hasFilters =
    Boolean(query.trim()) ||
    categoryFilter !== "all" ||
    statusFilter !== "all" ||
    conditionFilter !== "all";

  function resetFilters() {
    setQuery("");
    setCategoryFilter("all");
    setStatusFilter("all");
    setConditionFilter("all");
  }

  return (
    <div className="mx-auto w-full max-w-[1120px]">
      <AdminPageHeader
        title="상품 관리"
        actions={
          <Link
            href="/admin/products/new"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-[14px] bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <PlusCircle className="size-4" />
            신규 상품 등록
          </Link>
        }
      />

      {error ? <AdminNotice message={error} /> : null}
      {success ? (
        <div className="mb-6 rounded-[14px] bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
          {success}
        </div>
      ) : null}

      <section>
        <div className="mb-4 grid gap-2 md:grid-cols-[minmax(240px,1fr)_160px_140px_140px]">
          <label className="flex h-11 items-center gap-2 rounded-md bg-secondary px-3.5">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="상품명, 브랜드, 색상, 상품번호 검색"
              className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </label>
          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            aria-label="카테고리 필터"
            className="h-11 rounded-md bg-secondary px-3 text-sm font-medium text-foreground outline-none"
          >
            <option value="all">전체 카테고리</option>
            {storeCategoryOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="판매 상태 필터"
            className="h-11 rounded-md bg-secondary px-3 text-sm font-medium text-foreground outline-none"
          >
            <option value="all">전체 상태</option>
            <option value="selling">판매 중</option>
            <option value="soldout">품절</option>
          </select>
          <select
            value={conditionFilter}
            onChange={(event) => setConditionFilter(event.target.value)}
            aria-label="중고 등급 필터"
            className="h-11 rounded-md bg-secondary px-3 text-sm font-medium text-foreground outline-none"
          >
            <option value="all">전체 등급</option>
            {conditionGradeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.value} 등급
              </option>
            ))}
          </select>
        </div>

        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-xs font-medium text-muted-foreground">
            {filteredProducts.length}개 상품
          </p>
          {hasFilters ? (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex h-8 items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              <RotateCcw className="size-3.5" />
              필터 초기화
            </button>
          ) : null}
        </div>

        <div className="divide-y divide-border border-y border-border">
          {isLoading ? (
            <EmptyAdminState text="상품 목록을 불러오는 중입니다." />
          ) : products.length === 0 ? (
            <EmptyAdminState text="아직 등록된 상품이 없습니다." />
          ) : filteredProducts.length === 0 ? (
            <EmptyAdminState text="조건에 맞는 상품이 없습니다." />
          ) : (
            filteredProducts.map((product) => (
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
    </div>
  );
}

export function AdminProductCreatePage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [representativeImageFile, setRepresentativeImageFile] = useState<File | null>(null);
  const [optionalImageFiles, setOptionalImageFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [draftMessage, setDraftMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreOwned, setIsPreOwned] = useState(true);
  const [todayShip, setTodayShip] = useState(false);

  useEffect(() => {
    const savedDraft = window.localStorage.getItem(productDraftStorageKey);
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft) as {
          form?: Partial<FormState>;
          isPreOwned?: boolean;
          todayShip?: boolean;
        };
        setForm({ ...emptyForm, ...draft.form });
        setIsPreOwned(Boolean(draft.isPreOwned));
        setTodayShip(Boolean(draft.todayShip));
        setDraftMessage("임시 저장된 내용을 불러왔습니다. 이미지는 다시 선택해주세요.");
      } catch {
        window.localStorage.removeItem(productDraftStorageKey);
      }
    }
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
      color: form.color.trim() || undefined,
      size: form.size.trim() || undefined,
      salePrice: Number(form.salePrice) || 0,
      retailPrice: form.retailPrice ? Number(form.retailPrice) : undefined,
      stockQuantity: Number(form.stockQuantity) || 0,
      representativeImageUrl: representativeImage.original.url,
      optionalImageUrls: optionalImages.map((image) => image.original.url),
      representativeImage,
      optionalImages,
      detailContent: form.detailContent.trim(),
      leafCategoryId: "",
      originAreaCode: "",
      deliveryFee: 0,
      afterServiceTelephoneNumber: "",
      afterServiceGuideContent: "",
      storeCategoryId: form.storeCategoryId || undefined,
      isPreOwned,
      condition:
        isPreOwned && isConditionGrade(form.condition) ? form.condition : undefined,
      todayShip,
    };
  }

  function validate(): string | null {
    if (!form.name.trim()) return "상품명을 입력해주세요.";
    if (!form.brand.trim()) return "브랜드를 입력해주세요.";
    if ((Number(form.salePrice) || 0) <= 0) return "판매가를 올바르게 입력해주세요.";
    if ((Number(form.stockQuantity) || 0) <= 0) return "재고 수량을 1 이상 입력해주세요.";
    if (!representativeImageFile) return "대표 이미지를 업로드해주세요.";
    return null;
  }

  function handleDraftSave() {
    window.localStorage.setItem(
      productDraftStorageKey,
      JSON.stringify({
        form,
        isPreOwned,
        todayShip,
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
    try {
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

      await createStoreProduct(input, { status: "skipped" });

      setForm(emptyForm);
      setRepresentativeImageFile(null);
      setOptionalImageFiles([]);
      setIsPreOwned(true);
      setTodayShip(false);
      window.localStorage.removeItem(productDraftStorageKey);
      router.push("/admin/products?created=local");
    } catch (submitError) {
      await deleteProductImageAssets(uploadedImages);
      setError(
        submitError instanceof Error ? submitError.message : "상품 저장 중 오류가 발생했습니다."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <AdminPageHeader
        title="상품 등록"
        actions={
          <Link
            href="/admin/products"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-[12px] border border-border bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
          >
            <ArrowLeft className="size-4" />
            목록으로
          </Link>
        }
      />

      {error ? <AdminNotice message={error} /> : null}
      {draftMessage ? (
        <div className="mb-6 border-l-2 border-gold bg-gold-soft/50 px-4 py-3 text-sm font-medium text-foreground">
          {draftMessage}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="w-full space-y-10">
        <section className="space-y-6">
          <div className="grid gap-x-5 gap-y-6 sm:grid-cols-2">
            <InfoRow label="상품명" required>
              <Input value={form.name} onChange={update("name")} placeholder="상품명" />
            </InfoRow>
            <InfoRow label="진열 카테고리">
              <select
                value={form.storeCategoryId}
                onChange={(event) => update("storeCategoryId")(event.target.value)}
                className="h-12 w-full appearance-none rounded-[14px] bg-[#f2f4f6] px-4 text-sm font-medium text-foreground outline-none transition-all focus:bg-[#eef0f2] focus:ring-2 focus:ring-foreground/10 dark:bg-secondary dark:focus:bg-secondary"
              >
                <option value="">상품명으로 자동 분류</option>
                {storeCategoryOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </InfoRow>
            <InfoRow label="브랜드" required>
              <Input value={form.brand} onChange={update("brand")} placeholder="브랜드" />
            </InfoRow>
            <InfoRow label="색상">
              <Input value={form.color} onChange={update("color")} placeholder="색상" />
            </InfoRow>
            <InfoRow label="사이즈">
              <Input value={form.size} onChange={update("size")} placeholder="사이즈" />
            </InfoRow>
            <InfoRow label="재고 수량" required>
              <Input value={form.stockQuantity} onChange={update("stockQuantity")} type="number" />
            </InfoRow>
            <InfoRow label="판매가" description="원" required>
              <Input value={form.salePrice} onChange={update("salePrice")} type="number" />
            </InfoRow>
            <InfoRow label="정가" description="선택 · 원">
              <Input value={form.retailPrice} onChange={update("retailPrice")} type="number" />
            </InfoRow>
            <InfoRow label="상품 상세 설명" className="sm:col-span-2">
              <textarea
                value={form.detailContent}
                onChange={(event) => update("detailContent")(event.target.value)}
                rows={7}
                placeholder="상품의 상태와 특징을 입력해주세요."
                className="min-h-40 w-full resize-y rounded-[14px] bg-[#f2f4f6] px-4 py-3 text-sm font-medium leading-6 text-foreground outline-none transition-all placeholder:text-muted-foreground focus:bg-[#eef0f2] focus:ring-2 focus:ring-foreground/10 dark:bg-secondary dark:focus:bg-secondary"
              />
            </InfoRow>
          </div>

          <div className="space-y-1">
            <InfoToggle
              label="중고명품으로 진열"
              hint="메인과 상품 목록에는 중고명품으로 진열한 상품만 나와요."
              checked={isPreOwned}
              onChange={setIsPreOwned}
            />
            {isPreOwned ? (
              <div className="flex items-center justify-between gap-4 py-2.5">
                <label htmlFor="product-condition" className="text-sm font-semibold text-foreground">
                  상품 상태 등급
                </label>
                <select
                  id="product-condition"
                  value={form.condition}
                  onChange={(event) => update("condition")(event.target.value)}
                  className="h-10 min-w-52 rounded-[12px] bg-[#f2f4f6] px-3 text-sm font-medium text-foreground outline-none transition-all focus:ring-2 focus:ring-foreground/10 dark:bg-secondary"
                >
                  {conditionGradeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            <InfoToggle
              label="오늘출고로 진열"
              checked={todayShip}
              onChange={setTodayShip}
            />
          </div>
        </section>

        <section className="space-y-5">
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
        </section>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleDraftSave}
            className="inline-flex h-11 items-center justify-center rounded-[12px] border border-border bg-background px-6 text-sm font-semibold text-foreground transition-colors hover:bg-secondary disabled:opacity-60"
          >
            임시 저장
          </button>
          <Link
            href="/admin/products"
            className="inline-flex h-11 items-center justify-center rounded-[12px] border border-border bg-background px-6 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
          >
            취소
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-[12px] bg-primary px-8 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <ShoppingBag className="size-4" />}
            {isSubmitting ? "이미지 업로드 및 등록 중..." : "상품 등록"}
          </button>
        </div>
      </form>
    </div>
  );
}

export function AdminProductEditPage({ productId }: { productId: string }) {
  const router = useRouter();
  const [product, setProduct] = useState<StoreProduct | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [representativeImageFile, setRepresentativeImageFile] = useState<File | null>(null);
  const [optionalImageFiles, setOptionalImageFiles] = useState<File[]>([]);
  const [isPreOwned, setIsPreOwned] = useState(false);
  const [todayShip, setTodayShip] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    void fetchAdminProducts()
      .then((products) => {
        if (cancelled) return;
        const matched = products.find((item) => item.id === productId);
        if (!matched) {
          setError("상품을 찾을 수 없습니다.");
          return;
        }
        setProduct(matched);
        setForm(productToFormState(matched));
        setIsPreOwned(Boolean(matched.isPreOwned));
        setTodayShip(Boolean(matched.todayShip));
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : "상품 정보를 불러오지 못했어요."
          );
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [productId]);

  const update = (key: keyof FormState) => (value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!product) return;
    setError("");

    if (!form.name.trim() || !form.brand.trim()) {
      setError("상품명과 브랜드를 입력해주세요.");
      return;
    }
    if ((Number(form.salePrice) || 0) <= 0) {
      setError("판매가를 올바르게 입력해주세요.");
      return;
    }
    if (!Number.isInteger(Number(form.stockQuantity)) || Number(form.stockQuantity) < 0) {
      setError("재고 수량을 0 이상의 정수로 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    const uploadedImages: ProductImageAsset[] = [];
    try {
      const imageDirectory = `products/${Date.now()}-${crypto.randomUUID()}`;
      const imageAlt = `${form.brand.trim()} ${form.name.trim()}`;
      const nextRepresentativeImage = representativeImageFile
        ? await uploadProductImage({
            file: representativeImageFile,
            directory: imageDirectory,
            alt: imageAlt,
            index: 0,
          })
        : null;
      if (nextRepresentativeImage) uploadedImages.push(nextRepresentativeImage);

      const nextOptionalImages =
        optionalImageFiles.length > 0
          ? await Promise.all(
              optionalImageFiles.map((file, index) =>
                uploadProductImage({
                  file,
                  directory: `${imageDirectory}/optional`,
                  alt: `${imageAlt} 추가 이미지 ${index + 1}`,
                  index,
                })
              )
            )
          : null;
      if (nextOptionalImages) uploadedImages.push(...nextOptionalImages);

      await updateStoreProduct(product.id, {
        name: form.name.trim(),
        brand: form.brand.trim(),
        color: form.color.trim(),
        size: form.size.trim(),
        salePrice: Number(form.salePrice),
        retailPrice: form.retailPrice ? Number(form.retailPrice) : null,
        stockQuantity: Number(form.stockQuantity),
        storeCategoryId: form.storeCategoryId,
        isPreOwned,
        condition:
          isPreOwned && isConditionGrade(form.condition) ? form.condition : undefined,
        todayShip,
        detailContent: form.detailContent.trim(),
        ...(nextRepresentativeImage
          ? {
              representativeImage: nextRepresentativeImage,
              representativeImageUrl: nextRepresentativeImage.original.url,
            }
          : {}),
        ...(nextOptionalImages
          ? {
              optionalImages: nextOptionalImages,
              optionalImageUrls: nextOptionalImages.map((image) => image.original.url),
            }
          : {}),
      });

      const oldImages = [
        ...(nextRepresentativeImage && product.representativeImage
          ? [product.representativeImage]
          : []),
        ...(nextOptionalImages ? product.optionalImages ?? [] : []),
      ];
      if (oldImages.length > 0) {
        await deleteProductImageAssets(oldImages).catch((cleanupError) => {
          console.error("[admin/products] failed to delete replaced images", cleanupError);
        });
      }

      router.push("/admin/products?updated=1");
    } catch (submitError) {
      if (uploadedImages.length > 0) {
        await deleteProductImageAssets(uploadedImages).catch(() => undefined);
      }
      setError(
        submitError instanceof Error ? submitError.message : "상품 수정 중 오류가 발생했습니다."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <EmptyAdminState text="상품 정보를 불러오는 중입니다." />;
  }

  if (!product) {
    return (
      <div className="mx-auto w-full max-w-3xl">
        <AdminPageHeader title="상품 수정" />
        <AdminNotice message={error || "상품을 찾을 수 없습니다."} />
      </div>
    );
  }

  const currentImages = [
    product.representativeImage?.medium?.url ?? product.representativeImageUrl,
    ...(product.optionalImages?.map((image) => image.thumbnail.url) ??
      product.optionalImageUrls ??
      []),
  ].filter(Boolean);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <AdminPageHeader
        title="상품 수정"
        actions={
          <Link
            href="/admin/products"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-[12px] border border-border bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
          >
            <ArrowLeft className="size-4" />
            목록으로
          </Link>
        }
      />

      {error ? <AdminNotice message={error} /> : null}

      <form onSubmit={handleSubmit} className="w-full space-y-10">
        <section className="space-y-6">
          <div className="grid gap-x-5 gap-y-6 sm:grid-cols-2">
            <InfoRow label="상품명" required className="sm:col-span-2">
              <Input value={form.name} onChange={update("name")} />
            </InfoRow>
            <InfoRow label="브랜드" required>
              <Input value={form.brand} onChange={update("brand")} />
            </InfoRow>
            <InfoRow label="색상">
              <Input value={form.color} onChange={update("color")} />
            </InfoRow>
            <InfoRow label="사이즈">
              <Input value={form.size} onChange={update("size")} />
            </InfoRow>
            <InfoRow label="재고 수량" required>
              <Input value={form.stockQuantity} onChange={update("stockQuantity")} type="number" />
            </InfoRow>
            <InfoRow label="판매가" description="원" required>
              <Input value={form.salePrice} onChange={update("salePrice")} type="number" />
            </InfoRow>
            <InfoRow label="정가" description="선택 · 원">
              <Input value={form.retailPrice} onChange={update("retailPrice")} type="number" />
            </InfoRow>
            <InfoRow label="진열 카테고리">
              <select
                value={form.storeCategoryId}
                onChange={(event) => update("storeCategoryId")(event.target.value)}
                className="h-12 w-full appearance-none rounded-[14px] bg-[#f2f4f6] px-4 text-sm font-medium text-foreground outline-none transition-all focus:bg-[#eef0f2] focus:ring-2 focus:ring-foreground/10 dark:bg-secondary dark:focus:bg-secondary"
              >
                <option value="">상품명으로 자동 분류</option>
                {storeCategoryOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </InfoRow>
            <InfoRow label="상품 상세 설명" className="sm:col-span-2">
              <textarea
                value={form.detailContent}
                onChange={(event) => update("detailContent")(event.target.value)}
                rows={7}
                className="min-h-40 w-full resize-y rounded-[14px] bg-[#f2f4f6] px-4 py-3 text-sm font-medium leading-6 text-foreground outline-none transition-all focus:bg-[#eef0f2] focus:ring-2 focus:ring-foreground/10 dark:bg-secondary dark:focus:bg-secondary"
              />
            </InfoRow>
          </div>

          <div className="space-y-1">
            <InfoToggle
              label="중고명품으로 진열"
              hint="메인과 상품 목록에는 중고명품으로 진열한 상품만 나와요."
              checked={isPreOwned}
              onChange={setIsPreOwned}
            />
            {isPreOwned ? (
              <div className="flex items-center justify-between gap-4 py-2.5">
                <label htmlFor="edit-product-condition" className="text-sm font-semibold text-foreground">
                  상품 상태 등급
                </label>
                <select
                  id="edit-product-condition"
                  value={form.condition}
                  onChange={(event) => update("condition")(event.target.value)}
                  className="h-10 min-w-52 rounded-[12px] bg-[#f2f4f6] px-3 text-sm font-medium text-foreground outline-none transition-all focus:ring-2 focus:ring-foreground/10 dark:bg-secondary"
                >
                  {conditionGradeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            <InfoToggle
              label="오늘출고로 진열"
              checked={todayShip}
              onChange={setTodayShip}
            />
          </div>
        </section>

        <section className="space-y-5">
          <div>
            <p className="mb-2 text-sm font-semibold text-foreground">현재 이미지</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {currentImages.map((url, index) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={`${url}-${index}`}
                  src={url}
                  alt={`${product.name} 이미지 ${index + 1}`}
                  className="size-24 shrink-0 rounded-md bg-secondary object-cover"
                />
              ))}
            </div>
          </div>
          <Field label="대표 이미지 교체 (선택)">
            <ImageDropzone
              files={representativeImageFile ? [representativeImageFile] : []}
              onFilesAdded={(files) => setRepresentativeImageFile(files[0] ?? null)}
              onFileRemove={() => setRepresentativeImageFile(null)}
              disabled={isSubmitting}
              emptyTitle="새 대표 이미지를 선택하세요"
              emptyHint="선택하지 않으면 현재 대표 이미지를 유지합니다."
            />
          </Field>
          <Field label={`추가 이미지 교체 (선택 · 최대 ${maxOptionalImages}장)`}>
            <ImageDropzone
              files={optionalImageFiles}
              onFilesAdded={(files) =>
                setOptionalImageFiles((current) =>
                  [...current, ...files].slice(0, maxOptionalImages)
                )
              }
              onFileRemove={(index) =>
                setOptionalImageFiles((current) => current.filter((_, i) => i !== index))
              }
              disabled={isSubmitting || optionalImageFiles.length >= maxOptionalImages}
              multiple
              maxFiles={maxOptionalImages}
              emptyTitle="교체할 추가 이미지를 선택하세요"
              emptyHint="선택하면 기존 추가 이미지 전체를 교체합니다."
            />
          </Field>
        </section>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <Link
            href="/admin/products"
            className="inline-flex h-11 items-center justify-center rounded-[12px] border border-border bg-background px-6 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
          >
            취소
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-[12px] bg-primary px-8 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
            {isSubmitting ? "저장 중..." : "변경사항 저장"}
          </button>
        </div>
      </form>
    </div>
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

  const categoryLabel = product.storeCategoryId
    ? storeCategoryOptions.find((option) => option.id === product.storeCategoryId)?.label ??
      product.storeCategoryId
    : "자동 분류";

  return (
    <div className="group flex items-center gap-3 transition-colors hover:bg-secondary/55">
      <Link
        href={`/admin/products/${product.id}`}
        className="flex min-w-0 flex-1 items-center px-2 py-4 sm:px-3"
      >
        <div className="flex min-w-0 flex-1 items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={imageAlt}
            width={64}
            height={64}
            loading="lazy"
            className="size-16 shrink-0 rounded-md bg-secondary object-cover sm:size-[72px]"
          />
          <div className="min-w-0">
            <p className="truncate text-[15px] font-bold text-foreground">
              {product.brand} {product.name}
            </p>
            <p className="mt-1.5 text-sm font-semibold tabular-nums text-foreground">
              {formatPriceWithUnit(product.salePrice)}
            </p>
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {categoryLabel}
              {product.size ? ` · ${product.size}` : ""}
            </p>
          </div>
        </div>
      </Link>
      <button
        type="button"
        disabled={isDeleting}
        onClick={() => void handleDelete()}
        aria-label={`${product.brand} ${product.name} 삭제`}
        className="mr-2 inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-md px-3 text-xs font-semibold text-muted-foreground transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:opacity-60 sm:mr-3"
      >
        {isDeleting ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
        {isDeleting ? "삭제 중" : "삭제"}
      </button>
    </div>
  );
}

function InfoRow({
  label,
  description,
  required,
  className,
  children,
}: {
  label: string;
  description?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-2 block text-sm font-semibold text-foreground">
        {label}
        {description ? (
          <span className="ml-2 text-xs font-normal text-muted-foreground">{description}</span>
        ) : null}
        {required ? <span className="ml-0.5 text-rose-500">*</span> : null}
      </span>
      {children}
    </label>
  );
}

function InfoToggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-foreground">{label}</span>
        {hint ? (
          <span className="mt-1 block text-xs font-normal text-muted-foreground">{hint}</span>
        ) : null}
      </span>
      <button
        type="button"
        role="switch"
        aria-label={label}
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-7 w-12 shrink-0 rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground",
          checked ? "bg-foreground" : "bg-border"
        )}
      >
        <span
          className={cn(
            "absolute top-1 size-5 rounded-full bg-background shadow-sm transition-transform",
            checked ? "translate-x-6" : "translate-x-1"
          )}
        />
        <span className="sr-only">{checked ? "켜짐" : "꺼짐"}</span>
      </button>
    </div>
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
          "grid min-h-32 cursor-pointer place-items-center rounded-[16px] border-2 border-dashed px-4 py-6 text-center transition-colors",
          isDragOver
            ? "border-gold bg-gold-soft/40"
            : "border-border bg-secondary/40 hover:border-muted-foreground/40 hover:bg-secondary/70",
          disabled && "cursor-not-allowed opacity-60"
        )}
      >
        <div>
          <span className="mx-auto grid size-11 place-items-center rounded-[12px] bg-background text-muted-foreground shadow-sm">
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
    <li className="group relative overflow-hidden border border-border bg-secondary">
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
        className="absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-md bg-foreground/70 text-background opacity-0 transition-opacity hover:bg-foreground focus-visible:opacity-100 group-hover:opacity-100 disabled:hidden"
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
      className="h-12 w-full rounded-[14px] bg-[#f2f4f6] px-4 text-sm font-medium text-foreground outline-none transition-all placeholder:text-muted-foreground focus:bg-[#eef0f2] focus:ring-2 focus:ring-foreground/10 dark:bg-secondary dark:focus:bg-secondary"
    />
  );
}
