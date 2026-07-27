export type AdminUserRole =
  | "ADMIN"
  | "BROKER"
  | "CLIENT";

export type AdminUserStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "ACTIVE"
  | "INACTIVE";

export interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: AdminUserRole;
  status: AdminUserStatus;
  phone?: string | null;
  avatarUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUserPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

export interface AdminUserListData {
  items: AdminUser[];
  pagination: AdminUserPagination;
}

export interface AdminUserListParams {
  search?: string;
  role?: AdminUserRole;
  status?: AdminUserStatus;
  page?: number;
  limit?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface DeleteApiResponse {
  success: boolean;
  message: string;
  data?: Record<string, never>;
}
