"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SocialLoginButtons } from "@/components/auth/SocialLoginButtons";
import { requestPasswordReset, signInWithEmail, signInWithGoogle } from "@/lib/auth";
import { normalizeRedirectPath } from "@/lib/redirect";

function getAuthMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "로그인 중 문제가 발생했어요.";

  if (message.includes("auth/invalid-credential")) {
    return "이메일 또는 비밀번호를 다시 확인해주세요.";
  }

  if (message.includes("auth/user-not-found")) {
    return "가입된 이메일을 찾을 수 없어요.";
  }

  if (message.includes("auth/wrong-password")) {
    return "비밀번호가 올바르지 않아요.";
  }

  if (message.includes("Firebase 설정")) {
    return message;
  }

  if (message.includes("임시 관리자 계정 설정")) {
    return "임시 관리자 계정 설정을 확인하고 개발 서버를 다시 시작해주세요.";
  }

  return "잠시 후 다시 시도해주세요.";
}

function getPasswordResetMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "비밀번호 재설정 중 문제가 발생했어요.";

  if (message.includes("auth/invalid-email")) {
    return "이메일 형식을 다시 확인해주세요.";
  }

  if (message.includes("auth/too-many-requests")) {
    return "요청이 너무 많아요. 잠시 후 다시 시도해주세요.";
  }

  if (message.includes("Firebase 설정")) {
    return message;
  }

  return "잠시 후 다시 시도해주세요.";
}

type RecoveryMode = "id" | "password";

export default function LoginPage() {
  const router = useRouter();
  const [redirectPath, setRedirectPath] = useState("/my");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isRecoveryOpen, setIsRecoveryOpen] = useState(false);
  const [recoveryMode, setRecoveryMode] = useState<RecoveryMode>("id");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoveryMessage, setRecoveryMessage] = useState("");
  const [recoveryError, setRecoveryError] = useState("");
  const [isRecoverySubmitting, setIsRecoverySubmitting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setRedirectPath(normalizeRedirectPath(params.get("redirect")));
  }, []);

  const handleEmailLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await signInWithEmail(email.trim(), password);
      router.push(redirectPath);
    } catch (authError) {
      setError(getAuthMessage(authError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setIsSubmitting(true);

    try {
      await signInWithGoogle();
      router.push(redirectPath);
    } catch (authError) {
      setError(getAuthMessage(authError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const openRecoveryDialog = () => {
    setRecoveryEmail(email.trim());
    setRecoveryMessage("");
    setRecoveryError("");
    setRecoveryMode("id");
    setIsRecoveryOpen(true);
  };

  const handleRecoverySubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRecoveryMessage("");
    setRecoveryError("");

    if (recoveryMode === "id") {
      setRecoveryMessage(
        "레미츄 아이디는 가입할 때 사용한 이메일 주소입니다. 비밀번호가 기억나지 않으면 재설정 메일을 받아주세요."
      );
      return;
    }

    setIsRecoverySubmitting(true);

    try {
      await requestPasswordReset(recoveryEmail.trim());
      setRecoveryMessage(
        "가입된 이메일이라면 비밀번호 재설정 메일이 발송됩니다. 메일함과 스팸함을 확인해주세요."
      );
    } catch (resetError) {
      setRecoveryError(getPasswordResetMessage(resetError));
    } finally {
      setIsRecoverySubmitting(false);
    }
  };

  return (
    <div className="bg-white">
      <div className="container flex min-h-[calc(100vh-7rem)] items-center justify-center py-8 lg:py-10">
        <section className="mx-auto w-full max-w-md px-2">
          <div className="text-center">
            <Link href="/" className="inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="LEMICHU" className="mx-auto h-6 w-auto" />
            </Link>
            <h1 className="mt-5 text-2xl font-bold tracking-tight text-foreground">
              로그인
            </h1>
          </div>

          <div className="mt-7">
            <SocialLoginButtons mode="login" onSuccess={handleGoogleLogin} />
          </div>

          <div className="my-6 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            또는 이메일로 계속
            <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleEmailLogin} className="flex flex-col gap-4">
            <label className="grid gap-2 text-sm font-bold text-foreground">
              이메일
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="이메일"
                className="h-12 rounded-lg border border-border bg-background px-4 text-base font-medium outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground/30"
              />
            </label>
            <label className="grid gap-2 text-sm font-bold text-foreground">
              비밀번호
              <span className="flex h-12 items-center rounded-lg border border-border bg-background px-4 transition-colors focus-within:border-foreground/30">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호 입력"
                  className="h-full min-w-0 flex-1 bg-transparent text-base font-medium outline-none placeholder:text-muted-foreground"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="ml-3 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                >
                  {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              </span>
            </label>

            <div className="flex items-center justify-between gap-4 text-sm text-muted-foreground">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="size-4 rounded border-border accent-foreground"
                  defaultChecked
                />
                자동 로그인
              </label>
              <button
                type="button"
                onClick={openRecoveryDialog}
                className="font-medium transition-colors hover:text-foreground"
              >
                아이디·비밀번호 찾기
              </button>
            </div>

            {error ? (
              <p className="rounded-xl bg-gold-soft px-4 py-3 text-sm font-medium text-foreground">
                {error}
              </p>
            ) : null}

            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting}
              className="mt-2 h-12 w-full rounded-lg text-base font-bold"
            >
              {isSubmitting ? "로그인 중..." : "로그인"}
            </Button>
          </form>

          <p className="mt-7 text-center text-sm text-muted-foreground">
            아직 회원이 아니신가요?{" "}
            <Link
              href="/signup"
              className="font-bold text-foreground underline-offset-4 hover:underline"
            >
              회원가입으로 이동
            </Link>
          </p>
        </section>
      </div>

      {isRecoveryOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="recovery-title"
        >
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between gap-4">
              <h2 id="recovery-title" className="text-lg font-bold text-foreground">
                아이디·비밀번호 찾기
              </h2>
              <button
                type="button"
                onClick={() => setIsRecoveryOpen(false)}
                className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                aria-label="팝업 닫기"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-2 rounded-lg bg-secondary p-1 text-sm font-semibold">
              <button
                type="button"
                onClick={() => {
                  setRecoveryMode("id");
                  setRecoveryMessage("");
                  setRecoveryError("");
                }}
                className={`rounded-md py-2 transition-colors ${
                  recoveryMode === "id" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                아이디 찾기
              </button>
              <button
                type="button"
                onClick={() => {
                  setRecoveryMode("password");
                  setRecoveryMessage("");
                  setRecoveryError("");
                }}
                className={`rounded-md py-2 transition-colors ${
                  recoveryMode === "password" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                비밀번호 찾기
              </button>
            </div>

            <form onSubmit={handleRecoverySubmit} className="mt-5 space-y-4">
              {recoveryMode === "id" ? (
                <p className="rounded-lg bg-secondary px-4 py-3 text-sm leading-relaxed text-muted-foreground">
                  레미츄는 이메일 주소를 아이디로 사용합니다. Firebase Auth는 보안상 이름이나 전화번호로
                  계정 이메일을 조회하는 클라이언트 기능을 제공하지 않아, 가입 시 사용한 이메일을
                  확인하는 방식으로 안내합니다.
                </p>
              ) : null}

              <label className="grid gap-2 text-sm font-bold text-foreground">
                이메일
                <input
                  type="email"
                  required
                  value={recoveryEmail}
                  onChange={(event) => setRecoveryEmail(event.target.value)}
                  placeholder="가입한 이메일"
                  className="h-12 rounded-lg border border-border bg-background px-4 text-base font-medium outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground/30"
                />
              </label>

              {recoveryMessage ? (
                <p className="rounded-lg bg-gold-soft px-4 py-3 text-sm font-medium leading-relaxed text-foreground">
                  {recoveryMessage}
                </p>
              ) : null}

              {recoveryError ? (
                <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {recoveryError}
                </p>
              ) : null}

              <Button
                type="submit"
                size="lg"
                disabled={isRecoverySubmitting}
                className="h-12 w-full rounded-lg text-base font-bold"
              >
                {recoveryMode === "password"
                  ? isRecoverySubmitting
                    ? "메일 발송 중..."
                    : "재설정 메일 받기"
                  : "아이디 확인하기"}
              </Button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
