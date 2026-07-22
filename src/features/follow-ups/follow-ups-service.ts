import { apiClient } from "@/lib/api-client";

import type {
  CreateLeadFollowUpInput,
  FollowUpListParams,
  FollowUpListResponse,
  LeadFollowUpTask,
  LeadOption,
  UpdateLeadFollowUpInput,
} from "./follow-ups-types";

interface LeadListPayload {
  items?: LeadOption[];
  data?: {
    items?: LeadOption[];
  };
}

function removeUndefinedValues(
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

export const followUpsService = {
  async list(
    params: FollowUpListParams = {},
  ): Promise<FollowUpListResponse> {
    const response =
      await apiClient.get<FollowUpListResponse>(
        "/follow-ups",
        {
          params: removeUndefinedValues({
            leadId: params.leadId,
            status: params.status,
            priority: params.priority,
            assignedToUserId:
              params.assignedToUserId,
            dueFrom: params.dueFrom,
            dueTo: params.dueTo,
            page: params.page ?? 1,
            limit: params.limit ?? 10,
          }),
        },
      );

    return response.data;
  },

  async getById(
    id: string,
  ): Promise<LeadFollowUpTask> {
    const response =
      await apiClient.get<LeadFollowUpTask>(
        `/follow-ups/${id}`,
      );

    return response.data;
  },

  async create(
    leadId: string,
    input: CreateLeadFollowUpInput,
  ): Promise<LeadFollowUpTask> {
    const response =
      await apiClient.post<LeadFollowUpTask>(
        `/leads/${leadId}/follow-ups`,
        input,
      );

    return response.data;
  },

  async update(
    id: string,
    input: UpdateLeadFollowUpInput,
  ): Promise<LeadFollowUpTask> {
    const response =
      await apiClient.patch<LeadFollowUpTask>(
        `/follow-ups/${id}`,
        input,
      );

    return response.data;
  },

  async delete(
    id: string,
  ): Promise<void> {
    await apiClient.delete(
      `/follow-ups/${id}`,
    );
  },

  async getLeadOptions(): Promise<
    LeadOption[]
  > {
    const response =
      await apiClient.get<LeadListPayload>(
        "/leads",
        {
          params: {
            page: 1,
            limit: 100,
          },
        },
      );

    return (
      response.data.data?.items ??
      response.data.items ??
      []
    );
  },
};
