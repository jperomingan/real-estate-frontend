export type DecimalValue =
  | number
  | string;

export type RevenuePaymentStatus =
  | "UNPAID"
  | "PARTIAL"
  | "PAID";

export type RevenueCommissionStatus =
  | "PENDING"
  | "RELEASED";

export interface RevenueProperty {
  id: string;
  title: string;
  status: string;
  price: DecimalValue;
  address: string;
  city: string;
  province: string;
}

export interface RevenueLead {
  id: string;
  firstName: string;
  lastName?: string | null;
  email?: string | null;
  phone: string;
  status: string;
}

export interface RevenueBroker {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
}

export interface RevenueRecord {
  id: string;

  propertyId: string;
  property: RevenueProperty;

  leadId?: string | null;
  lead?: RevenueLead | null;

  brokerId: string;
  broker: RevenueBroker;

  grossSaleAmount: DecimalValue;
  commissionRate: DecimalValue;
  commissionAmount: DecimalValue;
  paymentReceived: DecimalValue;

  paymentStatus:
    RevenuePaymentStatus;

  commissionStatus:
    RevenueCommissionStatus;

  saleDate: string;
  notes?: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface RevenuePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

export interface RevenueListData {
  items: RevenueRecord[];
  pagination: RevenuePagination;
}

export interface RevenueSummary {
  totalRecords: number;
  totalGrossSales: number;
  totalCommission: number;
  totalPaymentReceived: number;
  totalReceivable: number;

  unpaidCount: number;
  partiallyPaidCount: number;
  paidCount: number;

  pendingCommissionCount: number;
  releasedCommissionCount: number;
}

export interface RevenueListParams {
  search?: string;
  propertyId?: string;
  brokerId?: string;

  paymentStatus?:
    RevenuePaymentStatus;

  commissionStatus?:
    RevenueCommissionStatus;

  dateFrom?: string;
  dateTo?: string;

  page?: number;
  limit?: number;
}

export interface CreateRevenueInput {
  propertyId: string;
  leadId?: string;

  grossSaleAmount: number;
  commissionRate: number;
  paymentReceived?: number;

  commissionStatus?:
    RevenueCommissionStatus;

  saleDate: string;
  notes?: string;
}

export interface UpdateRevenuePaymentInput {
  paymentReceived: number;
  paymentStatus?:
    RevenuePaymentStatus;
}

export interface UpdateRevenueCommissionInput {
  commissionStatus:
    RevenueCommissionStatus;
}

export interface PropertyOption {
  id: string;
  title: string;
  status: string;
  price: DecimalValue;
  address: string;
  city: string;
  province: string;
}

export interface LeadOption {
  id: string;
  firstName: string;
  lastName?: string | null;
  phone: string;
  status: string;
  propertyId?: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
