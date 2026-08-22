import "server-only";

import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { applicationDefault, cert, getApps, initializeApp, type ServiceAccount } from "firebase-admin/app";
import { getAuth, type DecodedIdToken } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

export class FirebaseAuthError extends Error {
  status = 401;
}

function parseServiceAccount(raw: string): ServiceAccount {
  const decoded = raw.trim().startsWith("{")
    ? raw
    : Buffer.from(raw, "base64").toString("utf8");
  const parsed = JSON.parse(decoded) as {
    project_id?: string;
    projectId?: string;
    client_email?: string;
    clientEmail?: string;
    private_key?: string;
    privateKey?: string;
  };

  return {
    projectId: parsed.project_id ?? parsed.projectId,
    clientEmail: parsed.client_email ?? parsed.clientEmail,
    privateKey: (parsed.private_key ?? parsed.privateKey)?.replace(/\\n/g, "\n"),
  };
}

function resolveServiceAccountPath(): string | null {
  const envPath = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
  const candidates = [
    envPath,
    envPath ? path.resolve(process.cwd(), envPath) : null,
    path.resolve(process.cwd(), "lemichu-25c26-firebase-adminsdk-fbsvc-dbcf2e861c.json"),
  ].filter((value): value is string => Boolean(value));

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  try {
    const match = readdirSync(process.cwd()).find(
      (name) => name.includes("firebase-adminsdk") && name.endsWith(".json")
    );
    return match ? path.resolve(process.cwd(), match) : null;
  } catch {
    return null;
  }
}

function getFileServiceAccount(): ServiceAccount | null {
  const filePath = resolveServiceAccountPath();
  if (!filePath) return null;

  try {
    return parseServiceAccount(readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function getEnvServiceAccount(): ServiceAccount | null {
  const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (rawJson) {
    return parseServiceAccount(rawJson);
  }

  const projectId =
    process.env.FIREBASE_ADMIN_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (projectId && clientEmail && privateKey) {
    return { projectId, clientEmail, privateKey };
  }

  return getFileServiceAccount();
}

function getStorageBucket() {
  return (
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    process.env.FIREBASE_STORAGE_BUCKET ||
    "lemichu-25c26.firebasestorage.app"
  );
}

function shouldUseApplicationDefault() {
  return Boolean(
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
      process.env.GOOGLE_CLOUD_PROJECT ||
      process.env.GCLOUD_PROJECT ||
      process.env.K_SERVICE ||
      process.env.FUNCTION_TARGET ||
      process.env.FIREBASE_CONFIG
  );
}

function getAdminApp() {
  const existing = getApps()[0];
  if (existing) return existing;

  const serviceAccount = getEnvServiceAccount();
  if (serviceAccount) {
    return initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.projectId,
      storageBucket: getStorageBucket(),
    });
  }

  if (shouldUseApplicationDefault()) {
    return initializeApp({
      credential: applicationDefault(),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: getStorageBucket(),
    });
  }

  throw new Error("FIREBASE_ADMIN_CREDENTIALS_MISSING");
}

export function getAdminAuth() {
  return getAuth(getAdminApp());
}

export function getAdminDb() {
  return getFirestore(getAdminApp());
}

export function getAdminStorage() {
  return getStorage(getAdminApp());
}

export async function requireFirebaseUser(req: Request): Promise<DecodedIdToken> {
  const authorization = req.headers.get("authorization") || "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1];

  if (!token) {
    throw new FirebaseAuthError("AUTH_TOKEN_REQUIRED");
  }

  try {
    return await getAdminAuth().verifyIdToken(token);
  } catch {
    throw new FirebaseAuthError("INVALID_AUTH_TOKEN");
  }
}
