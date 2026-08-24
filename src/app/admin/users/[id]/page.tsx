import { AdminUserDetailPage } from "@/components/admin/AdminUserDetailPage";

export const metadata = { title: "회원 상세" };

export default async function AdminUserDetailRoutePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AdminUserDetailPage userId={id} />;
}
