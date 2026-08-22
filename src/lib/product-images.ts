"use client";

import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { firebaseStorage, isFirebaseConfigured } from "@/lib/firebase";

export type ProductImageVariant = {
  url: string;
  path: string;
  width: number;
  height: number;
  contentType: string;
  size: number;
};

export type ProductImageAsset = {
  original: ProductImageVariant;
  thumbnail: ProductImageVariant;
  medium: ProductImageVariant;
  alt: string;
};

type ImageVariantBlob = {
  blob: Blob;
  width: number;
  height: number;
  contentType: string;
};

const firebaseStorageError =
  "Firebase Storage 설정이 필요합니다. .env.local에 NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET 값을 확인하고 개발 서버를 다시 시작해주세요.";

const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const maxImageSize = 10 * 1024 * 1024;

function requireFirebaseStorage() {
  if (!isFirebaseConfigured || !firebaseStorage) {
    throw new Error(firebaseStorageError);
  }
  return firebaseStorage;
}

function getExtension(contentType: string) {
  if (contentType === "image/png") return "png";
  if (contentType === "image/webp") return "webp";
  if (contentType === "image/avif") return "avif";
  return "jpg";
}

function sanitizeFileName(fileName: string) {
  const baseName = fileName.replace(/\.[^.]+$/, "");
  return (
    baseName
      .toLowerCase()
      .replace(/[^a-z0-9-_]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "product-image"
  );
}

function validateImageFile(file: File) {
  if (!allowedImageTypes.has(file.type)) {
    throw new Error("JPG, PNG, WebP, AVIF 이미지만 업로드할 수 있습니다.");
  }
  if (file.size > maxImageSize) {
    throw new Error("이미지는 파일당 10MB 이하로 업로드해주세요.");
  }
}

async function resizeImage(file: File, maxSide: number, quality: number): Promise<ImageVariantBlob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");

  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error("이미지 처리에 실패했습니다.");
  }

  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/webp", quality);
  });

  if (!blob) {
    throw new Error("이미지 최적화 파일을 만들지 못했습니다.");
  }

  return {
    blob,
    width,
    height,
    contentType: "image/webp",
  };
}

async function getImageDimensions(file: File) {
  const bitmap = await createImageBitmap(file);
  const dimensions = { width: bitmap.width, height: bitmap.height };
  bitmap.close();
  return dimensions;
}

async function uploadVariant({
  blob,
  path,
  contentType,
  width,
  height,
}: ImageVariantBlob & {
  path: string;
}): Promise<ProductImageVariant> {
  const storage = requireFirebaseStorage();
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, blob, {
    contentType,
    cacheControl: "public,max-age=31536000,immutable",
  });
  const url = await getDownloadURL(snapshot.ref);

  return {
    url,
    path,
    width,
    height,
    contentType,
    size: blob.size,
  };
}

export async function uploadProductImage({
  file,
  directory,
  alt,
  index,
}: {
  file: File;
  directory: string;
  alt: string;
  index: number;
}): Promise<ProductImageAsset> {
  validateImageFile(file);

  const safeName = sanitizeFileName(file.name);
  const originalExtension = getExtension(file.type);
  const originalPath = `${directory}/${index}-${safeName}/original.${originalExtension}`;
  const thumbnailPath = `${directory}/${index}-${safeName}/thumbnail.webp`;
  const mediumPath = `${directory}/${index}-${safeName}/medium.webp`;
  const originalDimensions = await getImageDimensions(file);

  const original = await uploadVariant({
    blob: file,
    path: originalPath,
    contentType: file.type,
    width: originalDimensions.width,
    height: originalDimensions.height,
  });
  const [thumbnail, medium] = await Promise.all([
    resizeImage(file, 360, 0.78).then((variant) =>
      uploadVariant({ ...variant, path: thumbnailPath })
    ),
    resizeImage(file, 1200, 0.82).then((variant) =>
      uploadVariant({ ...variant, path: mediumPath })
    ),
  ]);

  return {
    original,
    thumbnail,
    medium,
    alt,
  };
}

export async function deleteProductImageAssets(assets: ProductImageAsset[]) {
  const storage = firebaseStorage;
  if (!storage) return;

  const paths = assets.flatMap((asset) => [
    asset.original.path,
    asset.thumbnail.path,
    asset.medium.path,
  ]);

  await Promise.allSettled(paths.map((path) => deleteObject(ref(storage, path))));
}
