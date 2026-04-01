"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { api } from "@/lib/api";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  githubConnected: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithGitHub: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [githubConnected, setGithubConnected] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const { data } = await api.get("/auth/me");
          setGithubConnected(!!data.github_connected);
        } catch {
          setGithubConnected(false);
        }
      } else {
        setGithubConnected(false);
      }
      setLoading(false);
    });
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const register = async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const signInWithGitHub = async () => {
    const provider = new GithubAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const refreshUser = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    try {
      // Force-refresh token so interceptor picks up latest claims
      await currentUser.getIdToken(true);
      const { data } = await api.get("/auth/me");
      setGithubConnected(!!data.github_connected);
    } catch {
      // ignore — stale state is fine, page will re-check
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, githubConnected, login, register, logout, refreshUser, signInWithGoogle, signInWithGitHub }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
