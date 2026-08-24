"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuthUser } from "./useAuthUser";

export function useAccountResource<T>(loader: () => Promise<T>, empty: T) {
  const { user, ready } = useAuthUser();
  const emptyRef = useRef(empty);
  const [data, setData] = useState<T>(empty);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const load = useCallback(async () => {
    if (!ready) return;
    if (!user?.uid) {
      setData(emptyRef.current);
      setStatus("ready");
      return;
    }
    setStatus("loading");
    setError("");
    try {
      setData(await loader());
      setStatus("ready");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "불러오지 못했어요.");
      setStatus("error");
    }
  }, [loader, ready, reloadKey, user?.uid]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    data,
    status,
    error,
    retry: () => setReloadKey((value) => value + 1),
    reload: () => setReloadKey((value) => value + 1),
    user,
    ready,
  };
}
