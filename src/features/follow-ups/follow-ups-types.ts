export type LeadFollowUpStatus =
  | "PENDING"
  | "DONE"
  | "CANCELLED";

export type LeadFollowUpPriority =
  | "LOW"
  | "MEDIUM"
  | "HIGH";

export interface FollowUpLead {
  id: string;
  firstName: string;
  lastName?: string | null;
  phone: string;
  status: string;
}

export interface FollowUpUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface LeadFollowUpTask {
  id: string;
  title: string;
  description?: string | null;

  status: LeadFollowUpStatus;
  priority: LeadFollowUpPriority;

  dueDate?: string | null;
  completedAt?: string | null;

  leadId: string;
  lead?: FollowUpLead;

  assignedToUserId?: string | null;
  assignedToUser?: FollowUpUser | null;

  createdByUserId?: string | null;
  createdByUser?: FollowUpUser | null;

  createdAt: string;
  updatedAt: string;
}

export interface FollowUpListMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface FollowUpListResponse {
  items: LeadFollowUpTask[];
  meta: FollowUpListMeta;
}

export interface FollowUpListParams {
  leadId?: string;
  status?: LeadFollowUpStatus;
  priority?: LeadFollowUpPriority;
  assignedToUserId?: string;
  dueFrom?: string;
  dueTo?: string;
  page?: number;
  limit?: number;
}

export interface CreateLeadFollowUpInput {
  title: string;
  description?: string;
  priority?: LeadFollowUpPriority;
  dueDate?: string;
  assignedToUserId?: string;
}

export interface UpdateLeadFollowUpInput {
  title?: string;
  description?: string | null;
  status?: LeadFollowUpStatus;
  priority?: LeadFollowUpPriority;
  dueDate?: string | null;
  assignedToUserId?: string | null;
}

export interface LeadOption {
  id: string;
  firstName: string;
  lastName?: string | null;
  phone: string;
  status: string;
}
