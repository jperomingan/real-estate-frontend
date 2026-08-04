"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import axios from "axios";
import {
  Heart,
  LoaderCircle,
} from "lucide-react";
import {
  useMemo,
  useSyncExternalStore,
} from "react";

import {
  authStorage,
} from "@/features/auth/auth-storage";

import {
  favoritesService,
} from "./favorites-service";

interface ApiErrorResponse {
  message?: string;

  error?: {
    message?: string;
  };
}

function subscribeToAuth(
  callback: () => void,
): () => void {
  const handleStorage = (
    event: StorageEvent,
  ) => {
    if (
      event.key === null ||
      event.key === "authUser"
    ) {
      callback();
    }
  };

  window.addEventListener(
    "storage",
    handleStorage,
  );

  window.addEventListener(
    "auth-change",
    callback,
  );

  return () => {
    window.removeEventListener(
      "storage",
      handleStorage,
    );

    window.removeEventListener(
      "auth-change",
      callback,
    );
  };
}

function getUserSnapshot():
  | string
  | null {
  if (
    typeof window ===
    "undefined"
  ) {
    return null;
  }

  return localStorage.getItem(
    "authUser",
  );
}

function getServerUserSnapshot(): null {
  return null;
}

function parseRole(
  rawUser: string | null,
): string | null {
  if (!rawUser) {
    return null;
  }

  try {
    const user = JSON.parse(
      rawUser,
    ) as {
      role?: string;
    };

    return user.role ?? null;
  } catch {
    authStorage.clear();
    return null;
  }
}

function getErrorMessage(
  error: unknown,
): string {
  if (
    axios.isAxiosError<
      ApiErrorResponse
    >(error)
  ) {
    return (
      error.response?.data
        ?.message ??
      error.response?.data
        ?.error?.message ??
      "Unable to update the saved property."
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to update the saved property.";
}

export function FavoritePropertyButton({
  propertyId,
  propertyStatus,
}: {
  propertyId: string;
  propertyStatus: string;
}) {
  const queryClient =
    useQueryClient();

  const rawUser =
    useSyncExternalStore(
      subscribeToAuth,
      getUserSnapshot,
      getServerUserSnapshot,
    );

  const role = useMemo(
    () => parseRole(rawUser),
    [rawUser],
  );

  const canManageFavorite =
    role === "CLIENT" &&
    propertyStatus ===
      "PUBLISHED";

  const statusQuery = useQuery({
    queryKey: [
      "favorites",
      "status",
      propertyId,
    ],

    queryFn: () =>
      favoritesService.getStatus(
        propertyId,
      ),

    enabled:
      canManageFavorite,
  });

  const toggleMutation =
    useMutation({
      mutationFn: async () => {
        if (
          statusQuery.data
            ?.isFavorited
        ) {
          await favoritesService
            .remove(propertyId);

          return false;
        }

        await favoritesService
          .save(propertyId);

        return true;
      },

      onSuccess: async (
        isFavorited,
      ) => {
        queryClient.setQueryData(
          [
            "favorites",
            "status",
            propertyId,
          ],
          {
            propertyId,
            isFavorited,
          },
        );

        await queryClient
          .invalidateQueries({
            queryKey: [
              "favorites",
            ],
          });
      },
    });

  if (!canManageFavorite) {
    return null;
  }

  const isFavorited =
    statusQuery.data
      ?.isFavorited === true;

  const isBusy =
    statusQuery.isPending ||
    toggleMutation.isPending;

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          toggleMutation.mutate();
        }}
        disabled={
          isBusy ||
          statusQuery.isError
        }
        className={
          isFavorited
            ? "inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
            : "inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        }
      >
        {isBusy ? (
          <LoaderCircle
            size={17}
            className="animate-spin"
          />
        ) : (
          <Heart
            size={17}
            className={
              isFavorited
                ? "fill-red-500 text-red-500"
                : ""
            }
          />
        )}

        {isFavorited
          ? "Saved"
          : "Save Property"}
      </button>

      {(statusQuery.isError ||
        toggleMutation.isError) && (
        <p className="mt-2 max-w-56 text-xs text-red-700">
          {getErrorMessage(
            statusQuery.error ??
              toggleMutation.error,
          )}
        </p>
      )}
    </div>
  );
}
