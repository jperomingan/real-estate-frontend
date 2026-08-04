"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import axios from "axios";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Heart,
  LoaderCircle,
  MapPin,
  RefreshCw,
  Search,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import {
  type FormEvent,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

import type {
  AuthUser,
} from "@/types/auth";
import {
  getApiAssetUrl,
} from "@/lib/api-asset-url";

import {
  favoritesService,
} from "./favorites-service";
import type {
  FavoriteItem,
} from "./favorites-types";

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
  return localStorage.getItem(
    "authUser",
  );
}

function getServerUserSnapshot(): null {
  return null;
}

function subscribeToHydration():
  () => void {
  return () => {};
}

function getClientHydrationSnapshot():
  true {
  return true;
}

function getServerHydrationSnapshot():
  false {
  return false;
}

function parseUser(
  value: string | null,
): AuthUser | null {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(
      value,
    ) as AuthUser;
  } catch {
    return null;
  }
}

function formatLabel(
  value: string,
): string {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase(),
    );
}

function formatMoney(
  value:
    | number
    | string
    | undefined,
): string | null {
  if (
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const amount = Number(value);

  if (Number.isNaN(amount)) {
    return null;
  }

  return new Intl.NumberFormat(
    "en-PH",
    {
      style: "currency",
      currency: "PHP",
      maximumFractionDigits: 0,
    },
  ).format(amount);
}

function getErrorMessage(
  error: unknown,
): string {
  if (
    axios.isAxiosError<
      ApiErrorResponse
    >(error)
  ) {
    if (!error.response) {
      return "Cannot connect to the backend API.";
    }

    return (
      error.response.data
        ?.message ??
      error.response.data
        ?.error?.message ??
      `Request failed with status ${error.response.status}.`
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to load saved properties.";
}

function FavoriteCard({
  favorite,
  isRemoving,
  onRemove,
}: {
  favorite: FavoriteItem;
  isRemoving: boolean;
  onRemove: () => void;
}) {
  const property =
    favorite.property;

  const coverImage =
    property.images?.[0]?.url ??
    property.imageUrls?.[0];

  const price = formatMoney(
    property.price,
  );

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {coverImage ? (
        <div
          className="h-44 bg-slate-100 bg-cover bg-center"
          style={{
            backgroundImage:
              `url("${getApiAssetUrl(coverImage)}")`,
          }}
        />
      ) : (
        <div className="flex h-44 items-center justify-center bg-slate-100 text-slate-400">
          <Building2 size={44} />
        </div>
      )}

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {property.type && (
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                {formatLabel(
                  property.type,
                )}
              </p>
            )}

            <Link
              href={`/dashboard/properties/${property.id}`}
              className="mt-1 block truncate text-lg font-semibold text-slate-950 hover:text-emerald-700"
            >
              {property.title}
            </Link>
          </div>

          <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            {formatLabel(
              property.status,
            )}
          </span>
        </div>

        {price && (
          <p className="mt-3 text-xl font-bold text-slate-950">
            {price}
          </p>
        )}

        <div className="mt-3 flex items-start gap-2 text-sm text-slate-500">
          <MapPin
            size={16}
            className="mt-0.5 shrink-0"
          />

          <span>
            {property.city},{" "}
            {property.province}
          </span>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
          <Link
            href={`/dashboard/properties/${property.id}`}
            className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
          >
            View property
          </Link>

          <button
            type="button"
            onClick={onRemove}
            disabled={isRemoving}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-red-200 px-3 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            {isRemoving ? (
              <LoaderCircle
                size={15}
                className="animate-spin"
              />
            ) : (
              <Trash2 size={15} />
            )}

            Remove
          </button>
        </div>
      </div>
    </article>
  );
}

export function FavoritesDashboard() {
  const queryClient =
    useQueryClient();

  const isHydrated =
    useSyncExternalStore(
      subscribeToHydration,
      getClientHydrationSnapshot,
      getServerHydrationSnapshot,
    );

  const rawUser =
    useSyncExternalStore(
      subscribeToAuth,
      getUserSnapshot,
      getServerUserSnapshot,
    );

  const authUser = useMemo(
    () => parseUser(rawUser),
    [rawUser],
  );

  const isClient =
    authUser?.role === "CLIENT";

  const [
    searchInput,
    setSearchInput,
  ] = useState("");

  const [search, setSearch] =
    useState("");

  const [city, setCity] =
    useState("");

  const [
    province,
    setProvince,
  ] = useState("");

  const [page, setPage] =
    useState(1);

  const favoritesQuery =
    useQuery({
      queryKey: [
        "favorites",
        {
          search,
          city,
          province,
          page,
        },
      ],

      queryFn: () =>
        favoritesService.list({
          search:
            search || undefined,
          city:
            city || undefined,
          province:
            province || undefined,
          page,
          limit: 12,
        }),

      enabled:
        isHydrated &&
        isClient,
    });

  const removeMutation =
    useMutation({
      mutationFn: (
        propertyId: string,
      ) =>
        favoritesService.remove(
          propertyId,
        ),

      onSuccess: async () => {
        await queryClient
          .invalidateQueries({
            queryKey: [
              "favorites",
            ],
          });
      },
    });

  function handleSearch(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setSearch(
      searchInput.trim(),
    );

    setPage(1);
  }

  function clearFilters() {
    setSearchInput("");
    setSearch("");
    setCity("");
    setProvince("");
    setPage(1);
  }

  function removeFavorite(
    favorite: FavoriteItem,
  ) {
    const confirmed =
      window.confirm(
        `Remove "${favorite.property.title}" from your saved properties?`,
      );

    if (confirmed) {
      removeMutation.mutate(
        favorite.propertyId,
      );
    }
  }

  if (!isHydrated) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <LoaderCircle className="animate-spin text-emerald-700" />
      </div>
    );
  }

  if (!isClient) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
        <ShieldAlert
          size={36}
          className="mx-auto text-amber-700"
        />

        <h1 className="mt-4 text-2xl font-bold text-amber-950">
          Client access required
        </h1>

        <p className="mt-2 text-sm leading-6 text-amber-800">
          Saved Properties are
          available only to client
          accounts. Admin and Broker
          accounts cannot manage
          favorites.
        </p>

        <Link
          href="/dashboard/properties"
          className="mt-5 inline-flex rounded-xl bg-amber-800 px-4 py-2.5 text-sm font-semibold text-white"
        >
          View properties
        </Link>
      </div>
    );
  }

  const favorites =
    favoritesQuery.data?.items ??
    [];

  const pagination =
    favoritesQuery.data
      ?.pagination;

  const totalPages = Math.max(
    pagination?.totalPages ?? 0,
    1,
  );

  const hasFilters =
    Boolean(search) ||
    Boolean(city) ||
    Boolean(province);

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-emerald-700">
            Client property list
          </p>

          <h1 className="mt-1 flex items-center gap-3 text-3xl font-bold tracking-tight text-slate-950">
            <Heart
              size={28}
              className="fill-red-500 text-red-500"
            />

            Saved Properties
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Review and manage the
            properties you saved.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            void favoritesQuery
              .refetch();
          }}
          disabled={
            favoritesQuery
              .isFetching
          }
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCw
            size={16}
            className={
              favoritesQuery
                .isFetching
                ? "animate-spin"
                : ""
            }
          />

          Refresh
        </button>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <form
          onSubmit={handleSearch}
          className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_200px_200px_auto]"
        >
          <div className="relative">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              value={searchInput}
              onChange={(event) => {
                setSearchInput(
                  event.target.value,
                );
              }}
              placeholder="Search saved properties"
              className="h-11 w-full rounded-xl border border-slate-300 pl-10 pr-3 text-sm"
            />
          </div>

          <input
            type="text"
            value={city}
            onChange={(event) => {
              setCity(
                event.target.value,
              );
              setPage(1);
            }}
            placeholder="City"
            className="h-11 rounded-xl border border-slate-300 px-3 text-sm"
          />

          <input
            type="text"
            value={province}
            onChange={(event) => {
              setProvince(
                event.target.value,
              );
              setPage(1);
            }}
            placeholder="Province"
            className="h-11 rounded-xl border border-slate-300 px-3 text-sm"
          />

          <button
            type="submit"
            className="h-11 rounded-xl bg-emerald-700 px-5 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            Search
          </button>
        </form>

        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="mt-3 text-sm font-medium text-emerald-700"
          >
            Clear all filters
          </button>
        )}
      </section>

      {favoritesQuery.isPending ? (
        <div className="flex min-h-[360px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center gap-3 text-slate-600">
            <LoaderCircle
              size={22}
              className="animate-spin"
            />

            Loading saved properties...
          </div>
        </div>
      ) : favoritesQuery.isError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <h2 className="font-semibold text-red-900">
            Unable to load saved
            properties
          </h2>

          <p className="mt-2 text-sm text-red-700">
            {getErrorMessage(
              favoritesQuery.error,
            )}
          </p>
        </div>
      ) : favorites.length === 0 ? (
        <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <Heart
            size={36}
            className="text-slate-400"
          />

          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            No saved properties
          </h2>

          <p className="mt-2 max-w-md text-sm text-slate-500">
            Properties you save will
            appear here.
          </p>

          <Link
            href="/dashboard/properties"
            className="mt-5 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white"
          >
            Browse properties
          </Link>
        </div>
      ) : (
        <>
          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {favorites.map(
              (favorite) => (
                <FavoriteCard
                  key={favorite.id}
                  favorite={favorite}
                  isRemoving={
                    removeMutation
                      .isPending &&
                    removeMutation
                      .variables ===
                      favorite.propertyId
                  }
                  onRemove={() =>
                    removeFavorite(
                      favorite,
                    )
                  }
                />
              ),
            )}
          </section>

          <footer className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center">
            <p className="text-sm text-slate-500">
              {pagination?.total ?? 0}{" "}
              saved properties
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setPage((current) =>
                    Math.max(
                      current - 1,
                      1,
                    ),
                  );
                }}
                disabled={
                  page <= 1 ||
                  favoritesQuery
                    .isFetching
                }
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium disabled:opacity-40"
              >
                <ChevronLeft
                  size={16}
                />
                Previous
              </button>

              <span className="text-sm text-slate-600">
                Page {page} of{" "}
                {totalPages}
              </span>

              <button
                type="button"
                onClick={() => {
                  setPage((current) =>
                    current + 1,
                  );
                }}
                disabled={
                  page >= totalPages ||
                  favoritesQuery
                    .isFetching
                }
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium disabled:opacity-40"
              >
                Next
                <ChevronRight
                  size={16}
                />
              </button>
            </div>
          </footer>
        </>
      )}
    </div>
  );
}
