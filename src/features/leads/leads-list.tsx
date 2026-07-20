"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  RefreshCw,
  Search,
  UsersRound,
} from "lucide-react";
import {
  type FormEvent,
  useState,
} from "react";

import { leadsService } from "./leads-service";
import {
  LEAD_SOURCES,
  LEAD_STATUSES,
  type Lead,
  type LeadSource,
  type LeadStatus,
} from "./leads-types";

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
  value: number | string | null,
): string {
  if (
    value === null ||
    value === ""
  ) {
    return "Not specified";
  }

  const amount = Number(value);

  if (Number.isNaN(amount)) {
    return "Not specified";
  }

  return moneyFormatter.format(amount);
}

function formatDate(
  value: string | null,
): string {
  if (!value) {
    return "Not specified";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not specified";
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

function getLeadName(
  lead: Lead,
): string {
  return [
    lead.firstName,
    lead.lastName,
  ]
    .filter(Boolean)
    .join(" ");
}

function getBrokerName(
  lead: Lead,
): string {
  if (!lead.broker) {
    return "Unassigned";
  }

  return [
    lead.broker.firstName,
    lead.broker.lastName,
  ]
    .filter(Boolean)
    .join(" ");
}

function getErrorMessage(
  error: unknown,
): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to load leads.";
}

export function LeadsList() {
  const [searchInput, setSearchInput] =
    useState("");
  const [search, setSearch] =
    useState("");
  const [status, setStatus] =
    useState<LeadStatus | "">("");
  const [source, setSource] =
    useState<LeadSource | "">("");
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
      "leads",
      {
        search,
        status,
        source,
        page,
      },
    ],
    queryFn: () =>
      leadsService.getLeads({
        search:
          search || undefined,
        status:
          status || undefined,
        source:
          source || undefined,
        page,
        limit: 10,
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
    setStatus("");
    setSource("");
    setPage(1);
  }

  const leads = data?.items ?? [];
  const pagination = data?.pagination;

  const totalPages = Math.max(
    pagination?.totalPages ?? 0,
    1,
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-emerald-700">
            Lead management
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
            Leads
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Track prospective clients
            throughout the sales process.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/leads/new"
            className="inline-flex items-center justify-center rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            Add Lead
          </Link>

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
        </div>
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
              placeholder="Search name, email, or phone"
              className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <select
            value={status}
            onChange={(event) => {
              setStatus(
                event.target.value as
                | LeadStatus
                | "",
              );
              setPage(1);
            }}
            className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          >
            <option value="">
              All statuses
            </option>

            {LEAD_STATUSES.map(
              (leadStatus) => (
                <option
                  key={leadStatus}
                  value={leadStatus}
                >
                  {formatLabel(
                    leadStatus,
                  )}
                </option>
              ),
            )}
          </select>

          <select
            value={source}
            onChange={(event) => {
              setSource(
                event.target.value as
                | LeadSource
                | "",
              );
              setPage(1);
            }}
            className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          >
            <option value="">
              All sources
            </option>

            {LEAD_SOURCES.map(
              (leadSource) => (
                <option
                  key={leadSource}
                  value={leadSource}
                >
                  {formatLabel(
                    leadSource,
                  )}
                </option>
              ),
            )}
          </select>

          <button
            type="submit"
            className="h-11 rounded-xl bg-emerald-700 px-5 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            Search
          </button>
        </form>

        {(search ||
          status ||
          source) && (
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

            <span>Loading leads...</span>
          </div>
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <h2 className="font-semibold text-red-900">
            Unable to load leads
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
      ) : leads.length === 0 ? (
        <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <div className="rounded-full bg-emerald-50 p-4 text-emerald-700">
            <UsersRound size={30} />
          </div>

          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            No leads found
          </h2>

          <p className="mt-2 max-w-md text-sm text-slate-500">
            New inquiries will appear
            here. You may also adjust
            your search and filters.
          </p>
        </div>
      ) : (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  {[
                    "Lead",
                    "Status",
                    "Source",
                    "Property",
                    "Broker",
                    "Budget",
                    "Created",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="hover:bg-slate-50"
                  >
                    <td className="whitespace-nowrap px-5 py-4">
                      <Link
                        href={`/dashboard/leads/${lead.id}`}
                        className="font-medium text-emerald-700 hover:text-emerald-800 hover:underline"
                      >
                        {getLeadName(lead)}
                      </Link>

                      <p className="mt-1 text-xs text-slate-500">
                        {lead.email ??
                          lead.phone}
                      </p>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4">
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        {formatLabel(
                          lead.status,
                        )}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700">
                      {formatLabel(
                        lead.source,
                      )}
                    </td>

                    <td className="min-w-[200px] px-5 py-4">
                      <p className="text-sm font-medium text-slate-800">
                        {lead.property
                          ?.title ??
                          "General inquiry"}
                      </p>

                      {lead.property && (
                        <p className="mt-1 text-xs text-slate-500">
                          {
                            lead.property
                              .city
                          }
                          ,{" "}
                          {
                            lead.property
                              .province
                          }
                        </p>
                      )}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700">
                      {getBrokerName(
                        lead,
                      )}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-slate-800">
                      {formatMoney(
                        lead.budget,
                      )}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                      {formatDate(
                        lead.createdAt,
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <footer className="flex flex-col justify-between gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center">
            <p className="text-sm text-slate-500">
              {pagination?.total ?? 0}{" "}
              total leads
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
                disabled={page <= 1}
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
                  page >= totalPages
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
        </section>
      )}
    </div>
  );
}
