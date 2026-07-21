"use client";

import {
  useQuery,
} from "@tanstack/react-query";
import axios from "axios";
import {
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  LoaderCircle,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import {
  type FormEvent,
  useState,
} from "react";

import {
  viewingsService,
} from "./viewings-service";
import {
  VIEWING_STATUSES,
  type ViewingAppointment,
  type ViewingStatus,
} from "./viewings-types";

interface ApiErrorResponse {
  message?: string;
  error?: {
    message?: string;
  };
}

interface AppliedFilters {
  search: string;
  status: ViewingStatus | "";
  dateFrom: string;
  dateTo: string;
}

const EMPTY_FILTERS: AppliedFilters = {
  search: "",
  status: "",
  dateFrom: "",
  dateTo: "",
};

const currencyFormatter =
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  });

const dateFormatter =
  new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  });

const statusClasses: Record<
  ViewingStatus,
  string
> = {
  REQUESTED:
    "border-amber-200 bg-amber-50 text-amber-700",

  CONFIRMED:
    "border-emerald-200 bg-emerald-50 text-emerald-700",

  RESCHEDULED:
    "border-blue-200 bg-blue-50 text-blue-700",

  COMPLETED:
    "border-slate-300 bg-slate-100 text-slate-700",

  CANCELLED:
    "border-red-200 bg-red-50 text-red-700",

  DECLINED:
    "border-rose-200 bg-rose-50 text-rose-700",
};

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

function formatDate(
  value: string | null,
): string {
  if (!value) {
    return "Not scheduled";
  }

  const date = new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return "Invalid date";
  }

  return dateFormatter.format(date);
}

function toStartOfDayIso(
  value: string,
): string | undefined {
  if (!value) {
    return undefined;
  }

  const date = new Date(
    `${value}T00:00:00`,
  );

  return date.toISOString();
}

function toEndOfDayIso(
  value: string,
): string | undefined {
  if (!value) {
    return undefined;
  }

  const date = new Date(
    `${value}T23:59:59.999`,
  );

  return date.toISOString();
}

function getFullName(
  firstName: string,
  lastName: string | null,
): string {
  return [
    firstName,
    lastName,
  ]
    .filter(Boolean)
    .join(" ");
}

function getErrorMessage(
  error: unknown,
): string {
  if (
    axios.isAxiosError<ApiErrorResponse>(
      error,
    )
  ) {
    if (!error.response) {
      return "Cannot connect to the backend API.";
    }

    return (
      error.response.data?.message ??
      error.response.data?.error
        ?.message ??
      `Request failed with status ${error.response.status}.`
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to load viewing appointments.";
}

function ViewingCard({
  viewing,
}: {
  viewing: ViewingAppointment;
}) {
  const viewerName =
    getFullName(
      viewing.firstName,
      viewing.lastName,
    );

  const propertyLocation = [
    viewing.property.barangay,
    viewing.property.city,
    viewing.property.province,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <UserRound
              size={18}
              className="shrink-0 text-emerald-700"
            />

            <h2 className="truncate text-lg font-semibold text-slate-950">
              {viewerName}
            </h2>
          </div>

          <p className="mt-1 text-xs text-slate-500">
            Requested{" "}
            {formatDate(
              viewing.createdAt,
            )}
          </p>
        </div>

        <span
          className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold ${statusClasses[viewing.status]}`}
        >
          {formatLabel(
            viewing.status,
          )}
        </span>
      </div>

      <div className="grid gap-5 p-5 lg:grid-cols-2">
        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Viewer information
          </h3>

          <div className="flex items-start gap-3 text-sm text-slate-700">
            <Phone
              size={16}
              className="mt-0.5 shrink-0 text-slate-400"
            />

            <span>
              {viewing.phone}
            </span>
          </div>

          {viewing.email && (
            <div className="flex items-start gap-3 text-sm text-slate-700">
              <Mail
                size={16}
                className="mt-0.5 shrink-0 text-slate-400"
              />

              <span className="break-all">
                {viewing.email}
              </span>
            </div>
          )}

          {viewing.message && (
            <div className="rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-600">
              {viewing.message}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Property
          </h3>

          <div className="flex items-start gap-3">
            <Building2
              size={17}
              className="mt-0.5 shrink-0 text-emerald-700"
            />

            <div>
              <p className="text-sm font-semibold text-slate-900">
                {viewing.property.title}
              </p>

              <p className="mt-1 text-sm text-slate-600">
                {currencyFormatter.format(
                  Number(
                    viewing.property.price,
                  ),
                )}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 text-sm text-slate-600">
            <MapPin
              size={16}
              className="mt-0.5 shrink-0 text-slate-400"
            />

            <span>
              {propertyLocation}
            </span>
          </div>
        </section>
      </div>

      <div className="grid gap-4 border-t border-slate-100 bg-slate-50 p-5 md:grid-cols-2">
        <div className="flex items-start gap-3">
          <CalendarDays
            size={17}
            className="mt-0.5 shrink-0 text-amber-600"
          />

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Preferred date
            </p>

            <p className="mt-1 text-sm font-medium text-slate-800">
              {formatDate(
                viewing.preferredDate,
              )}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Clock3
            size={17}
            className="mt-0.5 shrink-0 text-emerald-700"
          />

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Confirmed date
            </p>

            <p className="mt-1 text-sm font-medium text-slate-800">
              {formatDate(
                viewing.confirmedDate,
              )}
            </p>
          </div>
        </div>
      </div>

      {(viewing.notes ||
        viewing.broker) && (
        <div className="border-t border-slate-100 p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Assigned broker
              </p>

              <p className="mt-1 text-sm font-medium text-slate-800">
                {getFullName(
                  viewing.broker
                    .firstName,
                  viewing.broker
                    .lastName,
                )}
              </p>
            </div>

            {viewing.notes && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Notes
                </p>

                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">
                  {viewing.notes}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
      <div className="border-t border-slate-100 p-5">
        <Link
          href={`/dashboard/viewings/${viewing.id}`}
          className="inline-flex h-10 items-center justify-center rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800"
        >
          View Details
        </Link>
      </div>

    </article>
  );
}

export function ViewingsList() {
  const [page, setPage] =
    useState(1);

  const [
    draftFilters,
    setDraftFilters,
  ] =
    useState<AppliedFilters>(
      EMPTY_FILTERS,
    );

  const [
    appliedFilters,
    setAppliedFilters,
  ] =
    useState<AppliedFilters>(
      EMPTY_FILTERS,
    );

  const query = useQuery({
    queryKey: [
      "viewings",
      {
        page,
        ...appliedFilters,
      },
    ],

    queryFn: () =>
      viewingsService.getViewings({
        page,
        limit: 10,

        search:
          appliedFilters.search ||
          undefined,

        status:
          appliedFilters.status ||
          undefined,

        dateFrom:
          toStartOfDayIso(
            appliedFilters.dateFrom,
          ),

        dateTo:
          toEndOfDayIso(
            appliedFilters.dateTo,
          ),
      }),
  });

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setPage(1);

    setAppliedFilters({
      search:
        draftFilters.search.trim(),

      status:
        draftFilters.status,

      dateFrom:
        draftFilters.dateFrom,

      dateTo:
        draftFilters.dateTo,
    });
  }

  function clearFilters() {
    setDraftFilters(
      EMPTY_FILTERS,
    );

    setAppliedFilters(
      EMPTY_FILTERS,
    );

    setPage(1);
  }

  const inputClass =
    "h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">
            Viewing Appointments
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Review property viewing
            requests and appointment
            schedules.
          </p>
        </div>

        <Link
          href="/dashboard/viewings/new"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 text-sm font-semibold text-white hover:bg-emerald-800"
        >
          <Plus size={17} />
          New Appointment
        </Link>
      </header>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(220px,1fr)_190px_170px_170px_auto]">
          <label className="relative">
            <Search
              size={17}
              className="pointer-events-none absolute left-3 top-3.5 text-slate-400"
            />

            <input
              type="search"
              placeholder="Search viewer or property"
              value={
                draftFilters.search
              }
              onChange={(event) => {
                setDraftFilters(
                  (current) => ({
                    ...current,
                    search:
                      event.target.value,
                  }),
                );
              }}
              className={`${inputClass} pl-10`}
            />
          </label>

          <select
            value={
              draftFilters.status
            }
            onChange={(event) => {
              setDraftFilters(
                (current) => ({
                  ...current,
                  status:
                    event.target
                      .value as
                      | ViewingStatus
                      | "",
                }),
              );
            }}
            className={inputClass}
          >
            <option value="">
              All statuses
            </option>

            {VIEWING_STATUSES.map(
              (status) => (
                <option
                  key={status}
                  value={status}
                >
                  {formatLabel(
                    status,
                  )}
                </option>
              ),
            )}
          </select>

          <input
            type="date"
            aria-label="Date from"
            value={
              draftFilters.dateFrom
            }
            onChange={(event) => {
              setDraftFilters(
                (current) => ({
                  ...current,
                  dateFrom:
                    event.target.value,
                }),
              );
            }}
            className={inputClass}
          />

          <input
            type="date"
            aria-label="Date to"
            value={
              draftFilters.dateTo
            }
            onChange={(event) => {
              setDraftFilters(
                (current) => ({
                  ...current,
                  dateTo:
                    event.target.value,
                }),
              );
            }}
            className={inputClass}
          />

          <div className="flex gap-2">
            <button
              type="submit"
              className="inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800"
            >
              Apply
            </button>

            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Clear
            </button>
          </div>
        </div>
      </form>

      {query.isPending && (
        <div className="flex min-h-72 items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center gap-3 text-slate-600">
            <LoaderCircle
              size={22}
              className="animate-spin"
            />

            <span>
              Loading appointments...
            </span>
          </div>
        </div>
      )}

      {query.isError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <h2 className="font-semibold text-red-900">
            Unable to load viewings
          </h2>

          <p className="mt-2 text-sm text-red-700">
            {getErrorMessage(
              query.error,
            )}
          </p>

          <button
            type="button"
            onClick={() => {
              void query.refetch();
            }}
            className="mt-4 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white"
          >
            Try Again
          </button>
        </div>
      )}

      {query.data &&
        query.data.items.length ===
          0 && (
          <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <CalendarDays
              size={36}
              className="text-slate-400"
            />

            <h2 className="mt-4 text-lg font-semibold text-slate-800">
              No viewing appointments
            </h2>

            <p className="mt-2 max-w-md text-sm text-slate-500">
              No appointments match
              the current filters.
            </p>
          </div>
        )}

      {query.data &&
        query.data.items.length >
          0 && (
          <>
            <div className="space-y-4">
              {query.data.items.map(
                (viewing) => (
                  <ViewingCard
                    key={viewing.id}
                    viewing={viewing}
                  />
                ),
              )}
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                Page{" "}
                {
                  query.data
                    .pagination.page
                }{" "}
                of{" "}
                {Math.max(
                  query.data
                    .pagination
                    .totalPages,
                  1,
                )}
                {" · "}
                {
                  query.data
                    .pagination.total
                }{" "}
                total appointment
                {query.data.pagination
                  .total === 1
                  ? ""
                  : "s"}
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPage(
                      (current) =>
                        Math.max(
                          current - 1,
                          1,
                        ),
                    );
                  }}
                  disabled={
                    !query.data
                      .pagination
                      .hasPreviousPage
                 }
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronLeft
                    size={16}
                  />
                  Previous
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPage(
                      (current) =>
                        current + 1,
                    );
                  }}
                  disabled={
                    !query.data
                      .pagination
                      .hasNextPage
                  }
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                  <ChevronRight
                    size={16}
                  />
                </button>
              </div>
            </div>
          </>
        )}
    </div>
  );
}
