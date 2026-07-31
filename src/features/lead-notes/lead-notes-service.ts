import {
  apiClient,
} from "@/lib/api-client";

import type {
  CreateLeadNoteInput,
  DeleteLeadNoteResponse,
  LeadNote,
  LeadNotesListParams,
  LeadNotesListResponse,
  UpdateLeadNoteInput,
} from "./lead-note-types";

function cleanParams(
  values: Record<string, unknown>,
) {
  return Object.fromEntries(
    Object.entries(values).filter(
      ([, value]) =>
        value !== undefined &&
        value !== "",
    ),
  );
}

export const leadNotesService = {
  async list(
    params:
      LeadNotesListParams = {},
  ): Promise<LeadNotesListResponse> {
    const response =
      await apiClient.get<
        LeadNotesListResponse
      >(
        "/lead-notes",
        {
          params: cleanParams({
            leadId:
              params.leadId,

            type:
              params.type,

            page:
              params.page ?? 1,

            limit:
              params.limit ?? 5,
          }),
        },
      );

    return response.data;
  },

  async create(
    leadId: string,
    input: CreateLeadNoteInput,
  ): Promise<LeadNote> {
    const response =
      await apiClient.post<LeadNote>(
        `/leads/${leadId}/notes`,
        input,
      );

    return response.data;
  },

  async getById(
    id: string,
  ): Promise<LeadNote> {
    const response =
      await apiClient.get<LeadNote>(
        `/lead-notes/${id}`,
      );

    return response.data;
  },

  async update(
    id: string,
    input: UpdateLeadNoteInput,
  ): Promise<LeadNote> {
    const response =
      await apiClient.patch<LeadNote>(
        `/lead-notes/${id}`,
        input,
      );

    return response.data;
  },

  async delete(
    id: string,
  ): Promise<DeleteLeadNoteResponse> {
    const response =
      await apiClient.delete<
        DeleteLeadNoteResponse
      >(
        `/lead-notes/${id}`,
      );

    return response.data;
  },
};
