"use client";

import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { firebaseStorage, isFirebaseConfigured } from "@/lib/firebase";

const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const maxImageSize = 8 * 1024 * 1024;

function requireFirebaseStorage() {
  if (!isFirebaseConfigured || !firebaseStorage) {
    throw new Error("사진 업로드를 위해 Firebase Storage 설정이 필요해요.");
  }
  return firebaseStorage;
}

function validateImageFile(file: File) {
  if (!allowedImageTypes.has(file.type)) {
    throw new Error("JPG, PNG, WebP, AVIF 이미지만 업로드할 수 있어요.");
  }
  if (file.size > maxImageSize) {
    throw new Error("사진은 파일당 8MB 이하로 올려 주세요.");
  }
}

async function resizeReviewImage(file: File) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error("이미지를 처리하지 못했어요.");
  }

  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/webp", 0.82);
  });

  if (!blob) {
    throw new Error("이미지 파일을 만들지 못했어요.");
  }

  return blob;
}

export async function uploadReviewPhoto({
  file,
  userId,
  productId,
  index,
}: {
  file: File;
  userId: string;
  productId: string;
  index: number;
}) {
  validateImageFile(file);
  const storage = requireFirebaseStorage();
  const blob = await resizeReviewImage(file);
  const path = `reviews/${userId}/${productId}/${Date.now()}-${index}.webp`;
  const snapshot = await uploadBytes(ref(storage, path), blob, {
    contentType: "image/webp",
    cacheControl: "public,max-age=31536000,immutable",
  });

  return getDownloadURL(snapshot.ref);
}
