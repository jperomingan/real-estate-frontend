export const LEAD_STATUSES = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "VIEWING_SCHEDULED",
  "NEGOTIATION",
  "CLOSED_WON",
  "CLOSED_LOST",
  "ARCHIVED",
] as const;

export type LeadStatus =
  (typeof LEAD_STATUSES)[number];

export const LEAD_SOURCES = [
  "WEBSITE",
  "FACEBOOK",
  "REFERRAL",
  "WALK_IN",
  "PHONE_CALL",
  "EMAIL",
  "OTHER",
] as const;

export type LeadSource =
  (typeof LEAD_SOURCES)[number];

export interface LeadProperty {
  id: string;
  title: string;
  price: number | string;
  city: string;
  province: string;
  status: string;
}

export interface LeadBroker {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
}

export interface Lead {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string;
  message: string | null;
  source: LeadSource;
  status: LeadStatus;
  budget: number | string | null;
  preferredDate: string | null;

  propertyId: string | null;
  property: LeadProperty | null;

  brokerId: string | null;
  broker: LeadBroker | null;

  clientId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface LeadListData {
  items: Lead[];
  pagination: Pagination;
}

export interface LeadListResponse {
  success: boolean;
  message: string;
  data: LeadListData;
}

export interface LeadMutationResponse {
  success: boolean;
  message: string;
  data: Lead;
}

export interface LeadListParams {
  search?: string;
  status?: LeadStatus;
  source?: LeadSource;
  propertyId?: string;
  brokerId?: string;
  page?: number;
  limit?: number;
}

export interface CreateLeadInput {
  firstName: string;
  lastName?: string;
  email?: string;
  phone: string;
  message?: string;
  source: LeadSource;
  budget?: number;
  preferredDate?: string;
  propertyId?: string;
  brokerId?: string;
}
