import { apiClient } from "@/lib/api-client";

import type {
  DashboardSummary,
  DashboardSummaryParams,
  DashboardSummaryResponse,
} from "./dashboard-types";

export const dashboardService = {
  async getSummary(
    params: DashboardSummaryParams = {},
  ): Promise<DashboardSummary> {
    const response =
      await apiClient.get<DashboardSummaryResponse>(
        "/dashboard/summary",
        {
          params: {
            recentLimit:
              params.recentLimit ?? 5,
            ...(params.dateFrom
              ? {
                dateFrom:
                  params.dateFrom,
              }
              : {}),
            ...(params.dateTo
              ? {
                dateTo:
                  params.dateTo,
              }
              : {}),
          },
        },
      );

    return response.data.data;
  },
};
