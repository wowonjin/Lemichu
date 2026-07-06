import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { firebaseAuth, firestoreDb, googleProvider, isFirebaseConfigured } from "@/lib/firebase";

export type AuthUser = {
  uid?: string;
  name: string;
  email: string;
  phone?: string;
  provider?: "email" | "google";
  photoURL?: string | null;
  role?: "admin" | "member";
};

export const ADMIN_EMAIL = "admin@gmail.com";

export const AUTH_STORAGE_KEY = "lemichu-auth-user";
export const AUTH_STATE_CHANGE = "lemichu-auth-change";

const defaultUser: AuthUser = {
  name: "레미츄",
  email: "user@lemichu.com",
  provider: "email",
};

const firebaseConfigError =
  "Firebase 설정이 필요합니다. .env.local에 NEXT_PUBLIC_FIREBASE_* 값을 입력하고 개발 서버를 다시 시작해주세요.";

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

function toAuthUser(user: User): AuthUser {
  return {
    uid: user.uid,
    name: user.displayName || user.email?.split("@")[0] || defaultUser.name,
    email: user.email || defaultUser.email,
    provider:
      user.providerData.find((provider) => provider.providerId === "google.com")
        ? "google"
        : "email",
    photoURL: user.photoURL,
  };
}

export function isAdminUser(user: AuthUser | null | undefined): user is AuthUser {
  return user?.role === "admin" || user?.email?.toLowerCase() === ADMIN_EMAIL;
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
  if (!isFirebaseConfigured || !firebaseAuth) {
    onChange(readAuthUser());

    const handleAuthChange = (event: Event) => {
      onChange((event as CustomEvent<AuthUser | null>).detail);
    };

    window.addEventListener(AUTH_STATE_CHANGE, handleAuthChange);

    return () => {
      window.removeEventListener(AUTH_STATE_CHANGE, handleAuthChange);
    };
  }

  return onAuthStateChanged(firebaseAuth, (user) => {
    const nextUser = user ? toAuthUser(user) : null;
    persistAuthUser(nextUser);
    if (nextUser) {
      syncUserProfile(nextUser).catch(() => undefined);
    }
    onChange(nextUser);
  });
}

export async function signInWithEmail(email: string, password: string) {
  if (!isFirebaseConfigured || !firebaseAuth) {
    const response = await fetch("/api/auth/temp-admin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message ?? "임시 관리자 로그인에 실패했어요.");
    }

    const user = result.user as AuthUser;
    persistAuthUser(user);
    return user;
  }

  const auth = requireFirebaseAuth();
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const user = toAuthUser(credential.user);
  await syncUserProfile(user);
  persistAuthUser(user);
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
  const credential = await createUserWithEmailAndPassword(auth, email, password);

  await updateProfile(credential.user, { displayName: name });
  const user = { ...toAuthUser(credential.user), phone };
  await syncUserProfile(user);
  persistAuthUser(user);
  return user;
}

export async function signInWithGoogle() {
  const auth = requireFirebaseAuth();
  const credential = await signInWithPopup(auth, googleProvider);
  const user = toAuthUser(credential.user);
  await syncUserProfile(user);
  persistAuthUser(user);
  return user;
}

export async function requestPasswordReset(email: string) {
  const auth = requireFirebaseAuth();
  auth.languageCode = "ko";
  await sendPasswordResetEmail(auth, email);
}

export async function signOut() {
  if (isFirebaseConfigured && firebaseAuth) {
    await firebaseSignOut(firebaseAuth);
  }

  persistAuthUser(null);
}
