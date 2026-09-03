"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { completeKakaoSignIn } from "@/lib/auth";
import { normalizeRedirectPath } from "@/lib/redirect";

export default function KakaoLoginCompletePage() {
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const finish = async () => {
      const params = new URLSearchParams(window.location.search);
      const redirectPath = normalizeRedirectPath(params.get("redirect"));

      try {
        await completeKakaoSignIn();
        if (!cancelled) {
          router.replace(redirectPath);
        }
      } catch (authError) {
        if (!cancelled) {
          const message =
            authError instanceof Error
              ? authError.message
              : "카카오 로그인 완료 처리에 실패했습니다.";
          setError(message);
        }
      }
    };

    void finish();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="bg-background">
      <div className="container flex min-h-[calc(100vh-7rem)] items-center justify-center py-8">
        <section className="mx-auto w-full max-w-md px-2 text-center">
          {error ? (
            <>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                카카오 로그인 실패
              </h1>
              <p className="mt-4 rounded-xl bg-gold-soft px-4 py-3 text-sm font-medium text-foreground">
                {error}
              </p>
              <Link
                href="/login"
                className="mt-6 inline-block text-sm font-bold text-foreground underline-offset-4 hover:underline"
              >
                로그인 페이지로 돌아가기
              </Link>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                카카오 로그인 중
              </h1>
              <p className="mt-4 text-sm text-muted-foreground">
                잠시만 기다려주세요. 로그인을 완료하고 있습니다.
              </p>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
