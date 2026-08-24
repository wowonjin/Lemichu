import { getFirebaseIdToken, readAuthUser } from "@/lib/auth";

export async function adminRequestHeaders(contentType: string | null = "application/json") {
  const headers: Record<string, string> = {};
  if (contentType) headers["Content-Type"] = contentType;
  const token = await getFirebaseIdToken().catch(() => null);
  const user = readAuthUser();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (process.env.NODE_ENV !== "production" && user?.email) {
    headers["x-admin-email"] = user.email;
  }
  return headers;
}

export async function accountRequestHeaders() {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = await getFirebaseIdToken().catch(() => null);
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export async function parseApiJson<T>(response: Response): Promise<T> {
  return (await response.json().catch(() => ({}))) as T;
}

export async function assertApiOk(
  response: Response,
  fallback: string
): Promise<Record<string, unknown>> {
  const json = await parseApiJson<Record<string, unknown>>(response);
  if (!response.ok || json.ok === false) {
    throw new Error(typeof json.message === "string" ? json.message : fallback);
  }
  return json;
}
