"use client";

import {
  useQuery,
} from "@tanstack/react-query";
import {
  ArrowLeft,
  ExternalLink,
  FileJson,
  LoaderCircle,
  Network,
  UserRound,
} from "lucide-react";
import Link from "next/link";

import {
  auditLogsService,
} from "./audit-logs-service";
import type {
  JsonValue,
} from "./audit-log-types";
import {
  formatAuditAction,
  formatAuditDate,
  formatAuditJson,
  getAuditErrorMessage,
  getAuditResourceTarget,
} from "./audit-log-utils";

export function AuditLogDetails({
  auditLogId,
}: {
  auditLogId: string;
}) {
  const auditQuery = useQuery({
    queryKey: [
      "audit-logs",
      "detail",
      auditLogId,
    ],

    queryFn: () =>
      auditLogsService.getById(
        auditLogId,
      ),
  });

  if (auditQuery.isLoading) {
    return (
      <div className="flex min-h-72 items-center justify-center">
        <LoaderCircle className="animate-spin text-blue-700" />
      </div>
    );
  }

  if (
    auditQuery.isError ||
    !auditQuery.data
  ) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        {getAuditErrorMessage(
          auditQuery.error ??
            new Error(
              "Audit log not found.",
            ),
        )}
      </div>
    );
  }

  const audit =
    auditQuery.data;

  const resourceTarget =
    getAuditResourceTarget(
      audit.resourceType,
      audit.resourceId,
    );

  return (
    <div className="space-y-6">
      <header>
        <Link
          href="/dashboard/audit-logs"
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-700"
        >
          <ArrowLeft size={16} />
          Back to Audit Logs
        </Link>

        <h1 className="mt-4 text-2xl font-bold text-slate-950">
          Audit Log Details
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          {formatAuditAction(
            audit.action,
          )}
          {" · "}
          {audit.resourceType}
          {" · "}
          {formatAuditDate(
            audit.createdAt,
          )}
        </p>
      </header>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-slate-950">
              Activity
            </h2>

            <dl className="mt-5 grid gap-5 sm:grid-cols-2">
              <Detail
                label="Action"
                value={formatAuditAction(
                  audit.action,
                )}
              />

              <Detail
                label="Resource type"
                value={
                  audit.resourceType
                }
              />

              <Detail
                label="Resource ID"
                value={
                  audit.resourceId ??
                  "Not available"
                }
              />

              <Detail
                label="Recorded"
                value={formatAuditDate(
                  audit.createdAt,
                )}
              />
            </dl>

            {audit.description && (
              <div className="mt-6 border-t border-slate-100 pt-5">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Description
                </p>

              <p className="mt-2 text-sm leading-6 text-slate-700">
                  {audit.description}
                </p>
              </div>
            )}

            {resourceTarget && (
              <Link
                href={resourceTarget}
                className="mt-6 inline-flex h-10 items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 text-sm font-semibold text-blue-700 hover:bg-blue-100"
              >
                Open Related Record
                <ExternalLink
                  size={16}
                />
              </Link>
            )}
          </article>

          <JsonPanel
            title="Previous Values"
            value={audit.oldValues}
          />

          <JsonPanel
            title="New Values"
            value={audit.newValues}
          />

          <JsonPanel
            title="Metadata"
            value={audit.metadata}
          />
        </div>

        <aside className="space-y-6">
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <UserRound
                size={18}
                className="text-blue-700"
              />

              <h2 className="font-semibold text-slate-950">
                Actor
              </h2>
            </div>

            {audit.actorUser ? (
              <dl className="mt-5 space-y-4">
                <Detail
                  label="Name"
                  value={`${audit.actorUser.firstName} ${audit.actorUser.lastName}`}
                />

                <Detail
                  label="Email"
                  value={
                    audit.actorUser
                      .email
                  }
                />

                <Detail
                  label="Role"
                  value={
                    audit.actorUser
                      .role
                  }
                />

                <Detail
                  label="User ID"
                  value={
                    audit.actorUser.id
                  }
                />
              </dl>
            ) : (
              <p className="mt-4 text-sm text-slate-500">
                This action was
                recorded as a system
                operation.
              </p>
            )}
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <Network
                size={18}
                className="text-blue-700"
              />

              <h2 className="font-semibold text-slate-950">
                Request Information
              </h2>
            </div>

            <dl className="mt-5 space-y-4">
              <Detail
                label="IP address"
                value={
                  audit.ipAddress ??
                  "Not recorded"
                }
              />

              <Detail
                label="User agent"
                value={
                  audit.userAgent ??
                  "Not recorded"
                }
              />
            </dl>
          </article>
        </aside>
      </section>
    </div>
  );
}

function JsonPanel({
  title,
  value,
}: {
  title: string;
  value: JsonValue | undefined;
}) {
  const formatted =
    formatAuditJson(value);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <FileJson
          size={18}
          className="text-blue-700"
        />

        <h2 className="font-semibold text-slate-950">
          {title}
        </h2>
      </div>

      {formatted ? (
        <pre className="mt-5 overflow-x-auto rounded-xl bg-slate-950 p-4 text-xs leading-6 text-slate-100">
          {formatted}
        </pre>
      ) : (
        <p className="mt-4 text-sm text-slate-500">
          No data was recorded.
        </p>
      )}
    </article>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </dt>

      <dd className="mt-1 break-words text-sm font-semibold text-slate-800">
        {value}
      </dd>
    </div>
  );
}
