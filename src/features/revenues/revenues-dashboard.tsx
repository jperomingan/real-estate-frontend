"use client";

import {
  useQuery,
} from "@tanstack/react-query";
import {
  CalendarDays,
  LoaderCircle,
  PhilippinePeso,
  Plus,
  Search,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import {
  type FormEvent,
  type ReactNode,
  useState,
} from "react";

import {
  revenuesService,
} from "./revenues-service";
import type {
  RevenueCommissionStatus,
  RevenuePaymentStatus,
} from "./revenues-types";
import {
  formatRevenueDate,
  formatRevenueMoney,
  getRevenueErrorMessage,
} from "./revenues-utils";

const PAYMENT_CLASSES: Record<
  RevenuePaymentStatus,
  string
> = {
  UNPAID:
    "bg-red-50 text-red-700 ring-red-200",

  PARTIAL:
    "bg-amber-50 text-amber-700 ring-amber-200",

  PAID:
    "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

const COMMISSION_CLASSES: Record<
  RevenueCommissionStatus,
  string
> = {
  PENDING:
    "bg-slate-100 text-slate-700 ring-slate-200",

  RELEASED:
    "bg-blue-50 text-blue-700 ring-blue-200",
};

function toStartOfDayIso(
  value: string,
) {
  return new Date(
    `${value}T00:00:00.000`,
  ).toISOString();
}

function toEndOfDayIso(
  value: string,
) {
  return new Date(
    `${value}T23:59:59.999`,
  ).toISOString();
}

function formatStatus(
  value: string,
) {
  return value
    .toLowerCase()
    .split("_")
    .map(
      (word) =>
        word.charAt(0)
          .toUpperCase() +
        word.slice(1),
    )
    .join(" ");
}

export function RevenuesDashboard() {
  const [page, setPage] =
    useState(1);

  const [
    draftSearch,
    setDraftSearch,
  ] = useState("");

  const [
    appliedSearch,
    setAppliedSearch,
  ] = useState("");

  const [
    paymentStatus,
    setPaymentStatus,
  ] = useState<
    RevenuePaymentStatus | "ALL"
  >("ALL");

  const [
    commissionStatus,
    setCommissionStatus,
  ] = useState<
    | RevenueCommissionStatus
    | "ALL"
  >("ALL");

  const [
    dateFrom,
    setDateFrom,
  ] = useState("");

  const [
    dateTo,
    setDateTo,
  ] = useState("");

  const [
    appliedDateFrom,
    setAppliedDateFrom,
  ] = useState("");

  const [
    appliedDateTo,
    setAppliedDateTo,
  ] = useState("");

  const [
    validationError,
    setValidationError,
  ] = useState<string | null>(
    null,
  );

  const listQuery = useQuery({
    queryKey: [
      "revenues",
      "list",
      {
        page,
        appliedSearch,
        paymentStatus,
        commissionStatus,
        appliedDateFrom,
        appliedDateTo,
      },
    ],

    queryFn: () =>
      revenuesService.list({
        page,
        limit: 10,

        ...(appliedSearch
          ? {
              search:
                appliedSearch,
            }
          : {}),

        ...(paymentStatus !==
        "ALL"
          ? {
              paymentStatus,
            }
          : {}),

        ...(commissionStatus !==
        "ALL"
          ? {
              commissionStatus,
            }
          : {}),

        ...(appliedDateFrom
          ? {
              dateFrom:
                toStartOfDayIso(
                  appliedDateFrom,
                ),
            }
          : {}),

        ...(appliedDateTo
          ? {
              dateTo:
                toEndOfDayIso(
                  appliedDateTo,
                ),
            }
          : {}),
      }),
  });

  const summaryQuery = useQuery({
    queryKey: [
      "revenues",
      "summary",
    ],

    queryFn: () =>
      revenuesService.summary(),
  });

  const items =
    listQuery.data?.items ?? [];

  const pagination =
    listQuery.data
      ?.pagination;

  function applyFilters(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setValidationError(null);

    if (
      dateFrom &&
      dateTo &&
      dateFrom > dateTo
    ) {
      setValidationError(
        "The start date must be before or equal to the end date.",
      );
      return;
    }

    setAppliedSearch(
      draftSearch.trim(),
    );

    setAppliedDateFrom(
      dateFrom,
    );

    setAppliedDateTo(dateTo);
    setPage(1);
  }

  function resetFilters() {
    setDraftSearch("");
    setAppliedSearch("");

    setPaymentStatus("ALL");
    setCommissionStatus("ALL");

    setDateFrom("");
    setDateTo("");

    setAppliedDateFrom("");
    setAppliedDateTo("");

    setValidationError(null);
    setPage(1);
  }

  return (
    <div className="space-y-7">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">
            Revenue
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Track property sales,
            client payments, and
            broker commissions.
          </p>
        </div>

        <Link
          href="/dashboard/revenues/new"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 text-sm font-semibold text-white hover:bg-emerald-800"
        >
          <Plus size={17} />
          New Revenue
        </Link>
      </header>

      {summaryQuery.isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {getRevenueErrorMessage(
            summaryQuery.error,
          )}
        </div>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Gross Sales"
            value={formatRevenueMoney(
              summaryQuery.data
                ?.totalGrossSales ??
                0,
            )}
            icon={
              <PhilippinePeso
                size={20}
              />
            }
          />

          <SummaryCard
            label="Commission"
            value={formatRevenueMoney(
              summaryQuery.data
                ?.totalCommission ??
                0,
            )}
            subtitle={`${summaryQuery.data?.pendingCommissionCount ?? 0} pending`}
            icon={
              <WalletCards
                size={20}
              />
            }
          />

          <SummaryCard
            label="Payments Received"
            value={formatRevenueMoney(
              summaryQuery.data
                ?.totalPaymentReceived ??
                0,
            )}
            subtitle={`${summaryQuery.data?.paidCount ?? 0} fully paid`}
            icon={
              <PhilippinePeso
                size={20}
              />
            }
          />

          <SummaryCard
            label="Receivable"
            value={formatRevenueMoney(
              summaryQuery.data
                ?.totalReceivable ??
                0,
            )}
            subtitle={`${summaryQuery.data?.unpaidCount ?? 0} unpaid, ${summaryQuery.data?.partiallyPaidCount ?? 0} partial`}
            icon={
              <CalendarDays
                size={20}
              />
            }
          />
        </section>
      )}

      <form
        onSubmit={applyFilters}
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <label className="space-y-2 xl:col-span-2">
            <span className="block text-sm font-medium text-slate-700">
              Search
            </span>

            <div className="relative">
              <Search
                size={17}
                className="absolute left-3 top-3 text-slate-400"
              />

              <input
                value={draftSearch}
                onChange={(event) =>
                  setDraftSearch(
                    event.target.value,
                  )
                }
                placeholder="Property, broker, or notes"
                className="h-11 w-full rounded-xl border border-slate-300 pl-10 pr-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
          </label>

          <label className="space-y-2">
            <span className="block text-sm font-medium text-slate-700">
              Payment
            </span>

            <select
              value={paymentStatus}
              onChange={(event) => {
                setPaymentStatus(
                  event.target.value as
                    | RevenuePaymentStatus
                    | "ALL",
                );
                setPage(1);
              }}
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm"
            >
              <option value="ALL">
                All payments
              </option>
              <option value="UNPAID">
                Unpaid
              </option>
              <option value="PARTIAL">
                Partial
              </option>
              <option value="PAID">
                Paid
              </option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="block text-sm font-medium text-slate-700">
              Commission
            </span>

            <select
              value={
                commissionStatus
              }
              onChange={(event) => {
                setCommissionStatus(
                  event.target.value as
                    | RevenueCommissionStatus
                    | "ALL",
                );
                setPage(1);
              }}
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm"
            >
              <option value="ALL">
                All commissions
              </option>
              <option value="PENDING">
                Pending
              </option>
              <option value="RELEASED">
                Released
              </option>
            </select>
          </label>

          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="h-11 flex-1 rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white"
            >
              Apply
            </button>

            <button
              type="button"
              onClick={resetFilters}
              className="h-11 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="block text-sm font-medium text-slate-700">
              Sale date from
            </span>

            <input
              type="date"
              value={dateFrom}
              onChange={(event) =>
                setDateFrom(
                  event.target.value,
                )
              }
              className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm"
            />
          </label>

          <label className="space-y-2">
            <span className="block text-sm font-medium text-slate-700">
              Sale date to
            </span>

            <input
              type="date"
              value={dateTo}
              onChange={(event) =>
                setDateTo(
                  event.target.value,
                )
              }
              className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm"
            />
          </label>
        </div>

        {validationError && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {validationError}
          </div>
        )}
      </form>

      {listQuery.isLoading ? (
        <div className="flex min-h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <LoaderCircle className="animate-spin text-emerald-700" />
        </div>
      ) : listQuery.isError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {getRevenueErrorMessage(
            listQuery.error,
          )}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <PhilippinePeso className="mx-auto text-slate-400" />

          <h2 className="mt-4 font-semibold text-slate-900">
            No revenue records
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Add a completed property
            sale to begin tracking
            payments and commissions.
          </p>
        </div>
      ) : (
        <section className="space-y-4">
          {items.map((revenue) => (
            <article
              key={revenue.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${PAYMENT_CLASSES[revenue.paymentStatus]}`}
                    >
                      {formatStatus(
                        revenue.paymentStatus,
                      )}
                    </span>

                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${COMMISSION_CLASSES[revenue.commissionStatus]}`}
                    >
                      Commission{" "}
                      {formatStatus(
                        revenue.commissionStatus,
                      )}
                    </span>
                  </div>

                  <h2 className="mt-3 text-lg font-semibold text-slate-950">
                    {
                      revenue.property
                        .title
                    }
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {
                      revenue.property
                        .address
                    }
                    ,{" "}
                    {
                      revenue.property
                        .city
                    }
                  </p>
                </div>

                <div className="text-left lg:text-right">
                  <p className="text-xl font-bold text-slate-950">
                    {formatRevenueMoney(
                      revenue.grossSaleAmount,
                    )}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Sold{" "}
                    {formatRevenueDate(
                      revenue.saleDate,
                    )}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-3">
                <Metric
                  label="Payment received"
                  value={formatRevenueMoney(
                    revenue.paymentReceived,
                  )}
                />

                <Metric
                  label="Commission rate"
                  value={`${Number(revenue.commissionRate)}%`}
                />

                <Metric
                  label="Commission amount"
                  value={formatRevenueMoney(
                    revenue.commissionAmount,
                  )}
                />
              </div>

              <div className="mt-5">
                <Link
                  href={`/dashboard/revenues/${revenue.id}`}
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
                >
                  View Revenue
                </Link>
              </div>
            </article>
          ))}
        </section>
      )}

      {pagination &&
        pagination.totalPages > 1 && (
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 text-sm">
            <button
              type="button"
              disabled={
                page <= 1 ||
                listQuery.isFetching
              }
              onClick={() =>
                setPage((current) =>
                  Math.max(
                    1,
                    current - 1,
                  ),
                )
              }
              className="rounded-lg border border-slate-300 px-4 py-2 font-medium disabled:opacity-40"
            >
              Previous
            </button>

            <span className="text-slate-500">
              Page {pagination.page} of{" "}
              {pagination.totalPages}
            </span>

            <button
              type="button"
              disabled={
                page >=
                  pagination.totalPages ||
                listQuery.isFetching
              }
              onClick={() =>
                setPage(
                  (current) =>
                    current + 1,
                )
              }
              className="rounded-lg border border-slate-300 px-4 py-2 font-medium disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  subtitle,
  icon,
}: {
  label: string;
  value: string;
  subtitle?: string;
  icon: ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-slate-500">
          {label}
        </p>

        <span className="rounded-xl bg-emerald-50 p-2 text-emerald-700">
          {icon}
        </span>
      </div>

      <p className="mt-4 break-words text-2xl font-bold text-slate-950">
        {value}
      </p>

      {subtitle && (
        <p className="mt-2 text-xs text-slate-500">
          {subtitle}
        </p>
      )}
    </article>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 font-semibold text-slate-800">
        {value}
      </p>
    </div>
  );
}
