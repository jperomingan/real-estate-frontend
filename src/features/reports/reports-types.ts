export interface ReportQueryParams {
  dateFrom?: string;
  dateTo?: string;
  brokerId?: string;
}

export interface ReportsSummary {
  leads: {
    total: number;
  };

  properties: {
    total: number;
  };

  viewings: {
    total: number;
  };

  revenues: {
    totalAmount: number;
    totalRecords: number;
  };
}

export interface LeadSourceReportItem {
  source: string | null;
  count: number;
}

export interface StatusReportItem {
  status: string | null;
  count: number;
}

export interface RevenueStatusReportItem {
  paymentStatus: string | null;
  count: number;
}

export interface ReportsDashboardData {
  summary: ReportsSummary;
  leadSources: LeadSourceReportItem[];
  leadStatuses: StatusReportItem[];
  propertyStatuses: StatusReportItem[];
  viewingStatuses: StatusReportItem[];
  revenueStatuses: RevenueStatusReportItem[];
}

export type ReportExportType =
  | "summary"
  | "leads-sources"
  | "leads-statuses"
  | "properties-statuses"
  | "viewings-statuses"
  | "revenues-statuses";
