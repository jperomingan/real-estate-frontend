import { apiClient } from "@/lib/api-client";

import type {
  PropertyListData,
  PropertyListParams,
  PropertyListResponse,
} from "./properties-types";

export const propertiesService = {
  async getProperties(
    params: PropertyListParams = {},
  ): Promise<PropertyListData> {
    const response =
      await apiClient.get<PropertyListResponse>(
        "/properties",
        {
          params: {
            page: params.page ?? 1,
            limit: params.limit ?? 10,
            sortBy:
              params.sortBy ?? "createdAt",
            sortOrder:
              params.sortOrder ?? "desc",

            ...(params.search
              ? { search: params.search }
              : {}),

            ...(params.type
              ? { type: params.type }
              : {}),

            ...(params.status
              ? { status: params.status }
              : {}),

            ...(params.city
              ? { city: params.city }
              : {}),

            ...(params.province
              ? {
                  province:
                    params.province,
                }
              : {}),

            ...(params.barangay
              ? {
                  barangay:
                    params.barangay,
                }
              : {}),

            ...(params.minPrice !==
            undefined
              ? {
                  minPrice:
                    params.minPrice,
                }
              : {}),

            ...(params.maxPrice !==
            undefined
              ? {
                  maxPrice:
                    params.maxPrice,
                }
              : {}),

            ...(params.bedrooms !==
            undefined
              ? {
                  bedrooms:
                    params.bedrooms,
                }
              : {}),

            ...(params.bathrooms !==
            undefined
              ? {
                  bathrooms:
                    params.bathrooms,
                }
              : {}),
          },
        },
      );

    return response.data.data;
  },
};
