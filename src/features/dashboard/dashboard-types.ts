export interface StatusCount {
  status: string;
  count: number;
}

export interface BrokerSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface PropertyReference {
  id: string;
  title: string;
}

export interface RecentProperty {
  id: string;
  title: string;
  status: string;
  type: string;
  price: number | string;
  city: string;
  province: string;
  createdAt: string;
  broker: BrokerSummary;
}

export interface RecentLead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  source: string;
  status: string;
  budget: number | string | null;
  createdAt: string;
  property: PropertyReference | null;
  broker: BrokerSummary | null;
}

export interface RecentViewing {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  status: string;
  preferredDate: string;
  confirmedDate: string | null;
  createdAt: string;
  clientId: string | null;
  property: PropertyReference;
  broker: BrokerSummary | null;
}

export interface RecentRevenue {
  id: string;
  grossSaleAmount: number | string;
  commissionRate: number | string;
  commissionAmount: number | string;
  paymentReceived: number | string;
  paymentStatus: string;
  commissionStatus: string;
  saleDate: string;
  createdAt: string;
  property: PropertyReference;
  broker: BrokerSummary;
}

export interface DashboardSummary {
  role: string;
  scope: "GLOBAL" | "BROKER";

  filters: {
    dateFrom: string | null;
    dateTo: string | null;
    recentLimit: number;
  };

  properties: {
    total: number;
    byStatus: StatusCount[];
  };

  leads: {
    total: number;
    byStatus: StatusCount[];
  };

  viewings: {
    total: number;
    byStatus: StatusCount[];
  };

  revenue: {
    totalRecords: number;
    totalGrossSales: number;
    totalCommission: number;
    totalPaymentReceived: number;
    totalReceivable: number;
    byPaymentStatus: StatusCount[];
    byCommissionStatus: StatusCount[];
  };

  recent: {
    properties: RecentProperty[];
    leads: RecentLead[];
    viewings: RecentViewing[];
    revenues: RecentRevenue[];
  };
}

export interface DashboardSummaryResponse {
  success: boolean;
  message: string;
  data: DashboardSummary;
}

export interface DashboardSummaryParams {
  dateFrom?: string;
  dateTo?: string;
  recentLimit?: number;
}
