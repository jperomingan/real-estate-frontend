export const LEAD_NOTE_TYPES = [
  "GENERAL",
  "CALL",
  "EMAIL",
  "SMS",
  "MEETING",
  "VIEWING",
  "FOLLOW_UP",
  "STATUS_UPDATE",
] as const;

export type LeadNoteType =
  (typeof LEAD_NOTE_TYPES)[number];

export interface LeadNoteAuthor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface LeadNoteLead {
  id: string;
  firstName: string;
  lastName: string | null;
  phone: string;
  status: string;
}

export interface LeadNote {
  id: string;
  type: LeadNoteType;
  content: string;

  leadId: string;
  lead?: LeadNoteLead;

  createdByUserId?: string | null;
  createdByUser?: LeadNoteAuthor | null;

  createdAt: string;
  updatedAt: string;
}

export interface LeadNotesMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface LeadNotesListResponse {
  items: LeadNote[];
  meta: LeadNotesMeta;
}

export interface LeadNotesListParams {
  leadId?: string;
  type?: LeadNoteType;
  page?: number;
  limit?: number;
}

export interface CreateLeadNoteInput {
  type: LeadNoteType;
  content: string;
}

export interface UpdateLeadNoteInput {
  type?: LeadNoteType;
  content?: string;
}

export interface DeleteLeadNoteResponse {
  success: boolean;
}
