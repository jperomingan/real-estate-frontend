import axios from "axios";

import {
  authStorage,
} from "@/features/auth/auth-storage";

const apiUrl =
  process.env.NEXT_PUBLIC_API_URL;

if (!apiUrl) {
  throw new Error(
    "NEXT_PUBLIC_API_URL is missing. Add it to .env.local.",
  );
}

export const apiClient =
  axios.create({
    baseURL: apiUrl,
    headers: {
      "Content-Type":
        "application/json",
    },
    timeout: 15_000,
  });

apiClient.interceptors.request.use(
  (config) => {
    if (
      typeof window ===
      "undefined"
    ) {
      return config;
    }

    const requestUrl =
      config.url ?? "";

    const isLoginRequest =
      requestUrl.includes(
        "/auth/login",
      );

    if (!isLoginRequest) {
      const accessToken =
        authStorage
          .getAccessToken();

      if (accessToken) {
        config.headers.Authorization =
          `Bearer ${accessToken}`;
      }
    }

    return config;
  },
);

apiClient.interceptors.response.use(
  (response) => response,

  (error: unknown) => {
    if (
      axios.isAxiosError(
        error,
      ) &&
      error.response?.status ===
        401 &&
      typeof window !==
        "undefined"
    ) {
      const requestUrl =
        error.config?.url ?? "";

      const isLoginRequest =
        requestUrl.includes(
          "/auth/login",
        );

      if (!isLoginRequest) {
        authStorage.clear();

        if (
          window.location
            .pathname !==
          "/login"
        ) {
          window.location.replace(
            "/login",
          );
        }
      }
    }

    return Promise.reject(
      error,
    );
  },
);
