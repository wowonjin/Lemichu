"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { FloatingQuickButtons } from "@/components/layout/FloatingQuickButtons";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { ToastProvider } from "@/components/ui/toast";
import { WishlistProvider } from "@/components/wishlist/WishlistProvider";
import type { CategoryMenuTab } from "@/data/categoryMenu";

export function SiteChrome({
  children,
  categoryMenu = [],
}: {
  children: React.ReactNode;
  categoryMenu?: CategoryMenuTab[];
}) {
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
    const desktopQuery = window.matchMedia("(min-width: 1024px)");

    const syncOverflow = () => {
      if (desktopQuery.matches) {
        html.style.overflow = "hidden";
        body.style.overflow = "hidden";
        return;
      }

      html.style.overflow = "";
      html.style.overflowX = "hidden";
      body.style.overflow = "";
      body.style.overflowX = "hidden";
    };

    syncOverflow();
    desktopQuery.addEventListener("change", syncOverflow);

    return () => {
      desktopQuery.removeEventListener("change", syncOverflow);
      html.style.overflow = previousHtmlOverflow;
      html.style.overflowX = "";
      body.style.overflow = previousBodyOverflow;
      body.style.overflowX = "";
    };
  }, [isAuthPage]);

  if (isAdmin) {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <ToastProvider>
      <WishlistProvider>
        <div
          className={
            isAuthPage
              ? "min-w-0 overflow-x-clip lg:flex lg:h-svh lg:flex-col lg:overflow-hidden"
              : "min-w-0 overflow-x-clip"
          }
        >
          <Header categoryMenu={categoryMenu} />
          <main
            className={
              isAuthPage
                ? "min-w-0 overflow-x-clip lg:min-h-0 lg:flex-1 lg:overflow-hidden"
                : "min-h-screen min-w-0 overflow-x-clip"
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
