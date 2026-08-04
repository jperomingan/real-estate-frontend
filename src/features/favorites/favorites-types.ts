export interface FavoritePropertyImage {
  id?: string;
  url: string;
}

export interface FavoriteProperty {
  id: string;
  title: string;
  status: string;
  city: string;
  province: string;

  description?: string | null;
  type?: string;
  price?: number | string;

  lotAreaSqm?: number | string | null;
  floorAreaSqm?: number | string | null;

  bedrooms?: number | null;
  bathrooms?: number | null;

  images?: FavoritePropertyImage[];
  imageUrls?: string[];

  createdAt?: string;
  updatedAt?: string;
}

export interface FavoriteItem {
  id: string;
  userId: string;
  propertyId: string;
  property: FavoriteProperty;
  createdAt: string;
}

export interface FavoritesPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

export interface FavoritesListData {
  items: FavoriteItem[];
  pagination: FavoritesPagination;
}

export interface FavoriteStatusData {
  propertyId: string;
  isFavorited: boolean;
}

export interface FavoriteListParams {
  search?: string;
  city?: string;
  province?: string;
  page?: number;
  limit?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
