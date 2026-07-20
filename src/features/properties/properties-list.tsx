"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Bath,
  BedDouble,
  Building2,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  MapPin,
  RefreshCw,
  Search,
  Square,
} from "lucide-react";
import {
  type FormEvent,
  useState,
} from "react";

import { propertiesService } from "./properties-service";
import {
  PROPERTY_STATUSES,
  PROPERTY_TYPES,
  type Property,
  type PropertySortField,
  type PropertyStatus,
  type PropertyType,
  type SortOrder,
} from "./properties-types";
import {
  getApiAssetUrl,
} from "@/lib/api-asset-url";

const moneyFormatter =
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  });

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
  value: number | string,
): string {
  const amount = Number(value);

  if (Number.isNaN(amount)) {
    return "Price unavailable";
  }

  return moneyFormatter.format(amount);
}

function formatArea(
  value: number | string | null,
): string {
  if (
    value === null ||
    value === ""
  ) {
    return "Not specified";
  }

  const area = Number(value);

  if (Number.isNaN(area)) {
    return "Not specified";
  }

  return `${area.toLocaleString()} sqm`;
}

function formatDate(
  value: string,
): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat(
    "en-PH",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    },
  ).format(date);
}

function getErrorMessage(
  error: unknown,
): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to load properties.";
}

function PropertyCard({
  property,
}: {
  property: Property;
}) {
  const coverImage =
    property.images?.[0]?.url ??
    property.imageUrls?.[0];
  return (
    <Link
      href={`/dashboard/properties/${property.id}`}
      className="block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
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
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              {formatLabel(
                property.type,
              )}
            </p>

            <h2 className="mt-1 truncate text-lg font-semibold text-slate-950">
              {property.title}
            </h2>
          </div>

          <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            {formatLabel(
              property.status,
            )}
          </span>
        </div>

        <p className="mt-3 text-xl font-bold text-slate-950">
          {formatMoney(
            property.price,
          )}
        </p>

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

        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <BedDouble size={16} />

            <span>
              {property.bedrooms ??
                0}{" "}
              beds
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Bath size={16} />

            <span>
              {property.bathrooms ??
                0}{" "}
              baths
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Square size={16} />

            <span>
              Lot:{" "}
              {formatArea(
                property.lotAreaSqm,
              )}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Square size={16} />

            <span>
              Floor:{" "}
              {formatArea(
                property.floorAreaSqm,
              )}
            </span>
          </div>
        </div>

        <p className="mt-4 text-xs text-slate-400">
          Added{" "}
          {formatDate(
            property.createdAt,
          )}
        </p>
      </div>
    </Link>
  );
}

export function PropertiesList() {
  const [searchInput, setSearchInput] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [type, setType] =
    useState<PropertyType | "">("");

  const [status, setStatus] =
    useState<PropertyStatus | "">("");

  const [sortBy, setSortBy] =
    useState<PropertySortField>(
      "createdAt",
    );

  const [sortOrder, setSortOrder] =
    useState<SortOrder>("desc");

  const [page, setPage] =
    useState(1);

  const {
    data,
    error,
    isError,
    isPending,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: [
      "properties",
      {
        search,
        type,
        status,
        sortBy,
        sortOrder,
        page,
      },
    ],

    queryFn: () =>
      propertiesService.getProperties({
        search:
          search || undefined,
        type:
          type || undefined,
        status:
          status || undefined,
        sortBy,
        sortOrder,
        page,
        limit: 12,
      }),
  });

  function handleSearch(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setPage(1);
    setSearch(searchInput.trim());
  }

  function clearFilters() {
    setSearchInput("");
    setSearch("");
    setType("");
    setStatus("");
    setSortBy("createdAt");
    setSortOrder("desc");
    setPage(1);
  }

  const properties =
    data?.items ?? [];

  const pagination =
    data?.pagination;

  const totalPages = Math.max(
    pagination?.totalPages ?? 0,
    1,
  );

  const hasFilters =
    Boolean(search) ||
    Boolean(type) ||
    Boolean(status) ||
    sortBy !== "createdAt" ||
    sortOrder !== "desc";

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-emerald-700">
            Property management
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
            Properties
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Manage property listings,
            prices, locations, and
            availability.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            void refetch();
          }}
          disabled={isFetching}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCw
            size={16}
            className={
              isFetching
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
          className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_190px_180px_180px_160px_auto]"
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
              placeholder="Search properties"
              className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <select
            value={type}
            onChange={(event) => {
              setType(
                event.target
                  .value as
                | PropertyType
                | "",
              );
              setPage(1);
            }}
            className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          >
            <option value="">
              All property types
            </option>

            {PROPERTY_TYPES.map(
              (propertyType) => (
                <option
                  key={propertyType}
                  value={propertyType}
                >
                  {formatLabel(
                    propertyType,
                  )}
                </option>
              ),
            )}
          </select>

          <select
            value={status}
            onChange={(event) => {
              setStatus(
                event.target
                  .value as
                | PropertyStatus
                | "",
              );
              setPage(1);
            }}
            className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          >
            <option value="">
              All statuses
            </option>

            {PROPERTY_STATUSES.map(
              (propertyStatus) => (
                <option
                  key={propertyStatus}
                  value={propertyStatus}
                >
                  {formatLabel(
                    propertyStatus,
                  )}
                </option>
              ),
            )}
          </select>

          <select
            value={sortBy}
            onChange={(event) => {
              setSortBy(
                event.target
                  .value as PropertySortField,
              );
              setPage(1);
            }}
            className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          >
            <option value="createdAt">
              Date created
            </option>

            <option value="price">
              Price
            </option>

            <option value="title">
              Title
            </option>

            <option value="city">
              City
            </option>
          </select>

          <select
            value={sortOrder}
            onChange={(event) => {
              setSortOrder(
                event.target
                  .value as SortOrder,
              );
              setPage(1);
            }}
            className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          >
            <option value="desc">
              Descending
            </option>

            <option value="asc">
              Ascending
            </option>
          </select>

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
            className="mt-3 text-sm font-medium text-emerald-700 hover:text-emerald-800"
          >
            Clear all filters
          </button>
        )}
      </section>

      {isPending ? (
        <div className="flex min-h-[360px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center gap-3 text-slate-600">
            <LoaderCircle
              size={22}
              className="animate-spin"
            />

            <span>
              Loading properties...
            </span>
          </div>
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <h2 className="font-semibold text-red-900">
            Unable to load
            properties
          </h2>

          <p className="mt-2 text-sm text-red-700">
            {getErrorMessage(error)}
          </p>

          <button
            type="button"
            onClick={() => {
              void refetch();
            }}
            className="mt-4 rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white"
          >
            Try again
          </button>
        </div>
      ) : properties.length === 0 ? (
        <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <div className="rounded-full bg-emerald-50 p-4 text-emerald-700">
            <Building2 size={32} />
          </div>

          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            No properties found
          </h2>

          <p className="mt-2 max-w-md text-sm text-slate-500">
            Property records will
            appear here after a listing
            is created.
          </p>
        </div>
      ) : (
        <>
          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {properties.map(
              (property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                />
              ),
            )}
          </section>

          <footer className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center">
            <p className="text-sm text-slate-500">
              {pagination?.total ?? 0}{" "}
              total properties
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
                  !pagination?.hasPreviousPage
                }
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={16} />
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
                  !pagination?.hasNextPage
                }
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
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
