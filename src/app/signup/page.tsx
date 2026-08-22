"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { SocialLoginButtons } from "@/components/auth/SocialLoginButtons";
import { privacyDoc, termsDoc, type InfoDoc } from "@/data/pageContent";
import { createAccountWithEmail, signInWithGoogle, startNaverLogin } from "@/lib/auth";

function getSignupMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "회원가입 중 문제가 발생했어요.";

  if (message.includes("auth/email-already-in-use")) {
    return "이미 가입된 이메일입니다. 로그인 페이지를 이용해주세요.";
  }

  if (message.includes("auth/weak-password")) {
    return "비밀번호는 6자 이상으로 입력해주세요.";
  }

  if (message.includes("AUTH_REQUEST_TIMEOUT")) {
    return "Firebase 회원가입 응답이 지연되고 있어요. 네트워크 상태, Firebase Auth 사용 설정, 승인된 도메인을 확인해주세요.";
  }

  if (message.includes("Firebase 설정")) {
    return message;
  }

  return "잠시 후 다시 시도해주세요.";
}

function normalizePhoneNumber(value: string) {
  const digits = value.replace(/\D/g, "");

  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }

  return null;
}

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [policyDoc, setPolicyDoc] = useState<InfoDoc | null>(null);

  const handleGoogleSignup = async () => {
    setError("");
    setIsSubmitting(true);

    try {
      await signInWithGoogle();
      router.push("/my");
    } catch (authError) {
      setError(getSignupMessage(authError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNaverSignup = () => {
    setError("");
    setIsSubmitting(true);
    startNaverLogin("/my");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") || "");
    const passwordConfirm = String(formData.get("passwordConfirm") || "");
    const phone = normalizePhoneNumber(String(formData.get("phone") || ""));

    if (password !== passwordConfirm) {
      setError("비밀번호 확인이 일치하지 않아요.");
      return;
    }

    if (!phone) {
      setError("휴대전화번호는 숫자 10~11자리로 입력해주세요.");
      return;
    }

    setIsSubmitting(true);

    try {
      await createAccountWithEmail({
        name: String(formData.get("name") || "레미츄"),
        email: String(formData.get("email") || ""),
        phone,
        password,
      });
      router.push("/my");
    } catch (authError) {
      setError(getSignupMessage(authError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full overflow-hidden bg-background">
      <AuthSplitLayout>
          <h1 className="text-center text-[2rem] font-bold leading-none tracking-tight text-foreground">
            회원가입
          </h1>

          <div className="mt-7">
            <SocialLoginButtons
              mode="signup"
              disabled={isSubmitting}
              onGoogle={handleGoogleSignup}
              onNaver={handleNaverSignup}
            />
          </div>

          <div className="my-6 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            이메일로 가입
            <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="grid gap-2 text-sm font-bold text-foreground">
              이름
              <input
                name="name"
                type="text"
                required
                placeholder="이름"
                className="h-12 rounded-md border border-border bg-background px-4 text-base font-medium outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground/30"
              />
            </label>
            <label className="grid gap-2 text-sm font-bold text-foreground">
              이메일
              <input
                name="email"
                type="email"
                required
                placeholder="이메일"
                className="h-12 rounded-md border border-border bg-background px-4 text-base font-medium outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground/30"
              />
            </label>
            <label className="grid gap-2 text-sm font-bold text-foreground">
              휴대전화번호
              <input
                name="phone"
                type="tel"
                required
                inputMode="numeric"
                autoComplete="tel"
                placeholder="010-1234-5678"
                pattern="[0-9\\-\\s]{10,13}"
                className="h-12 rounded-md border border-border bg-background px-4 text-base font-medium outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground/30"
              />
            </label>
            <label className="grid gap-2 text-sm font-bold text-foreground">
              비밀번호
              <input
                name="password"
                type="password"
                required
                placeholder="비밀번호 입력"
                minLength={6}
                className="h-12 rounded-md border border-border bg-background px-4 text-base font-medium outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground/30"
              />
            </label>
            <label className="grid gap-2 text-sm font-bold text-foreground">
              비밀번호 확인
              <input
                name="passwordConfirm"
                type="password"
                required
                placeholder="비밀번호 재입력"
                minLength={6}
                className="h-12 rounded-md border border-border bg-background px-4 text-base font-medium outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground/30"
              />
            </label>

            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <input
                id="signup-agreement"
                type="checkbox"
                required
                aria-label="이용약관 및 개인정보 처리방침 동의"
                aria-describedby="signup-agreement-description"
                className="mt-0.5 size-4 rounded border-border accent-foreground"
              />
              <p id="signup-agreement-description" className="flex-1 leading-5">
                만 14세 이상이며,{" "}
                <button
                  type="button"
                  onClick={() => setPolicyDoc(termsDoc)}
                  className="font-semibold text-foreground underline underline-offset-2"
                >
                  이용약관
                </button>{" "}
                및{" "}
                <button
                  type="button"
                  onClick={() => setPolicyDoc(privacyDoc)}
                  className="font-semibold text-foreground underline underline-offset-2"
                >
                  개인정보 처리방침
                </button>
                에 동의합니다.
              </p>
            </div>

            {error ? (
              <p className="rounded-md bg-gold-soft px-4 py-3 text-sm font-medium text-foreground">
                {error}
              </p>
            ) : null}

            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting}
              className="mt-2 h-12 w-full rounded-md text-base font-bold"
            >
              {isSubmitting ? "가입 처리 중..." : "회원가입"}
            </Button>
          </form>

          <p className="mt-7 text-center text-sm text-muted-foreground">
            이미 계정이 있으신가요?{" "}
            <Link
              href="/login"
              className="font-bold text-foreground underline-offset-4 hover:underline"
            >
              로그인으로 이동
            </Link>
          </p>
      </AuthSplitLayout>

      <PolicyDialog doc={policyDoc} onClose={() => setPolicyDoc(null)} />
    </div>
  );
}

function PolicyDialog({
  doc,
  onClose,
}: {
  doc: InfoDoc | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!doc) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [doc, onClose]);

  if (!doc) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/45 px-4 py-4 backdrop-blur-sm sm:items-center"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="policy-dialog-title"
        className="flex max-h-[86vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-background shadow-[0_28px_90px_rgba(15,23,42,0.28)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="border-b border-border px-5 py-5 sm:px-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2
                id="policy-dialog-title"
                className="text-2xl font-semibold tracking-tight text-foreground"
              >
                {doc.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {doc.description}
              </p>
              {doc.updatedAt ? (
                <p className="mt-3 text-xs font-medium text-muted-foreground">
                  최종 업데이트 {doc.updatedAt}
                </p>
              ) : null}
            </div>

            <button
              type="button"
              aria-label="팝업 닫기"
              onClick={onClose}
              className="grid size-10 shrink-0 place-items-center rounded-full bg-background text-foreground transition-colors hover:bg-secondary"
            >
              <X className="size-5" />
            </button>
          </div>
        </header>

        <div className="overflow-y-auto px-5 py-5 sm:px-7">
          <div className="space-y-6 text-sm leading-7 text-muted-foreground">
            {doc.sections.map((section) => (
              <section key={section.heading}>
                <h3 className="text-base font-semibold text-foreground">
                  {section.heading}
                </h3>
                <div className="mt-2 space-y-2">
                  {section.paragraphs.map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
                {section.bullets ? (
                  <div className="mt-2 space-y-2">
                    {section.bullets.map((bullet) => (
                      <p key={bullet}>{bullet}</p>
                    ))}
                  </div>
                ) : null}
              </section>
            ))}
          </div>
        </div>

        <footer className="border-t border-border bg-background px-5 py-4 sm:px-7">
          <Button type="button" className="w-full" onClick={onClose}>
            확인했습니다
          </Button>
        </footer>
      </section>
    </div>
  );
}
