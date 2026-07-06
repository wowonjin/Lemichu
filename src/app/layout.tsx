import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { RoutePrefetcher } from "@/components/navigation/RoutePrefetcher";

export const metadata: Metadata = {
  title: "LEMICHU — 정품 검수 명품 커머스",
  description:
    "정품 검수 완료 명품을 가장 안전하게 사고파는 곳. 신상, 중고, 위탁판매까지 검수 정보와 배송 가능일을 먼저 확인하세요.",
  keywords: ["명품", "중고명품", "정품 검수", "명품 쇼핑몰", "위탁판매"],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <SiteChrome>{children}</SiteChrome>
        <RoutePrefetcher />
      </body>
    </html>
  );
}
