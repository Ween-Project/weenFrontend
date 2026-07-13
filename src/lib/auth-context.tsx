"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import type { Account, LoginInput, RegistrationInput, UserRole } from "@/types";

type AuthContextValue = {
  account: Account | null;
  roles: UserRole[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegistrationInput) => Promise<void>;
  logout: (reason?: string) => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [account, setAccount] = useState<Account | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadSession = useCallback(async () => {
    try {
      const result = await authApi.session();
      setAccount(result.account);
    } catch {
      setAccount(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSession();
  }, [loadSession]);

  const logout = useCallback(
    async (reason?: string) => {
      try {
        await authApi.logout();
      } finally {
        setAccount(null);
        const suffix = reason ? `?message=${encodeURIComponent(reason)}` : "";
        router.replace(`/login${suffix}`);
      }
    },
    [router],
  );

  useEffect(() => {
    const handleUnauthorized = () => {
      void logout("Your session expired. Please sign in again.");
    };
    window.addEventListener("ween:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("ween:unauthorized", handleUnauthorized);
  }, [logout]);

  const value = useMemo<AuthContextValue>(
    () => ({
      account,
      roles: account ? [account.role] : [],
      isAuthenticated: Boolean(account),
      isLoading,
      login: async (input) => {
        const result = await authApi.login(input);
        setAccount(result.account);
      },
      register: async (input) => {
        const result = await authApi.register(input);
        setAccount(result.account);
      },
      logout,
      refresh: loadSession,
    }),
    [account, isLoading, logout, loadSession],
  );

  useEffect(() => {
    if (!isLoading && account && (pathname === "/login" || pathname === "/register")) {
      router.replace("/dashboard");
    }
  }, [account, isLoading, pathname, router]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
