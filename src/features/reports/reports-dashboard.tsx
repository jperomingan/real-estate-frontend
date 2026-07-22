"use client";

import {
  useMutation,
  useQuery,
} from "@tanstack/react-query";
import axios from "axios";
import {
  BarChart3,
  Building2,
  CalendarDays,
  Download,
  FileSpreadsheet,
  LoaderCircle,
  PhilippinePeso,
  RefreshCcw,
  Users,
} from "lucide-react";
import {
  type FormEvent,
  type ReactNode,
  useState,
} from "react";

import {
  reportsService,
} from "./reports-service";
import type {
  ReportExportType,
  ReportQueryParams,
} from "./reports-types";

interface ApiErrorResponse {
  message?: string;

  error?: {
    message?: string;
  };
}

interface DistributionItem {
  label: string;
  count: number;
}

const numberFormatter =
  new Intl.NumberFormat(
    "en-PH",
  );

const currencyFormatter =
  new Intl.NumberFormat(
    "en-PH",
    {
      style: "currency",
      currency: "PHP",
      maximumFractionDigits: 2,
    },
  );

const EXPORT_OPTIONS: Array<{
  type: ReportExportType;
  label: string;
}> = [
  {
    type: "summary",
    label: "Summary",
  },
  {
    type: "leads-sources",
    label: "Lead Sources",
  },
  {
    type: "leads-statuses",
    label: "Lead Statuses",
  },
  {
    type: "properties-statuses",
    label: "Property Statuses",
  },
  {
    type: "viewings-statuses",
    label: "Viewing Statuses",
  },
  {
    type: "revenues-statuses",
    label: "Revenue Statuses",
  },
];

function formatLabel(
  value: string | null,
): string {
  if (!value) {
    return "Unspecified";
  }

  return value
    .toLowerCase()
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1),
    )
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

  return "The report operation failed.";
}

function toStartOfDayIso(
  dateValue: string,
): string {
  return new Date(
    `${dateValue}T00:00:00.000`,
  ).toISOString();
}

function toEndOfDayIso(
  dateValue: string,
): string {
  return new Date(
    `${dateValue}T23:59:59.999`,
  ).toISOString();
}

export function ReportsDashboard() {
  const [dateFrom, setDateFrom] =
    useState("");

  const [dateTo, setDateTo] =
    useState("");

  const [
    appliedParams,
    setAppliedParams,
  ] =
    useState<ReportQueryParams>(
      {},
    );

  const [
    validationError,
    setValidationError,
  ] = useState<string | null>(
    null,
  );

  const reportsQuery = useQuery({
    queryKey: [
      "reports",
      "dashboard",
      appliedParams,
    ],

    queryFn: () =>
      reportsService
        .getDashboardData(
          appliedParams,
        ),
  });

  const exportMutation =
    useMutation({
      mutationFn: ({
        type,
        params,
      }: {
        type: ReportExportType;
        params:
          ReportQueryParams;
      }) =>
        reportsService.exportCsv(
          type,
          params,
        ),
    });

  const data = reportsQuery.data;

  function applyFilters(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setValidationError(null);
    exportMutation.reset();

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

    setAppliedParams({
      ...(dateFrom
        ? {
            dateFrom:
              toStartOfDayIso(
                dateFrom,
              ),
          }
        : {}),

      ...(dateTo
        ? {
            dateTo:
              toEndOfDayIso(
                dateTo,
              ),
          }
        : {}),
    });
  }

  function resetFilters() {
    setDateFrom("");
    setDateTo("");
    setAppliedParams({});
    setValidationError(null);
    exportMutation.reset();
  }

  function exportReport(
    type: ReportExportType,
  ) {
    exportMutation.reset();

    exportMutation.mutate({
      type,
      params: appliedParams,
    });
  }

  return (
    <div className="space-y-7">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">
            Reports
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Review lead, property,
            viewing, and commission
            performance.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            reportsQuery.refetch()
          }
          disabled={
            reportsQuery.isFetching
          }
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCcw
            size={16}
            className={
              reportsQuery.isFetching
                ? "animate-spin"
                : undefined
            }
          />

          Refresh
        </button>
      </header>

      <form
        onSubmit={applyFilters}
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div className="flex items-center gap-2">
          <CalendarDays
            size={18}
            className="text-emerald-700"
          />

          <h2 className="font-semibold text-slate-950">
            Reporting period
          </h2>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_auto_auto]">
          <label className="space-y-2">
            <span className="block text-sm font-medium text-slate-700">
              Start date
            </span>

            <input
              type="date"
              value={dateFrom}
              onChange={(event) =>
                setDateFrom(
                  event.target.value,
                )
              }
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            />
          </label>

          <label className="space-y-2">
            <span className="block text-sm font-medium text-slate-700">
              End date
            </span>

            <input
              type="date"
              value={dateTo}
              onChange={(event) =>
                setDateTo(
                  event.target.value,
                )
              }
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            />
          </label>

          <button
            type="submit"
            className="h-11 self-end rounded-xl bg-emerald-700 px-5 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            Apply Filters
          </button>

          <button
            type="button"
            onClick={resetFilters}
            className="h-11 self-end rounded-xl border border-slate-300 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Reset
          </button>
        </div>

        {validationError && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {validationError}
          </div>
        )}
      </form>

      {reportsQuery.isLoading ? (
        <div className="flex min-h-72 items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <LoaderCircle className="animate-spin text-emerald-700" />
        </div>
      ) : reportsQuery.isError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {getErrorMessage(
            reportsQuery.error,
          )}
        </div>
      ) : data ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              label="Total Leads"
              value={numberFormatter.format(
                data.summary.leads
                  .total,
              )}
              icon={<Users size={21} />}
            />

            <SummaryCard
              label="Properties"
              value={numberFormatter.format(
                data.summary
                  .properties.total,
              )}
              icon={
                <Building2 size={21} />
              }
            />

            <SummaryCard
              label="Viewings"
              value={numberFormatter.format(
                data.summary
                  .viewings.total,
              )}
              icon={
                <CalendarDays
                  size={21}
                />
              }
            />

            <SummaryCard
              label="Commission Amount"
              value={currencyFormatter.format(
                data.summary
                  .revenues
                  .totalAmount,
              )}
              subtitle={`${numberFormatter.format(
                data.summary
                  .revenues
                  .totalRecords,
              )} revenue record${
                data.summary
                  .revenues
                  .totalRecords === 1
                  ? ""
                  : "s"
              }`}
              icon={
                <PhilippinePeso
                  size={21}
                />
              }
            />
          </section>

          <section className="grid gap-5 xl:grid-cols-2">
            <DistributionPanel
              title="Lead Sources"
              description="How leads entered the system."
              items={data.leadSources.map(
                (item) => ({
                  label:
                    formatLabel(
                      item.source,
                    ),
                  count: item.count,
                }),
              )}
            />

            <DistributionPanel
              title="Lead Statuses"
              description="Current lead pipeline distribution."
              items={data.leadStatuses.map(
                (item) => ({
                  label:
                    formatLabel(
                      item.status,
                    ),
                  count: item.count,
                }),
              )}
            />

            <DistributionPanel
              title="Property Statuses"
              description="Current listing inventory by status."
              items={data.propertyStatuses.map(
                (item) => ({
                  label:
                    formatLabel(
                      item.status,
                    ),
                  count: item.count,
                }),
              )}
            />

            <DistributionPanel
              title="Viewing Statuses"
              description="Appointment progress and outcomes."
              items={data.viewingStatuses.map(
                (item) => ({
                  label:
                    formatLabel(
                      item.status,
                    ),
                  count: item.count,
                }),
              )}
            />

            <DistributionPanel
              title="Revenue Payment Statuses"
              description="Revenue records grouped by payment status."
              items={data.revenueStatuses.map(
                (item) => ({
                  label:
                    formatLabel(
                      item.paymentStatus,
                    ),
                  count: item.count,
                }),
              )}
              className="xl:col-span-2"
            />
          </section>
        </>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <FileSpreadsheet
            size={19}
            className="text-emerald-700"
          />

          <h2 className="font-semibold text-slate-950">
            Export CSV reports
          </h2>
        </div>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Exports use the currently
          applied reporting period.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {EXPORT_OPTIONS.map(
            (option) => {
              const isExporting =
                exportMutation
                  .isPending &&
                exportMutation
                  .variables
                  ?.type ===
                  option.type;

              return (
                <button
                  key={option.type}
                  type="button"
                  onClick={() =>
                    exportReport(
                      option.type,
                    )
                  }
                  disabled={
                    exportMutation
                      .isPending
                  }
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-50"
                >
                  {isExporting ? (
                    <LoaderCircle
                      size={16}
                      className="animate-spin"
                    />
                  ) : (
                    <Download
                      size={16}
                    />
                  )}

                  {isExporting
                    ? "Exporting..."
                    : option.label}
                </button>
              );
            },
          )}
        </div>

        {exportMutation.isError && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {getErrorMessage(
              exportMutation.error,
            )}
          </div>
        )}

        {exportMutation.isSuccess && (
          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            CSV report downloaded
            successfully.
          </div>
        )}
      </section>
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
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm font-medium text-slate-500">
          {label}
        </p>

        <span className="rounded-xl bg-emerald-50 p-2 text-emerald-700">
          {icon}
        </span>
      </div>

      <p className="mt-4 break-words text-2xl font-bold tracking-tight text-slate-950">
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

function DistributionPanel({
  title,
  description,
  items,
  className = "",
}: {
  title: string;
  description: string;
  items: DistributionItem[];
  className?: string;
}) {
  const maximumCount =
    Math.max(
      ...items.map(
        (item) => item.count,
      ),
      0,
    );

  const total = items.reduce(
    (sum, item) =>
      sum + item.count,
    0,
  );

  return (
    <article
      className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ${className}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold text-slate-950">
            {title}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {description}
          </p>
        </div>

        <BarChart3
          size={20}
          className="shrink-0 text-emerald-700"
        />
      </div>

      {items.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
          No report data available for
          this period.
        </div>
      ) : (
        <div className="mt-6 space-y-5">
          {items.map((item) => {
            const percentage =
              maximumCount > 0
                ? Math.max(
                    4,
                    (item.count /
                      maximumCount) *
                      100,
                  )
                : 0;

            return (
              <div key={item.label}>
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="font-medium text-slate-700">
                    {item.label}
                  </span>

                  <span className="font-semibold text-slate-950">
                    {numberFormatter.format(
                      item.count,
                    )}
                  </span>
                </div>

                <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-emerald-600"
                    style={{
                      width:
                        `${percentage}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}

          <div className="border-t border-slate-100 pt-4 text-sm text-slate-500">
            Total:{" "}
            <span className="font-semibold text-slate-800">
              {numberFormatter.format(
                total,
              )}
            </span>
          </div>
        </div>
      )}
    </article>
  );
}
