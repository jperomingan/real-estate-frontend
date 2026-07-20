import { apiClient } from "@/lib/api-client";

import type {
  PropertyImage,
} from "./properties-types";

interface PropertyImageResponse {
  success: boolean;
  message: string;
  data: PropertyImage;
}

interface ApiErrorResponse {
  success?: boolean;
  message?: string;
  error?: {
    message?: string;
  };
}

const apiUrl =
  process.env.NEXT_PUBLIC_API_URL;

if (!apiUrl) {
  throw new Error(
    "NEXT_PUBLIC_API_URL is missing.",
  );
}

function parseResponse<T>(
  responseText: string,
): T | null {
  if (!responseText) {
    return null;
  }

  try {
    return JSON.parse(
      responseText,
    ) as T;
  } catch {
    return null;
  }
}

export const propertyImagesService = {
  uploadImage(
    propertyId: string,
    file: File,
    onProgress?: (
      progress: number,
    ) => void,
  ): Promise<PropertyImage> {
    return new Promise(
      (resolve, reject) => {
        const accessToken =
          localStorage.getItem(
            "accessToken",
          );

        if (!accessToken) {
          reject(
            new Error(
              "Your login session was not found. Please log in again.",
            ),
          );
          return;
        }

        const formData =
          new FormData();

        formData.append(
          "file",
          file,
          file.name,
        );

        const normalizedApiUrl =
          apiUrl.replace(/\/$/, "");

        const uploadUrl =
          `${normalizedApiUrl}/properties/` +
          `${encodeURIComponent(propertyId)}/images`;

        const request =
          new XMLHttpRequest();

        request.open(
          "POST",
          uploadUrl,
          true,
        );

        request.timeout = 30_000;

        request.setRequestHeader(
          "Authorization",
          `Bearer ${accessToken}`,
        );

        // Do not set Content-Type.
        // The browser adds the multipart boundary.
        request.upload.onprogress = (
          event,
        ) => {
          if (
            !event.lengthComputable ||
            event.total <= 0
          ) {
            return;
          }

          const percentage =
            Math.round(
              (event.loaded /
                event.total) *
                100,
            );

          // Keep it at 99% until the
          // backend confirms success.
          onProgress?.(
            Math.min(
              percentage,
              99,
            ),
          );
        };

        request.onload = () => {
          const response =
            parseResponse<
              | PropertyImageResponse
              | ApiErrorResponse
            >(request.responseText);

          if (
            request.status >= 200 &&
            request.status < 300
          ) {
            const successfulResponse =
              response as
                | PropertyImageResponse
                | null;

            if (
              !successfulResponse?.data
            ) {
              reject(
                new Error(
                  "The upload response did not contain image data.",
                ),
              );
              return;
            }

            onProgress?.(100);

            resolve(
              successfulResponse.data,
            );

            return;
          }

          const errorResponse =
            response as
              | ApiErrorResponse
              | null;

          reject(
            new Error(
              errorResponse?.message ??
                errorResponse?.error
                  ?.message ??
                `Image upload failed with status ${request.status}.`,
            ),
          );
        };

        request.onerror = () => {
          reject(
            new Error(
              "Cannot connect to the backend API.",
            ),
          );
        };

        request.ontimeout = () => {
          reject(
            new Error(
              "The image upload timed out.",
            ),
          );
        };

        request.onabort = () => {
          reject(
            new Error(
              "The image upload was cancelled.",
            ),
          );
        };

        onProgress?.(0);

        request.send(formData);
      },
    );
  },

  async deleteImage(
    propertyId: string,
    imageId: string,
  ): Promise<void> {
    await apiClient.delete(
      `/properties/${propertyId}/images/${imageId}`,
    );
  },
};
