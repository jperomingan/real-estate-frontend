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

function subscribeToAuth(
  callback: () => void,
): () => void {
  const handleStorage = (
    event: StorageEvent,
  ) => {
    if (
      event.key === null ||
      event.key === "accessToken"
    ) {
      callback();
    }
  };

  const handleAuthChange = () => {
    callback();
  };

  window.addEventListener(
    "storage",
    handleStorage,
  );

  window.addEventListener(
    "auth-change",
    handleAuthChange,
  );

  return () => {
    window.removeEventListener(
      "storage",
      handleStorage,
    );

    window.removeEventListener(
      "auth-change",
      handleAuthChange,
    );
  };
}

function getAccessTokenSnapshot():
  | string
  | null {
  return authStorage.getAccessToken();
}

function getServerAccessTokenSnapshot(): null {
  return null;
}

function subscribeToHydration(): () => void {
  return () => { };
}

function getClientHydrationSnapshot(): true {
  return true;
}

function getServerHydrationSnapshot(): false {
  return false;
}

export function AuthGuard({
  children,
}: AuthGuardProps) {
  const router = useRouter();

  const isHydrated =
    useSyncExternalStore(
      subscribeToHydration,
      getClientHydrationSnapshot,
      getServerHydrationSnapshot,
    );

  const accessToken =
    useSyncExternalStore(
      subscribeToAuth,
      getAccessTokenSnapshot,
      getServerAccessTokenSnapshot,
    );

  useEffect(() => {
    if (
      isHydrated &&
      !accessToken
    ) {
      router.replace("/login");
    }
  }, [
    accessToken,
    isHydrated,
    router,
  ]);

  if (
    !isHydrated ||
    !accessToken
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 text-slate-600">
          <LoaderCircle
            size={22}
            className="animate-spin"
          />

          <span>
            Checking authentication...
          </span>
        </div>
      </div>
    );
  }

  return children;
}
