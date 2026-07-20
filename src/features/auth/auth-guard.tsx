"use client";

import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import { authStorage } from "@/features/auth/auth-storage";

interface AuthGuardProps {
  children: ReactNode;
}

function subscribeToAuth(): () => void {
  return () => {};
}

function getAccessTokenSnapshot(): string | null {
  return authStorage.getAccessToken();
}

function getServerAccessTokenSnapshot(): null {
  return null;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();

  const accessToken = useSyncExternalStore(
    subscribeToAuth,
    getAccessTokenSnapshot,
    getServerAccessTokenSnapshot,
  );

  useEffect(() => {
    if (!accessToken) {
      router.replace("/login");
    }
  }, [accessToken, router]);

  if (!accessToken) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 text-slate-600">
          <LoaderCircle
            size={22}
            className="animate-spin"
          />

          <span>Checking authentication...</span>
        </div>
      </div>
    );
  }

  return children;
}
