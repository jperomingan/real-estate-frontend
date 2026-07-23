import {
  apiClient,
} from "@/lib/api-client";

import type {
  ApiResponse,
  CreateRevenueInput,
  LeadOption,
  PropertyOption,
  RevenueListData,
  RevenueListParams,
  RevenueRecord,
  RevenueSummary,
  UpdateRevenueCommissionInput,
  UpdateRevenuePaymentInput,
} from "./revenues-types";

interface OptionListData<T> {
  items: T[];
}

function cleanParams(
  values: Record<
    string,
    unknown
  >,
) {
  return Object.fromEntries(
    Object.entries(values).filter(
      ([, value]) =>
        value !== undefined &&
        value !== "",
    ),
  );
}

export const revenuesService = {
  async list(
    params:
      RevenueListParams = {},
  ): Promise<RevenueListData> {
    const response =
      await apiClient.get<
        ApiResponse<RevenueListData>
      >(
        "/revenues",
        {
          params: cleanParams({
            search: params.search,
            propertyId:
              params.propertyId,
            brokerId:
              params.brokerId,

            paymentStatus:
              params.paymentStatus,

            commissionStatus:
              params.commissionStatus,

            dateFrom:
              params.dateFrom,

            dateTo:
              params.dateTo,

            page:
              params.page ?? 1,

            limit:
              params.limit ?? 10,
          }),
        },
      );

    return response.data.data;
  },

  async summary(): Promise<
    RevenueSummary
  > {
    const response =
      await apiClient.get<
        ApiResponse<RevenueSummary>
      >(
        "/revenues/summary",
      );

    return response.data.data;
  },

  async getById(
    id: string,
  ): Promise<RevenueRecord> {
    const response =
      await apiClient.get<
        ApiResponse<RevenueRecord>
      >(
        `/revenues/${id}`,
      );

    return response.data.data;
  },

  async create(
    input:
      CreateRevenueInput,
  ): Promise<RevenueRecord> {
    const response =
      await apiClient.post<
        ApiResponse<RevenueRecord>
      >(
        "/revenues",
        input,
      );

    return response.data.data;
  },

  async updatePayment(
    id: string,
    input:
      UpdateRevenuePaymentInput,
  ): Promise<RevenueRecord> {
    const response =
      await apiClient.patch<
        ApiResponse<RevenueRecord>
      >(
        `/revenues/${id}/payment-status`,
        input,
      );

    return response.data.data;
  },

  async updateCommission(
    id: string,
    input:
      UpdateRevenueCommissionInput,
  ): Promise<RevenueRecord> {
    const response =
      await apiClient.patch<
        ApiResponse<RevenueRecord>
      >(
        `/revenues/${id}/commission-status`,
        input,
      );

    return response.data.data;
  },

  async delete(
    id: string,
  ): Promise<void> {
    await apiClient.delete(
      `/revenues/${id}`,
    );
  },

  async propertyOptions(): Promise<
    PropertyOption[]
  > {
    const response =
      await apiClient.get<
        ApiResponse<
          OptionListData<PropertyOption>
        >
      >(
        "/properties",
        {
          params: {
            page: 1,
            limit: 100,
          },
        },
      );

    return (
      response.data.data
        .items ?? []
    );
  },

  async leadOptions(): Promise<
    LeadOption[]
  > {
    const response =
      await apiClient.get<
        ApiResponse<
          OptionListData<LeadOption>
        >
      >(
        "/leads",
        {
          params: {
            page: 1,
            limit: 100,
          },
        },
      );

    return (
      response.data.data
        .items ?? []
    );
  },
};
