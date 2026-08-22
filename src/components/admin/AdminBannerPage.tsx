"use client";

import { useEffect, useState } from "react";
import { AdminPageHeader, AdminShell } from "@/components/admin/AdminShell";
import { HeaderBannerEditor } from "@/components/admin/HeaderBannerEditor";
import { HeaderEventBanner } from "@/components/layout/HeaderEventBanner";
import { observeHeaderBanner } from "@/lib/headerBanner-store";
import { DEFAULT_HEADER_BANNER, type HeaderBannerSettings } from "@/lib/headerBanner";

export function AdminBannerPage() {
  const [settings, setSettings] = useState<HeaderBannerSettings>(DEFAULT_HEADER_BANNER);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    return observeHeaderBanner((next) => {
      setSettings(next);
      setIsReady(true);
    });
  }, []);

  return (
    <AdminShell>
      <AdminPageHeader title="상단 이벤트 배너" />
      <p className="mb-8 max-w-2xl text-sm leading-6 text-muted-foreground">
        헤더 위 안내 바입니다. 토스처럼 짧은 문구만 롤링합니다.
        저장한 내용은 쇼핑몰 상단과 이 페이지에서 함께 수정됩니다.
      </p>

      <section className="mb-8 overflow-hidden rounded-xl border border-border">
        <div className="border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold text-foreground">미리보기</h3>
        </div>
        <HeaderEventBanner previewSettings={settings} />
      </section>

      {isReady ? (
        <HeaderBannerEditor initial={settings} onChange={setSettings} onSaved={setSettings} />
      ) : (
        <div className="py-10 text-center text-sm text-muted-foreground">
          배너 설정을 불러오는 중입니다.
        </div>
      )}
    </AdminShell>
  );
}
