export const VIEWING_STATUSES = [
  "REQUESTED",
  "CONFIRMED",
  "RESCHEDULED",
  "COMPLETED",
  "CANCELLED",
  "DECLINED",
] as const;

export type ViewingStatus =
  (typeof VIEWING_STATUSES)[number];

export interface ViewingPerson {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
}

export interface ViewingProperty {
  id: string;
  title: string;
  status: string;
  price: string | number;
  address: string;
  barangay: string | null;
  city: string;
  province: string;
}

export interface ViewingAppointment {
  id: string;

  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string;
  message: string | null;

  preferredDate: string;
  confirmedDate: string | null;

  status: ViewingStatus;
  notes: string | null;

  propertyId: string;
  property: ViewingProperty;

  brokerId: string;
  broker: ViewingPerson;

  clientId: string | null;
  client: ViewingPerson | null;

  createdAt: string;
  updatedAt: string;
}

export interface ViewingPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ViewingListData {
  items: ViewingAppointment[];
  pagination: ViewingPagination;
}

export interface ViewingListResponse {
  success: boolean;
  message: string;
  data: ViewingListData;
}

export interface ViewingListParams {
  search?: string;
  status?: ViewingStatus;
  propertyId?: string;
  brokerId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface ViewingMutationResponse {
  success: boolean;
  message: string;
  data: ViewingAppointment;
}
