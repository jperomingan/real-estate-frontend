import { apiClient } from "@/lib/api-client";
import type {
  AuthUser,
  LoginCredentials,
  LoginResult,
} from "@/types/auth";

interface LoginApiResponse {
  success: boolean;
  message: string;
  data: {
    user: AuthUser;
    token: string;
  };
}

export const authService = {
  async login(
    credentials: LoginCredentials,
  ): Promise<LoginResult> {
    const response = await apiClient.post<LoginApiResponse>(
      "/auth/login",
      credentials,
    );

    const result = response.data;

    if (!result.success || !result.data?.token) {
      throw new Error(
        result.message || "Login failed.",
      );
    }

    return {
      accessToken: result.data.token,
      user: result.data.user,
    };
  },
};
