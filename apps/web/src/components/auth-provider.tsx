"use client";

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import type { AuthUser } from "@/lib/api";
import { clearAccessToken, login, refreshSession, register, setAccessToken } from "@/lib/api";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  signIn(input: { email: string; password: string }): Promise<void>;
  signUp(input: { email: string; password: string; displayName?: string }): Promise<void>;
  signOut(): void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      try {
        const session = await refreshSession();
        if (active) {
          setUser(session.user);
          setStatus("authenticated");
        }
      } catch {
        if (active) {
          clearAccessToken();
          setUser(null);
          setStatus("unauthenticated");
        }
      }
    }

    void restoreSession();

    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      async signIn(input) {
        const session = await login(input);
        setUser(session.user);
        setStatus("authenticated");
      },
      async signUp(input) {
        const session = await register(input);
        setUser(session.user);
        setStatus("authenticated");
      },
      signOut() {
        clearAccessToken();
        setAccessToken(null);
        setUser(null);
        setStatus("unauthenticated");
      },
    }),
    [status, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return value;
}
