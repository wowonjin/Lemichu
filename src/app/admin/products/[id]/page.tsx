import { AdminProductEditPage } from "@/components/admin/AdminProductsPage";

export const metadata = {
  title: "상품 수정",
};

export default async function ProductEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AdminProductEditPage productId={id} />;
}
