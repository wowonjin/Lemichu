"use client";

import { useCallback, useRef } from "react";

type DaumPostcodeData = {
  zonecode: string;
  roadAddress: string;
  jibunAddress: string;
  userSelectedType: "R" | "J";
  buildingName?: string;
};

type DaumPostcodeConstructor = new (options: {
  oncomplete: (data: DaumPostcodeData) => void;
  width?: string | number;
  height?: string | number;
}) => { open: () => void };

declare global {
  interface Window {
    daum?: {
      Postcode: DaumPostcodeConstructor;
    };
  }
}

const SCRIPT_SRC =
  "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";

function loadDaumPostcodeScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("WINDOW_UNAVAILABLE"));
  }
  if (window.daum?.Postcode) return Promise.resolve();

  const existing = document.querySelector<HTMLScriptElement>(
    `script[src="${SCRIPT_SRC}"]`
  );
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("POSTCODE_SCRIPT_FAILED")),
        { once: true }
      );
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("POSTCODE_SCRIPT_FAILED"));
    document.head.appendChild(script);
  });
}

export function useDaumPostcode() {
  const loadingRef = useRef(false);

  const openPostcode = useCallback(
    async (onComplete: (result: { postalCode: string; address1: string }) => void) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      try {
        await loadDaumPostcodeScript();
        if (!window.daum?.Postcode) {
          throw new Error("POSTCODE_UNAVAILABLE");
        }
        new window.daum.Postcode({
          oncomplete: (data) => {
            const base =
              data.userSelectedType === "R" ? data.roadAddress : data.jibunAddress;
            const building =
              data.buildingName && data.buildingName.trim()
                ? ` (${data.buildingName})`
                : "";
            onComplete({
              postalCode: data.zonecode,
              address1: `${base}${building}`,
            });
          },
        }).open();
      } finally {
        loadingRef.current = false;
      }
    },
    []
  );

  return { openPostcode };
}
