"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuthUser } from "@/hooks/useAuthUser";
import {
  clearGuestWishlist,
  createWishlistRecord,
  deleteWishlistRecord,
  fetchRemoteWishlist,
  guestWishlistOwnerId,
  mergeWishlistRecords,
  persistWishlistRecord,
  persistWishlistRecords,
  readWishlistRecords,
  wishlistOwnerId,
  writeWishlistRecords,
  WISHLIST_CHANGE,
  type WishlistAlertPrefs,
  type WishlistRecord,
} from "@/lib/wishlist";
import type { Product } from "@/types/product";

type WishlistStatus = "loading" | "ready" | "error";

type WishlistContextValue = {
  ownerId: string;
  records: WishlistRecord[];
  status: WishlistStatus;
  error: string;
  count: number;
  isWished: (productId: string) => boolean;
  getRecord: (productId: string) => WishlistRecord | undefined;
  toggle: (product: Product) => Promise<WishlistRecord | null>;
  remove: (productId: string) => Promise<WishlistRecord | null>;
  restore: (record: WishlistRecord) => Promise<void>;
  removeMany: (productIds: string[]) => Promise<WishlistRecord[]>;
  updateAlerts: (productId: string, alerts: WishlistAlertPrefs) => Promise<void>;
  retry: () => void;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user, ready } = useAuthUser();
  const ownerId = wishlistOwnerId(user?.uid);
  const [records, setRecords] = useState<WishlistRecord[]>([]);
  const [status, setStatus] = useState<WishlistStatus>("loading");
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!ready) return;

    let cancelled = false;

    async function load() {
      setStatus("loading");
      setError("");

      try {
        const local = readWishlistRecords(ownerId);
        const guest = ownerId === guestWishlistOwnerId()
          ? []
          : readWishlistRecords(guestWishlistOwnerId());

        if (!cancelled) {
          setRecords(mergeWishlistRecords(local, guest));
        }

        if (user?.uid) {
          const remote = await fetchRemoteWishlist(user.uid);
          const merged = mergeWishlistRecords(mergeWishlistRecords(remote, local), guest);
          if (!cancelled) {
            setRecords(merged);
            writeWishlistRecords(user.uid, merged);
          }
          if (guest.length > 0) {
            await persistWishlistRecords(user.uid, merged);
            clearGuestWishlist();
          }
        }

        if (!cancelled) setStatus("ready");
      } catch (loadError) {
        if (!cancelled) {
          setStatus("error");
          setError(
            loadError instanceof Error
              ? loadError.message
              : "찜 목록을 불러오지 못했어요."
          );
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [ownerId, ready, reloadKey, user?.uid]);

  useEffect(() => {
    const handleChange = (event: Event) => {
      const detail = (event as CustomEvent<{ ownerId: string; records: WishlistRecord[] }>)
        .detail;
      if (detail?.ownerId === ownerId) {
        setRecords(detail.records);
      }
    };

    window.addEventListener(WISHLIST_CHANGE, handleChange);
    return () => window.removeEventListener(WISHLIST_CHANGE, handleChange);
  }, [ownerId]);

  const isWished = useCallback(
    (productId: string) => records.some((item) => item.productId === productId),
    [records]
  );

  const getRecord = useCallback(
    (productId: string) => records.find((item) => item.productId === productId),
    [records]
  );

  const toggle = useCallback(
    async (product: Product) => {
      const existing = records.find((item) => item.productId === product.id);
      if (existing) {
        const next = records.filter((item) => item.productId !== product.id);
        setRecords(next);
        writeWishlistRecords(ownerId, next);
        try {
          await deleteWishlistRecord(ownerId, product.id);
          return existing;
        } catch (toggleError) {
          setRecords(records);
          writeWishlistRecords(ownerId, records);
          throw toggleError;
        }
      }

      const record = createWishlistRecord(product);
      const next = mergeWishlistRecords(records, [record]);
      setRecords(next);
      writeWishlistRecords(ownerId, next);
      try {
        await persistWishlistRecord(ownerId, record);
        return null;
      } catch (toggleError) {
        setRecords(records);
        writeWishlistRecords(ownerId, records);
        throw toggleError;
      }
    },
    [ownerId, records]
  );

  const remove = useCallback(
    async (productId: string) => {
      const existing = records.find((item) => item.productId === productId);
      if (!existing) return null;

      const next = records.filter((item) => item.productId !== productId);
      setRecords(next);
      writeWishlistRecords(ownerId, next);

      try {
        await deleteWishlistRecord(ownerId, productId);
        return existing;
      } catch (removeError) {
        setRecords(records);
        writeWishlistRecords(ownerId, records);
        throw removeError;
      }
    },
    [ownerId, records]
  );

  const restore = useCallback(
    async (record: WishlistRecord) => {
      const next = mergeWishlistRecords(records, [record]);
      setRecords(next);
      writeWishlistRecords(ownerId, next);
      await persistWishlistRecord(ownerId, record);
    },
    [ownerId, records]
  );

  const removeMany = useCallback(
    async (productIds: string[]) => {
      const idSet = new Set(productIds);
      const removed = records.filter((item) => idSet.has(item.productId));
      const next = records.filter((item) => !idSet.has(item.productId));
      setRecords(next);
      writeWishlistRecords(ownerId, next);

      try {
        await Promise.all(removed.map((item) => deleteWishlistRecord(ownerId, item.productId)));
        return removed;
      } catch (removeError) {
        setRecords(records);
        writeWishlistRecords(ownerId, records);
        throw removeError;
      }
    },
    [ownerId, records]
  );

  const updateAlerts = useCallback(
    async (productId: string, alerts: WishlistAlertPrefs) => {
      const current = records.find((item) => item.productId === productId);
      if (!current) return;

      const nextRecord = { ...current, alerts };
      const next = records.map((item) => (item.productId === productId ? nextRecord : item));
      setRecords(next);
      writeWishlistRecords(ownerId, next);
      await persistWishlistRecord(ownerId, nextRecord);
    },
    [ownerId, records]
  );

  const value = useMemo<WishlistContextValue>(
    () => ({
      ownerId,
      records,
      status,
      error,
      count: records.length,
      isWished,
      getRecord,
      toggle,
      remove,
      restore,
      removeMany,
      updateAlerts,
      retry: () => setReloadKey((value) => value + 1),
    }),
    [
      error,
      getRecord,
      isWished,
      ownerId,
      records,
      remove,
      removeMany,
      restore,
      status,
      toggle,
      updateAlerts,
    ]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist는 WishlistProvider 안에서 사용해야 합니다.");
  }
  return context;
}
