"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  authStorage,
} from "@/features/auth/auth-storage";
import type {
  AuthUser,
} from "@/types/auth";

export function useAuthUser(): AuthUser | null {
  const [user, setUser] =
    useState<AuthUser | null>(
      null,
    );

  useEffect(() => {
    function updateUser() {
      setUser(
        authStorage.getUser(),
      );
    }

    function handleStorage(
      event: StorageEvent,
    ) {
      if (
        event.key === null ||
        event.key === "authUser"
      ) {
        updateUser();
      }
    }

    updateUser();

    window.addEventListener(
      "auth-change",
      updateUser,
    );

    window.addEventListener(
      "storage",
      handleStorage,
    );

    return () => {
      window.removeEventListener(
        "auth-change",
        updateUser,
      );

      window.removeEventListener(
        "storage",
        handleStorage,
      );
    };
  }, []);

  return user;
}
