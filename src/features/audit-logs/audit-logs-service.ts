import {
  apiClient,
} from "@/lib/api-client";

import type {
  ApiResponse,
  AuditListData,
  AuditListParams,
  AuditLogItem,
} from "./audit-log-types";

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

export const auditLogsService = {
  async list(
    params:
      AuditListParams = {},
  ): Promise<AuditListData> {
    const response =
      await apiClient.get<
        ApiResponse<AuditListData>
      >(
        "/audit-logs",
        {
          params: cleanParams({
            action:
              params.action,

            resourceType:
              params.resourceType,

            resourceId:
              params.resourceId,

            actorUserId:
              params.actorUserId,

            dateFrom:
              params.dateFrom,

            dateTo:
              params.dateTo,

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
  ): Promise<AuditLogItem> {
    const response =
      await apiClient.get<
        ApiResponse<AuditLogItem>
      >(
        `/audit-logs/${id}`,
      );

    return response.data.data;
  },
};
