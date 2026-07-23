import {
  apiClient,
} from "@/lib/api-client";

import type {
  ApiResponse,
  DeleteNotificationResult,
  MarkAllReadResult,
  NotificationItem,
  NotificationListData,
  NotificationListParams,
  UnreadNotificationCount,
} from "./notifications-types";

function cleanParams(
  values: Record<
    string,
    unknown
  >,
) {
  return Object.fromEntries(
    Object.entries(values).filter(
      ([, value]) =>
        value !== undefined &&
        value !== "",
    ),
  );
}

export const notificationsService = {
  async list(
    params:
      NotificationListParams = {},
  ): Promise<NotificationListData> {
    const response =
      await apiClient.get<
        ApiResponse<NotificationListData>
      >(
        "/notifications",
        {
          params: cleanParams({
            search: params.search,
            type: params.type,
            isRead: params.isRead,
            page: params.page ?? 1,
            limit:
              params.limit ?? 10,
          }),
        },
      );

    return response.data.data;
  },

  async unreadCount(): Promise<number> {
    const response =
      await apiClient.get<
        ApiResponse<UnreadNotificationCount>
      >(
        "/notifications/unread-count",
      );

    return response.data.data
      .count;
  },

  async markRead(
    id: string,
  ): Promise<NotificationItem> {
    const response =
      await apiClient.patch<
        ApiResponse<NotificationItem>
      >(
        `/notifications/${id}/read`,
      );

    return response.data.data;
  },

  async markAllRead(): Promise<
    MarkAllReadResult
  > {
    const response =
      await apiClient.patch<
        ApiResponse<MarkAllReadResult>
      >(
        "/notifications/read-all",
      );

    return response.data.data;
  },

  async delete(
    id: string,
  ): Promise<
    DeleteNotificationResult
  > {
    const response =
      await apiClient.delete<
        ApiResponse<DeleteNotificationResult>
      >(
        `/notifications/${id}`,
      );

    return response.data.data;
  },
};
