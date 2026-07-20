import { apiClient } from "@/lib/api-client";

import type {
  CreateLeadInput,
  Lead,
  LeadListData,
  LeadListParams,
  LeadListResponse,
  LeadMutationResponse,
  LeadStatus,
} from "./leads-types";

export const leadsService = {
  async getLeads(
    params: LeadListParams = {},
  ): Promise<LeadListData> {
    const response =
      await apiClient.get<LeadListResponse>(
        "/leads",
        {
          params: {
            page: params.page ?? 1,
            limit: params.limit ?? 10,
            ...(params.search
              ? { search: params.search }
              : {}),
            ...(params.status
              ? { status: params.status }
              : {}),
            ...(params.source
              ? { source: params.source }
              : {}),
            ...(params.propertyId
              ? {
                  propertyId:
                    params.propertyId,
                }
              : {}),
            ...(params.brokerId
              ? {
                  brokerId:
                    params.brokerId,
                }
              : {}),
          },
        },
      );

    return response.data.data;
  },

  async getLeadById(
    id: string,
  ): Promise<Lead> {
    const response =
      await apiClient.get<LeadMutationResponse>(
        `/leads/${id}`,
      );

    return response.data.data;
  },

  async createLead(
    input: CreateLeadInput,
  ): Promise<Lead> {
    const response =
      await apiClient.post<LeadMutationResponse>(
        "/leads",
        input,
      );

    return response.data.data;
  },

  async updateLeadStatus(
    id: string,
    status: LeadStatus,
  ): Promise<Lead> {
    const response =
      await apiClient.patch<LeadMutationResponse>(
        `/leads/${id}/status`,
        {
          status,
        },
      );

    return response.data.data;
  },

  async deleteLead(
    id: string,
  ): Promise<void> {
    await apiClient.delete(
      `/leads/${id}`,
    );
  },
};
