"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { FloatingQuickButtons } from "@/components/layout/FloatingQuickButtons";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // 관리자 페이지(/admin)는 자체 레이아웃(AdminShell)을 사용하므로
  // 사이트 공통 헤더/이벤트 배너/오른쪽 플로팅 영역/하단 내비를 숨긴다.
  const isAdmin = pathname?.startsWith("/admin") ?? false;

  if (isAdmin) {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <>
      <Header />
      {/* pb on mobile to clear the fixed bottom nav */}
      <main className="min-h-screen pb-16 md:pb-0">{children}</main>
      <Footer />
      <FloatingQuickButtons />
      <MobileBottomNav />
    </>
  );
}
