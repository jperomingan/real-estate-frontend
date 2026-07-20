export const PROPERTY_TYPES = [
  "HOUSE_AND_LOT",
  "CONDOMINIUM",
  "LOT_ONLY",
  "APARTMENT",
  "TOWNHOUSE",
  "COMMERCIAL",
  "AGRICULTURAL",
  "INDUSTRIAL",
] as const;

export type PropertyType =
  (typeof PROPERTY_TYPES)[number];

export const PROPERTY_STATUSES = [
  "DRAFT",
  "PUBLISHED",
  "RESERVED",
  "SOLD",
  "ARCHIVED",
] as const;

export type PropertyStatus =
  (typeof PROPERTY_STATUSES)[number];

export const PROPERTY_SORT_FIELDS = [
  "createdAt",
  "price",
  "title",
  "city",
] as const;

export type PropertySortField =
  (typeof PROPERTY_SORT_FIELDS)[number];

export type SortOrder = "asc" | "desc";

export interface Property {
  id: string;
  title: string;
  description: string | null;

  type: PropertyType;
  status: PropertyStatus;

  price: number | string;

  lotAreaSqm: number | string | null;
  floorAreaSqm: number | string | null;

  bedrooms: number | null;
  bathrooms: number | null;

  address: string;
  barangay: string | null;
  city: string;
  province: string;
  zipCode: string | null;

  latitude: number | string | null;
  longitude: number | string | null;

  brokerId: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface PropertyPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PropertyListData {
  items: Property[];
  pagination: PropertyPagination;
}

export interface PropertyListResponse {
  success: boolean;
  message: string;
  data: PropertyListData;
}

export interface PropertyListParams {
  search?: string;
  type?: PropertyType;
  status?: PropertyStatus;

  city?: string;
  province?: string;
  barangay?: string;

  minPrice?: number;
  maxPrice?: number;

  minLotAreaSqm?: number;
  maxLotAreaSqm?: number;

  minFloorAreaSqm?: number;
  maxFloorAreaSqm?: number;

  bedrooms?: number;
  bathrooms?: number;

  sortBy?: PropertySortField;
  sortOrder?: SortOrder;

  page?: number;
  limit?: number;
}

export interface CreatePropertyInput {
  title: string;
  description?: string;

  type: PropertyType;
  status: PropertyStatus;

  price: number;
  lotAreaSqm?: number;
  floorAreaSqm?: number;

  bedrooms?: number;
  bathrooms?: number;

  address: string;
  barangay?: string;
  city: string;
  province: string;
  zipCode?: string;

  latitude?: number;
  longitude?: number;

  brokerId?: string;
  imageUrls?: string[];
}

export interface PropertyMutationResponse {
  success?: boolean;
  message: string;
  data: Property;
}
