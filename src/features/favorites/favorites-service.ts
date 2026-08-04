import {
  apiClient,
} from "@/lib/api-client";

import type {
  ApiResponse,
  FavoriteItem,
  FavoriteListParams,
  FavoritesListData,
  FavoriteStatusData,
} from "./favorites-types";

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

export const favoritesService = {
  async list(
    params: FavoriteListParams = {},
  ): Promise<FavoritesListData> {
    const response =
      await apiClient.get<
        ApiResponse<FavoritesListData>
      >(
        "/favorites",
        {
          params: cleanParams({
            search: params.search,
            city: params.city,
            province:
              params.province,
            page: params.page ?? 1,
            limit:
              params.limit ?? 12,
          }),
        },
      );

    return response.data.data;
  },

  async save(
    propertyId: string,
  ): Promise<FavoriteItem> {
    const response =
      await apiClient.post<
        ApiResponse<FavoriteItem>
      >(
        `/favorites/${propertyId}`,
      );

    return response.data.data;
  },

  async getStatus(
    propertyId: string,
  ): Promise<FavoriteStatusData> {
    const response =
      await apiClient.get<
        ApiResponse<FavoriteStatusData>
      >(
        `/favorites/${propertyId}/status`,
      );

    return response.data.data;
  },

  async remove(
    propertyId: string,
  ): Promise<void> {
    await apiClient.delete(
      `/favorites/${propertyId}`,
    );
  },
};
