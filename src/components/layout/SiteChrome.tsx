"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { FloatingQuickButtons } from "@/components/layout/FloatingQuickButtons";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { ToastProvider } from "@/components/ui/toast";
import { WishlistProvider } from "@/components/wishlist/WishlistProvider";

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // 관리자 페이지(/admin)는 자체 레이아웃(AdminShell)을 사용하므로
  // 사이트 공통 헤더/이벤트 배너/오른쪽 플로팅 영역/하단 내비를 숨긴다.
  const isAdmin = pathname?.startsWith("/admin") ?? false;
  const isAuthPage = pathname === "/login" || pathname === "/signup";

  useEffect(() => {
    if (!isAuthPage) {
      return;
    }

    const html = document.documentElement;
    const { body } = document;
    const previousHtmlOverflow = html.style.overflow;
    const previousBodyOverflow = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";

    return () => {
      html.style.overflow = previousHtmlOverflow;
      body.style.overflow = previousBodyOverflow;
    };
  }, [isAuthPage]);

  if (isAdmin) {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <ToastProvider>
      <WishlistProvider>
        <div className={isAuthPage ? "flex h-svh flex-col overflow-hidden" : undefined}>
          <Header />
          <main
            className={
              isAuthPage ? "min-h-0 flex-1 overflow-hidden" : "min-h-screen pb-16 md:pb-0"
            }
          >
            {children}
          </main>
          {isAuthPage ? null : (
            <>
              <Footer />
              <FloatingQuickButtons />
              <MobileBottomNav />
            </>
          )}
        </div>
      </WishlistProvider>
    </ToastProvider>
  );
}
