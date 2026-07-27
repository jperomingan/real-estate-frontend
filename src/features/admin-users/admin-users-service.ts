import {
  apiClient,
} from "@/lib/api-client";

import type {
  AdminUser,
  AdminUserListData,
  AdminUserListParams,
  AdminUserStatus,
  ApiResponse,
  DeleteApiResponse,
} from "./admin-user-types";

function cleanParams(
  values: Record<string, unknown>,
) {
  return Object.fromEntries(
    Object.entries(values).filter(
      ([, value]) =>
        value !== undefined &&
        value !== "",
    ),
  );
}

export const adminUsersService = {
  async list(
    params:
      AdminUserListParams = {},
  ): Promise<AdminUserListData> {
    const response =
      await apiClient.get<
        ApiResponse<AdminUserListData>
      >(
        "/admin/users",
        {
          params: cleanParams({
            search:
              params.search,

            role:
              params.role,

            status:
              params.status,

            page:
              params.page ?? 1,

            limit:
              params.limit ?? 10,
          }),
        },
      );

    return response.data.data;
  },

  async getById(
    id: string,
  ): Promise<AdminUser> {
    const response =
      await apiClient.get<
        ApiResponse<AdminUser>
      >(
        `/admin/users/${id}`,
      );

    return response.data.data;
  },

  async approve(
    id: string,
  ): Promise<AdminUser> {
    const response =
      await apiClient.patch<
        ApiResponse<AdminUser>
      >(
        `/admin/users/${id}/approve`,
      );

    return response.data.data;
  },

  async reject(
    id: string,
  ): Promise<AdminUser> {
    const response =
      await apiClient.patch<
        ApiResponse<AdminUser>
      >(
        `/admin/users/${id}/reject`,
      );

    return response.data.data;
  },

  async updateStatus(
    id: string,
    status: AdminUserStatus,
  ): Promise<AdminUser> {
    const response =
      await apiClient.patch<
        ApiResponse<AdminUser>
      >(
        `/admin/users/${id}/status`,
        {
          status,
        },
      );

    return response.data.data;
  },

  async delete(
    id: string,
  ): Promise<void> {
    await apiClient.delete<
      DeleteApiResponse
    >(
      `/admin/users/${id}`,
    );
  },
};
