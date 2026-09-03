import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/admin-auth";
import { getAdminStorage } from "@/lib/firebase-admin";

export const runtime = "nodejs";

const allowedContentTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const maxUploadSize = 12 * 1024 * 1024;
const allowedPathPrefixes = ["products/", "hero-slides/", "home-categories/"];

function isAllowedPath(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= 500 &&
    !value.startsWith("/") &&
    !value.includes("..") &&
    allowedPathPrefixes.some((prefix) => value.startsWith(prefix))
  );
}

function downloadUrl(bucketName: string, path: string, token: string) {
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(path)}?alt=media&token=${token}`;
}

export async function POST(request: Request) {
  if (!(await verifyAdminRequest(request))) {
    return NextResponse.json({ ok: false, message: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, message: "이미지 요청을 해석하지 못했어요." }, { status: 400 });
  }

  const image = formData.get("file");
  const path = formData.get("path");
  const width = Number(formData.get("width"));
  const height = Number(formData.get("height"));

  if (!(image instanceof File) || !isAllowedPath(path)) {
    return NextResponse.json({ ok: false, message: "이미지 파일 또는 저장 경로가 올바르지 않습니다." }, { status: 400 });
  }
  if (!allowedContentTypes.has(image.type) || image.size <= 0 || image.size > maxUploadSize) {
    return NextResponse.json({ ok: false, message: "지원하지 않는 이미지 형식 또는 크기입니다." }, { status: 400 });
  }
  if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) {
    return NextResponse.json({ ok: false, message: "이미지 크기 정보가 올바르지 않습니다." }, { status: 400 });
  }

  try {
    const bucket = getAdminStorage().bucket();
    const token = randomUUID();
    await bucket.file(path).save(Buffer.from(await image.arrayBuffer()), {
      resumable: false,
      metadata: {
        contentType: image.type,
        cacheControl: "public,max-age=31536000,immutable",
        metadata: { firebaseStorageDownloadTokens: token },
      },
    });

    return NextResponse.json({
      ok: true,
      url: downloadUrl(bucket.name, path, token),
      path,
      width: Math.round(width),
      height: Math.round(height),
      contentType: image.type,
      size: image.size,
    });
  } catch (error) {
    console.error("[admin/product-images] failed to upload image", error);
    return NextResponse.json({ ok: false, message: "이미지를 Firebase Storage에 저장하지 못했어요." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!(await verifyAdminRequest(request))) {
    return NextResponse.json({ ok: false, message: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  let body: { paths?: unknown };
  try {
    body = (await request.json()) as { paths?: unknown };
  } catch {
    return NextResponse.json({ ok: false, message: "삭제 요청을 해석하지 못했어요." }, { status: 400 });
  }

  if (!Array.isArray(body.paths) || !body.paths.every(isAllowedPath)) {
    return NextResponse.json({ ok: false, message: "삭제할 이미지 경로가 올바르지 않습니다." }, { status: 400 });
  }

  try {
    const bucket = getAdminStorage().bucket();
    await Promise.all(
      [...new Set(body.paths)].map((path) => bucket.file(path).delete({ ignoreNotFound: true }))
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[admin/product-images] failed to delete images", error);
    return NextResponse.json({ ok: false, message: "이미지를 삭제하지 못했어요." }, { status: 500 });
  }
}
