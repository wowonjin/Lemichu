import { AdminInstantOutlet } from "@/components/admin/AdminInstantOutlet";
import { AdminNavProvider } from "@/components/admin/admin-nav-context";
import { AdminShell } from "@/components/admin/AdminShell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminNavProvider>
      <AdminShell>
        <AdminInstantOutlet>{children}</AdminInstantOutlet>
      </AdminShell>
    </AdminNavProvider>
  );
}
