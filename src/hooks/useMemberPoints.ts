"use client";

import { useEffect, useState } from "react";
import { fetchAccountBenefits } from "@/lib/accountBenefits";
import { useAuthUser } from "@/hooks/useAuthUser";
import { POINTS_CHANGED_EVENT } from "@/lib/points";

export function useMemberPoints() {
  const { user, ready } = useAuthUser();
  const [points, setPoints] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const refresh = () => setReloadKey((value) => value + 1);
    window.addEventListener(POINTS_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(POINTS_CHANGED_EVENT, refresh);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!user?.uid) {
      setPoints(0);
      return;
    }

    let cancelled = false;
    fetchAccountBenefits(user.uid)
      .then((benefits) => {
        if (!cancelled) setPoints(benefits.points);
      })
      .catch(() => {
        if (!cancelled) setPoints(0);
      });

    return () => {
      cancelled = true;
    };
  }, [ready, reloadKey, user?.uid]);

  return points;
}
