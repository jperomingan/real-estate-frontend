export type NotificationType =
  | "LEAD_CREATED"
  | "VIEWING_REQUESTED"
  | "VIEWING_UPDATED"
  | "REVENUE_CREATED"
  | "PROPERTY_UPDATED"
  | "ACCOUNT_APPROVED"
  | "ACCOUNT_REJECTED"
  | "GENERAL";

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | {
      [key: string]: JsonValue;
    };

export interface NotificationItem {
  id: string;
  targetUserId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: JsonValue;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

export interface NotificationListData {
  items: NotificationItem[];
  pagination: NotificationPagination;
}

export interface NotificationListParams {
  search?: string;
  type?: NotificationType;
  isRead?: boolean;
  page?: number;
  limit?: number;
}

export interface UnreadNotificationCount {
  count: number;
}

export interface MarkAllReadResult {
  updatedCount: number;
}

export interface DeleteNotificationResult {
  id: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
