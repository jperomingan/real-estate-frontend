import type { AuthUser } from "@/types/auth";

const ACCESS_TOKEN_KEY = "accessToken";
const USER_KEY = "authUser";

function notifyAuthChange(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new Event("auth-change"),
    );
  }
}

export const authStorage = {
  getAccessToken(): string | null {
    if (typeof window === "undefined") {
      return null;
    }

    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },

  setAccessToken(
    accessToken: string,
  ): void {
    if (typeof window === "undefined") {
      return;
    }

    localStorage.setItem(
      "accessToken",
      accessToken,
    );

    notifyAuthChange();
  },

  getUser(): AuthUser | null {
    if (typeof window === "undefined") {
      return null;
    }

    const value = localStorage.getItem(USER_KEY);

    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value) as AuthUser;
    } catch {
      localStorage.removeItem(USER_KEY);
      return null;
    }
  },

  setUser(user: unknown): void {
    if (typeof window === "undefined") {
      return;
    }

    localStorage.setItem(
      "authUser",
      JSON.stringify(user),
    );

    notifyAuthChange();
  },

  clear(): void {
    if (typeof window === "undefined") {
      return;
    }

    localStorage.removeItem(
      "accessToken",
    );

    localStorage.removeItem(
      "authUser",
    );

    notifyAuthChange();
  },
};
