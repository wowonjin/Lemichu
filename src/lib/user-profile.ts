export type UserGender = "M" | "F" | "U";

export type UserDemographics = {
  gender?: UserGender | "";
  birthday?: string;
  ageRange?: string;
  birthYear?: string;
};

export const GENDER_OPTIONS: { value: UserGender; label: string }[] = [
  { value: "M", label: "남성" },
  { value: "F", label: "여성" },
  { value: "U", label: "선택 안 함" },
];

export const AGE_RANGE_OPTIONS = [
  "0-9",
  "10-19",
  "20-29",
  "30-39",
  "40-49",
  "50-59",
  "60-",
] as const;

export function formatGenderLabel(gender?: string | null) {
  if (gender === "M") return "남성";
  if (gender === "F") return "여성";
  if (gender === "U") return "선택 안 함";
  return gender?.trim() || "-";
}

export function normalizeGender(value?: string | null): UserGender | undefined {
  const normalized = value?.trim().toUpperCase();
  if (normalized === "M" || normalized === "F" || normalized === "U") {
    return normalized;
  }
  return undefined;
}

export function normalizeBirthday(value?: string | null) {
  const raw = value?.trim();
  if (!raw) return undefined;

  const match = raw.match(/^(\d{2})-(\d{2})$/);
  if (match) return `${match[1]}-${match[2]}`;

  const digits = raw.replace(/\D/g, "");
  if (digits.length === 4) {
    return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  }

  return undefined;
}

export function normalizeBirthYear(value?: string | null) {
  const year = value?.trim();
  if (!year || !/^\d{4}$/.test(year)) return undefined;
  const numeric = Number(year);
  if (numeric < 1900 || numeric > new Date().getFullYear()) return undefined;
  return year;
}

export function ageRangeFromBirthYear(birthYear?: string | null) {
  const year = normalizeBirthYear(birthYear);
  if (!year) return undefined;

  const age = new Date().getFullYear() - Number(year);
  if (age < 10) return "0-9";
  if (age < 20) return "10-19";
  if (age < 30) return "20-29";
  if (age < 40) return "30-39";
  if (age < 50) return "40-49";
  if (age < 60) return "50-59";
  return "60-";
}

export function pickDemographics(input: {
  gender?: string | null;
  birthday?: string | null;
  ageRange?: string | null;
  birthYear?: string | null;
}): UserDemographics {
  const gender = normalizeGender(input.gender);
  const birthday = normalizeBirthday(input.birthday);
  const birthYear = normalizeBirthYear(input.birthYear);
  const ageRange =
    input.ageRange?.trim() || ageRangeFromBirthYear(birthYear) || undefined;

  return {
    ...(gender ? { gender } : {}),
    ...(birthday ? { birthday } : {}),
    ...(ageRange ? { ageRange } : {}),
    ...(birthYear ? { birthYear } : {}),
  };
}
