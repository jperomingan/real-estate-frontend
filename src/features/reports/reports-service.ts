import { apiClient } from "@/lib/api-client";

import type {
  LeadSourceReportItem,
  ReportExportType,
  ReportQueryParams,
  ReportsDashboardData,
  ReportsSummary,
  RevenueStatusReportItem,
  StatusReportItem,
} from "./reports-types";

const EXPORT_FILENAMES: Record<
  ReportExportType,
  string
> = {
  summary:
    "reports-summary.csv",

  "leads-sources":
    "reports-leads-sources.csv",

  "leads-statuses":
    "reports-leads-statuses.csv",

  "properties-statuses":
    "reports-properties-statuses.csv",

  "viewings-statuses":
    "reports-viewings-statuses.csv",

  "revenues-statuses":
    "reports-revenues-statuses.csv",
};

function removeUndefinedValues(
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

function buildParams(
  params: ReportQueryParams,
) {
  return removeUndefinedValues({
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    brokerId: params.brokerId,
  });
}

function downloadBlob(
  blob: Blob,
  filename: string,
) {
  const objectUrl =
    window.URL.createObjectURL(blob);

  const link =
    document.createElement("a");

  link.href = objectUrl;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.URL.revokeObjectURL(
    objectUrl,
  );
}

export const reportsService = {
  async getDashboardData(
    params: ReportQueryParams = {},
  ): Promise<ReportsDashboardData> {
    const requestConfig = {
      params: buildParams(params),
    };

    const [
      summaryResponse,
      leadSourcesResponse,
      leadStatusesResponse,
      propertyStatusesResponse,
      viewingStatusesResponse,
      revenueStatusesResponse,
    ] = await Promise.all([
      apiClient.get<ReportsSummary>(
        "/reports/summary",
        requestConfig,
      ),

      apiClient.get<
        LeadSourceReportItem[]
      >(
        "/reports/leads/sources",
        requestConfig,
      ),

      apiClient.get<
        StatusReportItem[]
      >(
        "/reports/leads/statuses",
        requestConfig,
      ),

      apiClient.get<
        StatusReportItem[]
      >(
        "/reports/properties/statuses",
        requestConfig,
      ),

      apiClient.get<
        StatusReportItem[]
      >(
        "/reports/viewings/statuses",
        requestConfig,
      ),

      apiClient.get<
        RevenueStatusReportItem[]
      >(
        "/reports/revenues/statuses",
        requestConfig,
      ),
    ]);

    return {
      summary:
        summaryResponse.data,

      leadSources:
        leadSourcesResponse.data,

      leadStatuses:
        leadStatusesResponse.data,

      propertyStatuses:
        propertyStatusesResponse.data,

      viewingStatuses:
        viewingStatusesResponse.data,

      revenueStatuses:
        revenueStatusesResponse.data,
    };
  },

  async exportCsv(
    type: ReportExportType,
    params: ReportQueryParams = {},
  ): Promise<void> {
    const response =
      await apiClient.get<Blob>(
        `/reports/export/${type}.csv`,
        {
          params: buildParams(params),
          responseType: "blob",
        },
      );

    downloadBlob(
      response.data,
      EXPORT_FILENAMES[type],
    );
  },
};
