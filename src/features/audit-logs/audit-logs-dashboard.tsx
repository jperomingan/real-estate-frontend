"use client";

import {
  useQuery,
} from "@tanstack/react-query";
import {
  Activity,
  ArrowRight,
  CalendarClock,
  FileClock,
  LoaderCircle,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import {
  type FormEvent,
  type ReactNode,
  useState,
} from "react";

import {
  auditLogsService,
} from "./audit-logs-service";
import type {
  AuditAction,
} from "./audit-log-types";
import {
  formatAuditAction,
  formatAuditDate,
  getAuditErrorMessage,
} from "./audit-log-utils";

type ActionFilter =
  | AuditAction
  | "ALL";

const ACTION_OPTIONS:
  Array<{
    value: ActionFilter;
    label: string;
  }> = [
    {
      value: "ALL",
      label: "All actions",
    },
    {
      value: "CREATE",
      label: "Create",
    },
    {
      value: "UPDATE",
      label: "Update",
    },
    {
      value: "DELETE",
      label: "Delete",
    },
    {
      value: "APPROVE",
      label: "Approve",
    },
    {
      value: "REJECT",
      label: "Reject",
    },
    {
      value: "LOGIN",
      label: "Login",
    },
    {
      value: "LOGOUT",
      label: "Logout",
    },
    {
      value: "STATUS_CHANGE",
      label: "Status Change",
    },
  ];

const ACTION_CLASSES: Record<
  AuditAction,
  string
> = {
  CREATE:
    "bg-emerald-50 text-emerald-700 ring-emerald-200",

  UPDATE:
    "bg-blue-50 text-blue-700 ring-blue-200",

  DELETE:
    "bg-red-50 text-red-700 ring-red-200",

  APPROVE:
    "bg-green-50 text-green-700 ring-green-200",

  REJECT:
    "bg-rose-50 text-rose-700 ring-rose-200",

  LOGIN:
    "bg-violet-50 text-violet-700 ring-violet-200",

  LOGOUT:
    "bg-slate-100 text-slate-700 ring-slate-200",

  STATUS_CHANGE:
    "bg-amber-50 text-amber-700 ring-amber-200",
};

function toStartOfDayIso(
  value: string,
): string {
  return new Date(
    `${value}T00:00:00.000`,
  ).toISOString();
}

function toEndOfDayIso(
  value: string,
): string {
  return new Date(
    `${value}T23:59:59.999`,
  ).toISOString();
}

export function AuditLogsDashboard() {
  const [page, setPage] =
    useState(1);

  const [
    action,
    setAction,
  ] =
    useState<ActionFilter>(
      "ALL",
    );

  const [
    resourceType,
    setResourceType,
  ] = useState("");

  const [
    resourceId,
    setResourceId,
  ] = useState("");

  const [
    actorUserId,
    setActorUserId,
  ] = useState("");

  const [
    dateFrom,
    setDateFrom,
  ] = useState("");

  const [
    dateTo,
    setDateTo,
  ] = useState("");

  const [
    appliedResourceType,
    setAppliedResourceType,
  ] = useState("");

  const [
    appliedResourceId,
    setAppliedResourceId,
  ] = useState("");

  const [
    appliedActorUserId,
    setAppliedActorUserId,
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

  const auditQuery = useQuery({
    queryKey: [
      "audit-logs",
      "list",
      {
        page,
        action,
        appliedResourceType,
        appliedResourceId,
        appliedActorUserId,
        appliedDateFrom,
        appliedDateTo,
      },
    ],

    queryFn: () =>
      auditLogsService.list({
        page,
        limit: 10,

        ...(action !== "ALL"
          ? { action }
          : {}),

        ...(appliedResourceType
          ? {
              resourceType:
                appliedResourceType,
            }
          : {}),

        ...(appliedResourceId
          ? {
              resourceId:
                appliedResourceId,
            }
          : {}),

        ...(appliedActorUserId
          ? {
              actorUserId:
                appliedActorUserId,
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

  const items =
    auditQuery.data?.items ?? [];

  const pagination =
    auditQuery.data
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

    setAppliedResourceType(
      resourceType.trim(),
    );

    setAppliedResourceId(
      resourceId.trim(),
    );

    setAppliedActorUserId(
      actorUserId.trim(),
    );

    setAppliedDateFrom(
      dateFrom,
    );

    setAppliedDateTo(dateTo);
    setPage(1);
  }

  function resetFilters() {
    setAction("ALL");

    setResourceType("");
    setResourceId("");
    setActorUserId("");

    setDateFrom("");
    setDateTo("");

    setAppliedResourceType("");
    setAppliedResourceId("");
    setAppliedActorUserId("");

    setAppliedDateFrom("");
    setAppliedDateTo("");

    setValidationError(null);
    setPage(1);
  }

  return (
    <div className="space-y-7">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">
          Audit Logs
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Review administrative
          actions, system changes,
          and account activity.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          label="Matching Records"
          value={
            pagination?.total ?? 0
          }
          icon={
            <FileClock size={20} />
          }
        />

        <SummaryCard
          label="Current Page"
          value={items.length}
          icon={
            <Activity size={20} />
          }
        />

        <SummaryCard
          label="Page Number"
          value={
            pagination?.page ?? 1
          }
          icon={
            <CalendarClock
              size={20}
            />
          }
        />
      </section>

      <form
        onSubmit={applyFilters}
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="space-y-2">
            <span className="block text-sm font-medium text-slate-700">
              Action
            </span>

            <select
              value={action}
              onChange={(event) => {
                setAction(
                  event.target
                    .value as
                    ActionFilter,
                );

                setPage(1);
              }}
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm"
            >
              {ACTION_OPTIONS.map(
                (option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ),
              )}
            </select>
          </label>

          <label className="space-y-2">
            <span className="block text-sm font-medium text-slate-700">
              Resource type
            </span>

            <input
              value={resourceType}
              onChange={(event) =>
                setResourceType(
                  event.target.value,
                )
              }
              placeholder="Property, Lead, Revenue"
              className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm"
            />
          </label>

          <label className="space-y-2">
            <span className="block text-sm font-medium text-slate-700">
              Resource ID
            </span>

            <input
              value={resourceId}
              onChange={(event) =>
                setResourceId(
                  event.target.value,
                )
              }
              placeholder="Optional record ID"
              className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm"
            />
          </label>

          <label className="space-y-2">
            <span className="block text-sm font-medium text-slate-700">
              Actor user ID
            </span>

            <input
              value={actorUserId}
              onChange={(event) =>
                setActorUserId(
                  event.target.value,
                )
              }
              placeholder="Optional user UUID"
              className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm"
            />
          </label>

          <label className="space-y-2">
            <span className="block text-sm font-medium text-slate-700">
              Date from
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
              Date to
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

          <button
            type="submit"
            className="h-11 self-end rounded-xl bg-blue-700 px-5 text-sm font-semibold text-white hover:bg-blue-800"
          >
            Apply Filters
          </button>

          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex h-11 items-center justify-center gap-2 self-end rounded-xl border border-slate-300 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RotateCcw size={16} />
            Reset
          </button>
        </div>

        {validationError && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {validationError}
          </div>
        )}
      </form>

      {auditQuery.isLoading ? (
        <div className="flex min-h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <LoaderCircle className="animate-spin text-blue-700" />
        </div>
      ) : auditQuery.isError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {getAuditErrorMessage(
            auditQuery.error,
          )}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <FileClock className="mx-auto text-slate-400" />

          <h2 className="mt-4 font-semibold text-slate-900">
            No audit logs found
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Adjust the filters or
            perform a system action
            that generates an audit
            record.
          </p>
        </div>
      ) : (
        <section className="space-y-3">
          {items.map((audit) => (
            <article
              key={audit.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${ACTION_CLASSES[audit.action]}`}
                    >
                      {formatAuditAction(
                        audit.action,
                      )}
                    </span>

                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                      {audit.resourceType}
                    </span>
                  </div>

                  <h2 className="mt-3 font-semibold text-slate-950">
                    {audit.description ??
                      `${formatAuditAction(audit.action)} ${audit.resourceType}`}
                  </h2>

                  <p className="mt-2 text-sm text-slate-500">
                    Actor:{" "}
                    {audit.actorUser
                      ? `${audit.actorUser.firstName} ${audit.actorUser.lastName} (${audit.actorUser.role})`
                      : "System"}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    {formatAuditDate(
                      audit.createdAt,
                    )}
                  </p>
                </div>

                <Link
                  href={`/dashboard/audit-logs/${audit.id}`}
                  className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 text-sm font-semibold text-blue-700 hover:bg-blue-100"
                >
                  View Details
                  <ArrowRight
                    size={16}
                  />
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
                auditQuery.isFetching
              }
              onClick={() =>
                setPage(
                  (current) =>
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
                auditQuery.isFetching
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
  icon,
}: {
  label: string;
  value: number;
  icon: ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-slate-500">
          {label}
        </p>

        <span className="rounded-xl bg-blue-50 p-2 text-blue-700">
          {icon}
        </span>
      </div>

      <p className="mt-4 text-3xl font-bold text-slate-950">
        {value}
      </p>
    </article>
  );
}
