import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { NavigationProgress } from "@/components/navigation/NavigationProgress";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ThemeScript } from "@/components/theme/theme-script";
import { getHeaderCategoryMenu } from "@/lib/catalog";
import { SITE_NAME, SITE_TITLE_DEFAULT, SITE_TITLE_TEMPLATE } from "@/lib/site";

export const metadata: Metadata = {
  title: {
    default: SITE_TITLE_DEFAULT,
    template: SITE_TITLE_TEMPLATE,
  },
  description:
    "정품 검수 완료 명품을 가장 안전하게 사고파는 곳. 신상, 중고, 위탁판매까지 검수 정보와 배송 가능일을 먼저 확인하세요.",
  keywords: ["명품", "중고명품", "정품 검수", "명품 쇼핑몰", "위탁판매"],
  openGraph: {
    siteName: SITE_NAME,
    locale: "ko_KR",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const categoryMenu = await getHeaderCategoryMenu();

  return (
    <html lang="ko" suppressHydrationWarning>
      <body>
        <ThemeScript />
        <ThemeProvider>
          <NavigationProgress />
          <SiteChrome categoryMenu={categoryMenu}>{children}</SiteChrome>
        </ThemeProvider>
      </body>
    </html>
  );
}
