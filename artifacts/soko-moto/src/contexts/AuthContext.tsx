import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface AuthUser {
  id: number;
  name: string;
  phone: string;
  email?: string | null;
  loyaltyTier: "bronze" | "silver" | "gold";
  loyaltyPoints: number;
  totalBookings?: number;
  neighborhood?: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  requestOtp: (phone: string) => Promise<{ devMode: boolean; devHint?: string }>;
  verifyOtp: (phone: string, code: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  openLogin: () => void;
  closeLogin: () => void;
  isLoginOpen: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const fetchMe = useCallback(async () => {
    try {
      const res = await fetch(`${BASE}/api/auth/me`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json() as { user: AuthUser };
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const requestOtp = useCallback(async (phone: string) => {
    const res = await fetch(`${BASE}/api/auth/request-otp`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { error?: string };
      throw new Error(err.error ?? "Failed to send OTP");
    }
    return res.json() as Promise<{ devMode: boolean; devHint?: string }>;
  }, []);

  const verifyOtp = useCallback(async (phone: string, code: string, name?: string) => {
    const res = await fetch(`${BASE}/api/auth/verify-otp`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, code, name }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { error?: string };
      throw new Error(err.error ?? "Invalid OTP");
    }
    const data = await res.json() as { user: AuthUser };
    setUser(data.user);
    setIsLoginOpen(false);
  }, []);

  const logout = useCallback(async () => {
    await fetch(`${BASE}/api/auth/logout`, { method: "POST", credentials: "include" });
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      requestOtp,
      verifyOtp,
      logout,
      openLogin: () => setIsLoginOpen(true),
      closeLogin: () => setIsLoginOpen(false),
      isLoginOpen,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
