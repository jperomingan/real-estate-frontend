import { apiClient } from "@/lib/api-client";

import type {
  CreateViewingInput,
  RescheduleViewingInput,
  UpdateViewingStatusInput,
  ViewingAppointment,
  ViewingListData,
  ViewingListParams,
  ViewingListResponse,
  ViewingMutationResponse,
} from "./viewings-types";

export const viewingsService = {
  async getViewings(
    params: ViewingListParams = {},
  ): Promise<ViewingListData> {
    const response =
      await apiClient.get<ViewingListResponse>(
        "/viewings",
        {
          params: {
            page: params.page ?? 1,
            limit: params.limit ?? 10,

            ...(params.search
              ? {
                  search: params.search,
                }
              : {}),

            ...(params.status
              ? {
                  status: params.status,
                }
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

            ...(params.dateFrom
              ? {
                  dateFrom:
                    params.dateFrom,
                }
              : {}),

            ...(params.dateTo
              ? {
                  dateTo:
                    params.dateTo,
                }
              : {}),
          },
        },
      );

    return response.data.data;
  },

  async getViewingById(
    id: string,
  ): Promise<ViewingAppointment> {
    const response =
      await apiClient.get<ViewingMutationResponse>(
        `/viewings/${id}`,
      );

    return response.data.data;
  },

  async createViewing(
    input: CreateViewingInput,
  ): Promise<ViewingAppointment> {
    const response =
      await apiClient.post<ViewingMutationResponse>(
        "/viewings",
        input,
      );

    return response.data.data;
  },

  async updateViewingStatus(
    id: string,
    input: UpdateViewingStatusInput,
  ): Promise<ViewingAppointment> {
    const response =
      await apiClient.patch<ViewingMutationResponse>(
        `/viewings/${id}/status`,
        input,
      );

    return response.data.data;
  },

  async rescheduleViewing(
    id: string,
    input: RescheduleViewingInput,
  ): Promise<ViewingAppointment> {
    const response =
      await apiClient.patch<ViewingMutationResponse>(
        `/viewings/${id}/reschedule`,
        input,
      );

    return response.data.data;
  },

  async deleteViewing(
    id: string,
  ): Promise<void> {
    await apiClient.delete(
      `/viewings/${id}`,
    );
  },
};
