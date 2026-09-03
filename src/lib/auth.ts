import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithCustomToken,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateEmail,
  updateProfile,
  type User,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { firebaseAuth, firestoreDb, googleProvider, isFirebaseConfigured } from "@/lib/firebase";
import { normalizeRedirectPath } from "@/lib/redirect";

export type AuthProvider = "email" | "google" | "naver" | "kakao";

export type AuthUser = {
  uid?: string;
  name: string;
  email: string;
  phone?: string;
  provider?: AuthProvider;
  photoURL?: string | null;
  role?: "admin" | "member";
};

export const ADMIN_EMAIL = "admin@gmail.com";
const TEMP_ADMIN_UID = "temp-admin";

export const AUTH_STORAGE_KEY = "lemichu-auth-user";
export const AUTH_STATE_CHANGE = "lemichu-auth-change";

function isTempAdminSession(user: AuthUser | null | undefined) {
  return user?.uid === TEMP_ADMIN_UID && user.email?.toLowerCase() === ADMIN_EMAIL;
}

/** True only when member APIs (Firebase ID token) can actually be called. */
export function canSubmitMemberOrder(user: AuthUser | null | undefined) {
  if (!user?.uid || isTempAdminSession(user)) return false;
  return Boolean(isFirebaseConfigured && firebaseAuth?.currentUser);
}

const defaultUser: AuthUser = {
  name: "레미츄",
  email: "user@lemichu.com",
  provider: "email",
};

const firebaseConfigError =
  "Firebase 설정이 필요합니다. .env.local에 NEXT_PUBLIC_FIREBASE_* 값을 입력하고 개발 서버를 다시 시작해주세요.";
const authRequestTimeoutMs = 15_000;

function withAuthTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      reject(new Error(`AUTH_REQUEST_TIMEOUT:${label}`));
    }, authRequestTimeoutMs);

    promise
      .then(resolve)
      .catch(reject)
      .finally(() => window.clearTimeout(timeoutId));
  });
}

function requireFirebaseAuth() {
  if (!isFirebaseConfigured || !firebaseAuth) {
    throw new Error(firebaseConfigError);
  }

  return firebaseAuth;
}

function persistAuthUser(user: AuthUser | null) {
  if (typeof window === "undefined") return;

  if (user) {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  } else {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  }

  window.dispatchEvent(new CustomEvent(AUTH_STATE_CHANGE, { detail: user }));
}

function resolveAuthProvider(user: User): AuthProvider {
  if (user.uid.startsWith("naver:")) {
    return "naver";
  }

  if (user.uid.startsWith("kakao:")) {
    return "kakao";
  }

  if (user.providerData.some((provider) => provider.providerId === "google.com")) {
    return "google";
  }

  return "email";
}

function toAuthUser(user: User): AuthUser {
  return {
    uid: user.uid,
    name: user.displayName || user.email?.split("@")[0] || defaultUser.name,
    email: user.email || defaultUser.email,
    provider: resolveAuthProvider(user),
    photoURL: user.photoURL,
  };
}

async function loadStoredProfile(uid: string): Promise<Partial<AuthUser> | null> {
  if (!firestoreDb) return null;

  const snapshot = await getDoc(doc(firestoreDb, "users", uid));
  if (!snapshot.exists()) return null;

  const data = snapshot.data();
  return {
    name: typeof data.name === "string" ? data.name : undefined,
    phone: typeof data.phone === "string" ? data.phone : undefined,
    role: data.role === "admin" || data.role === "member" ? data.role : undefined,
  };
}

function hydrateUserFields(
  user: User,
  base: AuthUser,
  stored?: Partial<AuthUser> | null
): AuthUser {
  return {
    ...base,
    name: user.displayName?.trim() || stored?.name?.trim() || base.name,
    phone: typeof stored?.phone === "string" ? stored.phone.trim() || undefined : base.phone,
    role: stored?.role ?? base.role,
  };
}

async function hydrateFirebaseUser(user: User) {
  const base = toAuthUser(user);
  const cached = readAuthUser();
  const storedCache = cached?.uid === base.uid ? cached : null;
  const seeded = hydrateUserFields(user, base, storedCache);
  persistAuthUser(seeded);

  try {
    const stored = await loadStoredProfile(user.uid);
    const next = hydrateUserFields(user, seeded, stored);
    persistAuthUser(next);
    await syncUserProfile(next);
  } catch {
    syncUserProfile(seeded).catch(() => undefined);
  }
}

export function isAdminUser(user: AuthUser | null | undefined): user is AuthUser {
  return user?.role === "admin" || user?.email?.toLowerCase() === ADMIN_EMAIL;
}

export function formatAuthProvider(provider?: AuthProvider) {
  if (provider === "google") return "Google";
  if (provider === "naver") return "네이버";
  if (provider === "kakao") return "카카오";
  return "이메일";
}

export function canEditAuthEmail(user: AuthUser | null | undefined) {
  return Boolean(user) && (user?.provider ?? "email") === "email";
}

export function normalizePhoneNumber(value: string) {
  const digits = value.replace(/\D/g, "");

  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }

  return null;
}

async function syncUserProfile(user: AuthUser) {
  if (!isFirebaseConfigured || !firestoreDb || !user.uid) return;

  await setDoc(
    doc(firestoreDb, "users", user.uid),
    {
      uid: user.uid,
      name: user.name,
      email: user.email,
      ...(user.phone ? { phone: user.phone } : {}),
      provider: user.provider ?? "email",
      photoURL: user.photoURL ?? null,
      role: isAdminUser(user) ? "admin" : "member",
      lastLoginAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export function readAuthUser(): AuthUser | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export async function getFirebaseIdToken(): Promise<string | null> {
  if (!isFirebaseConfigured || !firebaseAuth?.currentUser) {
    return null;
  }

  return firebaseAuth.currentUser.getIdToken();
}

export function observeAuthUser(onChange: (user: AuthUser | null) => void) {
  const handleAuthChange = (event: Event) => {
    onChange((event as CustomEvent<AuthUser | null>).detail);
  };

  if (!isFirebaseConfigured || !firebaseAuth) {
    onChange(readAuthUser());
    window.addEventListener(AUTH_STATE_CHANGE, handleAuthChange);

    return () => {
      window.removeEventListener(AUTH_STATE_CHANGE, handleAuthChange);
    };
  }

  window.addEventListener(AUTH_STATE_CHANGE, handleAuthChange);

  const activeFirebaseAuth = firebaseAuth;
  const unsubscribe = onAuthStateChanged(activeFirebaseAuth, (user) => {
    const stored = readAuthUser();
    if (isTempAdminSession(stored)) {
      if (user) {
        void firebaseSignOut(activeFirebaseAuth).catch(() => undefined);
      }
      onChange(stored);
      return;
    }

    if (!user) {
      persistAuthUser(null);
      return;
    }

    void hydrateFirebaseUser(user);
  });

  return () => {
    unsubscribe();
    window.removeEventListener(AUTH_STATE_CHANGE, handleAuthChange);
  };
}

export async function updateAccountProfile(patch: {
  name?: string;
  email?: string;
  phone?: string;
}) {
  const current =
    readAuthUser() ??
    (firebaseAuth?.currentUser ? toAuthUser(firebaseAuth.currentUser) : null);

  if (!current) {
    throw new Error("로그인이 필요해요.");
  }

  const next: AuthUser = {
    ...current,
    ...(patch.name !== undefined ? { name: patch.name } : {}),
    ...(patch.email !== undefined ? { email: patch.email } : {}),
    ...(patch.phone !== undefined ? { phone: patch.phone || undefined } : {}),
  };

  persistAuthUser(next);

  try {
    if (isFirebaseConfigured && firebaseAuth?.currentUser) {
      const firebaseUser = firebaseAuth.currentUser;

      if (patch.email && patch.email !== current.email) {
        if (!canEditAuthEmail(current)) {
          throw new Error("소셜 로그인 이메일은 여기에서 바꿀 수 없어요.");
        }

        await withAuthTimeout(updateEmail(firebaseUser, patch.email), "updateEmail");
      }

      if (firestoreDb && next.uid) {
        await setDoc(
          doc(firestoreDb, "users", next.uid),
          {
            uid: next.uid,
            name: next.name,
            email: next.email,
            phone: next.phone ?? "",
            provider: next.provider ?? "email",
            photoURL: next.photoURL ?? null,
            role: isAdminUser(next) ? "admin" : "member",
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }

      if (patch.name && patch.name !== current.name) {
        await withAuthTimeout(
          updateProfile(firebaseUser, { displayName: patch.name }),
          "updateProfile"
        );
      }

      if (patch.name !== undefined || patch.phone !== undefined) {
        try {
          const { saveMyProfile } = await import("@/lib/member-account-client");
          await saveMyProfile({
            ...(patch.name !== undefined ? { name: next.name } : {}),
            ...(patch.phone !== undefined ? { phone: next.phone ?? "" } : {}),
          });
        } catch {
          // Client Firestore write already persisted the same fields.
        }
      }
    }
  } catch (error) {
    persistAuthUser(current);
    throw error;
  }

  persistAuthUser(next);
  return next;
}

async function tryTempAdminSignIn(email: string, password: string) {
  try {
    const response = await fetch("/api/auth/temp-admin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      return null;
    }

    const result = (await response.json()) as { user?: AuthUser };
    return isTempAdminSession(result.user) ? result.user : null;
  } catch {
    return null;
  }
}

export async function signInWithEmail(email: string, password: string) {
  const tempAdmin = await tryTempAdminSignIn(email, password);
  if (tempAdmin) {
    if (isFirebaseConfigured && firebaseAuth) {
      await firebaseSignOut(firebaseAuth).catch(() => undefined);
    }

    persistAuthUser(tempAdmin);
    return tempAdmin;
  }

  if (!isFirebaseConfigured || !firebaseAuth) {
    throw new Error("auth/invalid-credential");
  }

  const auth = requireFirebaseAuth();
  const credential = await withAuthTimeout(
    signInWithEmailAndPassword(auth, email, password),
    "signInWithEmail"
  );
  const user = toAuthUser(credential.user);
  persistAuthUser(user);
  syncUserProfile(user).catch(() => undefined);
  return user;
}

export async function createAccountWithEmail({
  name,
  email,
  phone,
  password,
}: {
  name: string;
  email: string;
  phone: string;
  password: string;
}) {
  const auth = requireFirebaseAuth();
  const credential = await withAuthTimeout(
    createUserWithEmailAndPassword(auth, email, password),
    "createAccountWithEmail"
  );

  updateProfile(credential.user, { displayName: name }).catch(() => undefined);
  const user = { ...toAuthUser(credential.user), name, phone };
  persistAuthUser(user);
  syncUserProfile(user).catch(() => undefined);
  return user;
}

export async function signInWithGoogle() {
  const auth = requireFirebaseAuth();
  const credential = await withAuthTimeout(
    signInWithPopup(auth, googleProvider),
    "signInWithGoogle"
  );
  const user = toAuthUser(credential.user);
  persistAuthUser(user);
  syncUserProfile(user).catch(() => undefined);
  return user;
}

export function startNaverLogin(redirectPath = "/my") {
  if (typeof window === "undefined") return;

  const params = new URLSearchParams({
    redirect: normalizeRedirectPath(redirectPath),
  });
  window.location.assign(`/api/auth/naver/start?${params.toString()}`);
}

export async function completeNaverSignIn() {
  const auth = requireFirebaseAuth();
  const response = await fetch("/api/auth/naver/session", {
    method: "GET",
    credentials: "same-origin",
    cache: "no-store",
  });
  const result = (await response.json()) as { token?: string; message?: string };

  if (!response.ok || !result.token) {
    throw new Error(result.message || "네이버 로그인 세션을 확인할 수 없습니다.");
  }

  const credential = await withAuthTimeout(
    signInWithCustomToken(auth, result.token),
    "completeNaverSignIn"
  );
  const user = { ...toAuthUser(credential.user), provider: "naver" as const };
  persistAuthUser(user);
  syncUserProfile(user).catch(() => undefined);
  return user;
}

export function startKakaoLogin(redirectPath = "/my") {
  if (typeof window === "undefined") return;

  const params = new URLSearchParams({
    redirect: normalizeRedirectPath(redirectPath),
  });
  window.location.assign(`/api/auth/kakao/start?${params.toString()}`);
}

export async function completeKakaoSignIn() {
  const auth = requireFirebaseAuth();
  const response = await fetch("/api/auth/kakao/session", {
    method: "GET",
    credentials: "same-origin",
    cache: "no-store",
  });
  const result = (await response.json()) as { token?: string; message?: string };

  if (!response.ok || !result.token) {
    throw new Error(result.message || "카카오 로그인 세션을 확인할 수 없습니다.");
  }

  const credential = await withAuthTimeout(
    signInWithCustomToken(auth, result.token),
    "completeKakaoSignIn"
  );
  const user = { ...toAuthUser(credential.user), provider: "kakao" as const };
  persistAuthUser(user);
  syncUserProfile(user).catch(() => undefined);
  return user;
}

export async function requestPasswordReset(email: string) {
  const auth = requireFirebaseAuth();
  auth.languageCode = "ko";
  await sendPasswordResetEmail(auth, email);
}

export async function signOut() {
  persistAuthUser(null);

  if (isFirebaseConfigured && firebaseAuth) {
    await firebaseSignOut(firebaseAuth);
  }
}
