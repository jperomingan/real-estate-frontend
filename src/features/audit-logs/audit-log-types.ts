export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "APPROVE"
  | "REJECT"
  | "LOGIN"
  | "LOGOUT"
  | "STATUS_CHANGE";

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | {
      [key: string]: JsonValue;
    };

export interface AuditActor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export interface AuditLogItem {
  id: string;
  action: AuditAction;
  resourceType: string;
  resourceId?: string | null;
  description?: string | null;

  oldValues?: JsonValue;
  newValues?: JsonValue;
  metadata?: JsonValue;

  actorUserId?: string | null;
  actorUser?: AuditActor | null;

  ipAddress?: string | null;
  userAgent?: string | null;

  createdAt: string;
}

export interface AuditPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

export interface AuditListData {
  items: AuditLogItem[];
  pagination: AuditPagination;
}

export interface AuditListParams {
  action?: AuditAction;
  resourceType?: string;
  resourceId?: string;
  actorUserId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
