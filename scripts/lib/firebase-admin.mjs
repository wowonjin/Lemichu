import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
} from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

const DEFAULT_PROJECT_ID = "lemichu-25c26";
const DEFAULT_BUCKET = "lemichu-25c26.firebasestorage.app";

function loadEnvFile(filePath = path.resolve(".env.local")) {
  if (!existsSync(filePath)) return;
  for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index);
    let value = trimmed.slice(index + 1);
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

function parseServiceAccountValue(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    try {
      return JSON.parse(Buffer.from(value, "base64").toString("utf8"));
    } catch {
      return null;
    }
  }
}

function loadServiceAccount() {
  const inline = parseServiceAccountValue(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  if (inline) return inline;

  if (
    process.env.FIREBASE_ADMIN_PROJECT_ID &&
    process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
    process.env.FIREBASE_ADMIN_PRIVATE_KEY
  ) {
    return {
      project_id: process.env.FIREBASE_ADMIN_PROJECT_ID,
      client_email: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      private_key: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n"),
    };
  }

  const configuredPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const candidates = [
    configuredPath ? path.resolve(configuredPath) : null,
    ...readdirSync(path.resolve("."))
      .filter((name) => /firebase-adminsdk.*\.json$/i.test(name))
      .map((name) => path.resolve(name)),
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (!existsSync(candidate)) continue;
    try {
      return JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      // Try the next credential source.
    }
  }
  return null;
}

export function getFirebaseAdminServices() {
  loadEnvFile();
  const serviceAccount = loadServiceAccount();
  if (
    !serviceAccount &&
    process.env.ALLOW_APPLICATION_DEFAULT_CREDENTIALS !== "1"
  ) {
    throw new Error(
      "Explicit Firebase Admin credentials are required. Set FIREBASE_SERVICE_ACCOUNT_JSON, FIREBASE_ADMIN_* variables, or GOOGLE_APPLICATION_CREDENTIALS. Application Default Credentials are disabled for migration safety."
    );
  }
  const projectId =
    serviceAccount?.project_id ||
    process.env.FIREBASE_ADMIN_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    DEFAULT_PROJECT_ID;
  const bucketName =
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    process.env.FIREBASE_STORAGE_BUCKET ||
    DEFAULT_BUCKET;

  const app =
    getApps()[0] ||
    initializeApp({
      credential: serviceAccount ? cert(serviceAccount) : applicationDefault(),
      projectId,
      storageBucket: bucketName,
    });

  return {
    app,
    db: getFirestore(app),
    bucket: getStorage(app).bucket(bucketName),
    projectId,
    bucketName,
  };
}

export function assertExpectedProject(projectId, expected = DEFAULT_PROJECT_ID) {
  if (projectId !== expected) {
    throw new Error(
      `Firebase project mismatch: expected ${expected}, received ${projectId}`
    );
  }
}
