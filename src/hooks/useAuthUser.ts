"use client";

import { useEffect, useState } from "react";
import { observeAuthUser, type AuthUser } from "@/lib/auth";

export function useAuthUser() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    return observeAuthUser((next) => {
      setUser(next);
      setReady(true);
    });
  }, []);

  return { user, ready, isLoggedIn: Boolean(user) };
}
