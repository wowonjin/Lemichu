"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronRight, X } from "lucide-react";
import { TossCheckoutSheet } from "@/components/product/TossCheckoutSheet";
import { useToast } from "@/components/ui/toast";
import { useAuthUser } from "@/hooks/useAuthUser";
import {
  canEditAuthEmail,
  formatAuthProvider,
  normalizePhoneNumber,
  updateAccountProfile,
  type AuthUser,
} from "@/lib/auth";
import { cn } from "@/lib/cn";
import { AccountSection } from "./AccountPageShell";
import { GRADE_LABELS, resolveMemberGrade } from "@/lib/member-account";
import { fetchMyProfile } from "@/lib/member-account-client";
import { useRouter } from "next/navigation";

type EditableField = "name" | "email" | "phone";

const FIELD_COPY: Record<
  EditableField,
  {
    label: string;
    title: string;
    description: string;
    placeholder: string;
    confirm: string;
  }
> = {
  name: {
    label: "이름",
    title: "이름을 입력해주세요",
    description: "주문과 배송 안내에 사용되는 이름이에요.",
    placeholder: "이름",
    confirm: "저장하기",
  },
  email: {
    label: "이메일",
    title: "이메일을 입력해주세요",
    description: "로그인과 주문 안내에 사용되는 이메일이에요.",
    placeholder: "이메일",
    confirm: "저장하기",
  },
  phone: {
    label: "휴대폰 번호",
    title: "휴대폰 번호를 입력해주세요",
    description: "배송과 본인 확인에 사용되는 번호예요.",
    placeholder: "010-1234-5678",
    confirm: "저장하기",
  },
};

function formatPhoneInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length < 4) return digits;
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length < 8) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  }
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function currentFieldValue(user: AuthUser, field: EditableField) {
  if (field === "name") return user.name ?? "";
  if (field === "email") return user.email ?? "";
  return user.phone ?? "";
}

function getProfileUpdateMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "";

  if (message.includes("auth/requires-recent-login")) {
    return "보안을 위해 다시 로그인한 뒤 이메일을 바꿀 수 있어요.";
  }
  if (message.includes("auth/email-already-in-use")) {
    return "이미 사용 중인 이메일이에요.";
  }
  if (message.includes("auth/invalid-email")) {
    return "이메일 형식을 다시 확인해주세요.";
  }
  if (message.includes("AUTH_REQUEST_TIMEOUT")) {
    return "저장 응답이 지연되고 있어요. 잠시 후 다시 시도해주세요.";
  }
  if (message.includes("Firebase 설정")) {
    return message;
  }

  return message || "정보를 저장하지 못했어요.";
}

export function AccountSettingsView() {
  const { user } = useAuthUser();
  const { toast } = useToast();
  const router = useRouter();
  const titleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [field, setField] = useState<EditableField | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [gradeLabel, setGradeLabel] = useState(GRADE_LABELS.family);

  useEffect(() => {
    fetchMyProfile()
      .then((profile) => setGradeLabel(GRADE_LABELS[resolveMemberGrade(profile.grade)]))
      .catch(() => undefined);
  }, []);

  const editing = field ? FIELD_COPY[field] : null;
  const emailLocked = Boolean(user) && !canEditAuthEmail(user);

  useEffect(() => {
    if (!field) return;
    const frame = window.requestAnimationFrame(() => inputRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [field]);

  if (!user) return null;

  const openField = (next: EditableField) => {
    setField(next);
    setDraft(currentFieldValue(user, next));
    setError("");
    setSaving(false);
  };

  const closeField = () => {
    if (saving) return;
    setField(null);
    setError("");
  };

  const normalizedDraft =
    field === "phone" ? formatPhoneInput(draft) : field === "email" ? draft.trim() : draft;
  const original = field ? currentFieldValue(user, field) : "";
  const dirty = normalizedDraft !== original;

  let canSubmit = dirty && !saving;
  if (field === "name") {
    canSubmit = canSubmit && normalizedDraft.trim().length >= 1 && normalizedDraft.trim().length <= 30;
  } else if (field === "email") {
    canSubmit = canSubmit && isValidEmail(normalizedDraft) && !emailLocked;
  } else if (field === "phone") {
    canSubmit = canSubmit && (normalizedDraft === "" || Boolean(normalizePhoneNumber(normalizedDraft)));
  }

  const saveField = async () => {
    if (!field || !canSubmit) return;
    setError("");
    setSaving(true);

    try {
      if (field === "name") {
        const name = normalizedDraft.trim();
        if (!name) {
          setError("이름을 입력해주세요.");
          return;
        }
        await updateAccountProfile({ name });
      } else if (field === "email") {
        if (emailLocked) {
          setError("소셜 로그인 이메일은 여기에서 바꿀 수 없어요.");
          return;
        }
        if (!isValidEmail(normalizedDraft)) {
          setError("이메일 형식을 다시 확인해주세요.");
          return;
        }
        await updateAccountProfile({ email: normalizedDraft });
      } else {
        const phone = normalizedDraft ? normalizePhoneNumber(normalizedDraft) : "";
        if (normalizedDraft && !phone) {
          setError("휴대폰 번호는 숫자 10~11자리로 입력해주세요.");
          return;
        }
        await updateAccountProfile({ phone: phone || "" });
      }

      toast("저장했어요.");
      setField(null);
    } catch (saveError) {
      setError(getProfileUpdateMessage(saveError));
    } finally {
      setSaving(false);
    }
  };

  const rows: Array<{
    key: string;
    label: string;
    value: string;
    onClick?: () => void;
    muted?: boolean;
  }> = [
    {
      key: "name",
      label: FIELD_COPY.name.label,
      value: user.name || "-",
      onClick: () => openField("name"),
    },
    {
      key: "email",
      label: FIELD_COPY.email.label,
      value: user.email || "-",
      onClick: () => openField("email"),
    },
    {
      key: "phone",
      label: FIELD_COPY.phone.label,
      value: user.phone || "등록된 번호가 없어요",
      muted: !user.phone,
      onClick: () => openField("phone"),
    },
    {
      key: "provider",
      label: "로그인 방식",
      value: formatAuthProvider(user.provider),
    },
    {
      key: "grade",
      label: "회원 등급",
      value: gradeLabel,
      onClick: () => router.push("/my/grade"),
    },
  ];

  return (
    <>
      <AccountSection>
        <div className="divide-y divide-border">
          {rows.map((row) => {
            const clickable = Boolean(row.onClick);
            const content = (
              <>
                <span className="text-[14px] text-muted-foreground">{row.label}</span>
                <span className="flex min-w-0 items-center justify-end gap-1">
                  <span
                    className={cn(
                      "truncate text-[15px] font-semibold",
                      row.muted ? "text-muted-foreground" : "text-foreground"
                    )}
                  >
                    {row.value}
                  </span>
                  {clickable ? (
                    <ChevronRight className="size-5 shrink-0 text-muted-foreground/60" strokeWidth={2} />
                  ) : null}
                </span>
              </>
            );

            if (!clickable) {
              return (
                <div
                  key={row.key}
                  className="grid grid-cols-[5.5rem_minmax(0,1fr)] items-center gap-2 py-4 first:pt-0 last:pb-0 sm:grid-cols-[120px_minmax(0,1fr)] sm:gap-3 md:grid-cols-[160px_minmax(0,1fr)]"
                >
                  {content}
                </div>
              );
            }

            return (
              <button
                key={row.key}
                type="button"
                onClick={row.onClick}
                className="grid w-full grid-cols-[5.5rem_minmax(0,1fr)] items-center gap-2 py-4 text-left first:pt-0 last:pb-0 transition-opacity hover:opacity-70 sm:grid-cols-[120px_minmax(0,1fr)] sm:gap-3 md:grid-cols-[160px_minmax(0,1fr)]"
              >
                {content}
              </button>
            );
          })}
        </div>
      </AccountSection>

      <TossCheckoutSheet open={Boolean(field)} onClose={closeField} labelledBy={titleId}>
        {editing && field ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void saveField();
            }}
          >
            <header className="flex items-center justify-between px-5 pb-1 pt-5">
              <p className="text-[15px] font-semibold tracking-[-0.02em] text-[#4E5968]">내 정보</p>
              <button
                type="button"
                aria-label="닫기"
                disabled={saving}
                onClick={closeField}
                className="grid size-9 place-items-center rounded-[12px] text-[#8B95A1] transition-colors hover:bg-[#F2F4F6] disabled:opacity-50"
              >
                <X className="size-5" />
              </button>
            </header>

            <div className="px-5 pb-3 pt-1">
              <h2 id={titleId} className="text-[22px] font-bold leading-8 tracking-[-0.03em]">
                {emailLocked && field === "email" ? "이메일을 바꿀 수 없어요" : editing.title}
              </h2>
              <p className="mt-1 text-[14px] leading-5 text-[#8B95A1]">
                {emailLocked && field === "email"
                  ? `${formatAuthProvider(user.provider)}로 가입한 이메일은 소셜 계정에서 관리돼요.`
                  : editing.description}
              </p>
            </div>

            {emailLocked && field === "email" ? (
              <div className="px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2">
                <div className="rounded-[16px] bg-[#F2F4F6] px-4 py-4 text-[16px] font-semibold tracking-[-0.02em] text-[#191F28]">
                  {user.email}
                </div>
                <button
                  type="button"
                  onClick={closeField}
                  className="mt-5 flex h-14 w-full items-center justify-center rounded-[16px] bg-[#3182F6] text-[17px] font-semibold text-white transition-colors hover:bg-[#1B64DA]"
                >
                  확인
                </button>
              </div>
            ) : (
              <div className="px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-1">
                <label className="sr-only" htmlFor={`${titleId}-input`}>
                  {editing.label}
                </label>
                <input
                  id={`${titleId}-input`}
                  ref={inputRef}
                  value={field === "phone" ? formatPhoneInput(draft) : draft}
                  onChange={(event) => {
                    setError("");
                    setDraft(field === "phone" ? formatPhoneInput(event.target.value) : event.target.value);
                  }}
                  type={field === "email" ? "email" : field === "phone" ? "tel" : "text"}
                  inputMode={field === "phone" ? "numeric" : field === "email" ? "email" : "text"}
                  autoComplete={field === "name" ? "name" : field === "email" ? "email" : "tel"}
                  placeholder={editing.placeholder}
                  maxLength={field === "name" ? 30 : field === "phone" ? 13 : 80}
                  className="h-14 w-full rounded-[16px] bg-[#F2F4F6] px-4 text-[17px] font-semibold tracking-[-0.02em] text-[#191F28] outline-none ring-[#3182F6] placeholder:font-medium placeholder:text-[#8B95A1] focus:ring-2"
                />
                {error ? <p className="mt-2 text-[13px] font-medium text-[#F04452]">{error}</p> : null}
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className={cn(
                    "mt-5 flex h-14 w-full items-center justify-center rounded-[16px] text-[17px] font-semibold transition-colors",
                    canSubmit
                      ? "bg-[#3182F6] text-white hover:bg-[#1B64DA]"
                      : "bg-[#E5E8EB] text-[#8B95A1]"
                  )}
                >
                  {saving ? "저장 중..." : editing.confirm}
                </button>
              </div>
            )}
          </form>
        ) : null}
      </TossCheckoutSheet>
    </>
  );
}
