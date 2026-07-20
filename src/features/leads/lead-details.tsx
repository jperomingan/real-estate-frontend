"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import axios from "axios";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  LoaderCircle,
  Mail,
  MapPin,
  Phone,
  Save,
  Trash2,
  UserRound,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import {
  useParams,
  useRouter,
} from "next/navigation";
import { useState } from "react";

import { leadsService } from "./leads-service";
import {
  LEAD_STATUSES,
  type Lead,
  type LeadStatus,
} from "./leads-types";

interface ApiErrorResponse {
  message?: string;
  error?: {
    message?: string;
  };
}

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
      month: "long",
      day: "numeric",
    },
  ).format(date);
}

function formatDateTime(
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
      hour: "numeric",
      minute: "2-digit",
    },
  ).format(date);
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
      error.response.data?.error?.message ??
      `Request failed with status ${error.response.status}.`
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred.";
}

interface DetailItemProps {
  label: string;
  value: string;
  icon: typeof UserRound;
}

function DetailItem({
  label,
  value,
  icon: Icon,
}: DetailItemProps) {
  return (
    <div className="flex gap-3 rounded-xl bg-slate-50 p-4">
      <div className="mt-0.5 text-emerald-700">
        <Icon size={18} />
      </div>

      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-medium text-slate-900">
          {value}
        </p>
      </div>
    </div>
  );
}

function LeadDetailsContent({
  lead,
}: {
  lead: Lead;
}) {
  const router = useRouter();
  const queryClient =
    useQueryClient();

  const [
    selectedStatus,
    setSelectedStatus,
  ] = useState<LeadStatus>(
    lead.status,
  );

  const statusMutation = useMutation({
    mutationFn: (
      status: LeadStatus,
    ) =>
      leadsService.updateLeadStatus(
        lead.id,
        status,
      ),

    onSuccess: async (
      updatedLead,
    ) => {
      queryClient.setQueryData(
        [
          "leads",
          "detail",
          lead.id,
        ],
        updatedLead,
      );

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["leads"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["dashboard"],
        }),
      ]);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () =>
      leadsService.deleteLead(
        lead.id,
      ),

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["leads"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["dashboard"],
        }),
      ]);

      router.replace(
        "/dashboard/leads",
      );
    },
  });

  function handleDelete() {
    const confirmed =
      window.confirm(
        `Delete the lead "${getLeadName(lead)}"? This action cannot be undone.`,
      );

    if (confirmed) {
      deleteMutation.mutate();
    }
  }

  const mutationError =
    statusMutation.error ??
    deleteMutation.error;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <Link
            href="/dashboard/leads"
            className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-800"
          >
            <ArrowLeft size={16} />
            Back to leads
          </Link>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">
            {getLeadName(lead)}
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Lead details and sales
            progress.
          </p>
        </div>

        <button
          type="button"
          onClick={handleDelete}
          disabled={
            deleteMutation.isPending
          }
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
        >
          {deleteMutation.isPending ? (
            <LoaderCircle
              size={17}
              className="animate-spin"
            />
          ) : (
            <Trash2 size={17} />
          )}

          Delete Lead
        </button>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">
              Contact information
            </h2>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <DetailItem
                label="Full name"
                value={getLeadName(lead)}
                icon={UserRound}
              />

              <DetailItem
                label="Phone"
                value={lead.phone}
                icon={Phone}
              />

              <DetailItem
                label="Email"
                value={
                  lead.email ??
                  "Not specified"
                }
                icon={Mail}
              />

              <DetailItem
                label="Source"
                value={formatLabel(
                  lead.source,
                )}
                icon={MapPin}
              />

              <DetailItem
                label="Budget"
                value={formatMoney(
                  lead.budget,
                )}
                icon={Wallet}
              />

              <DetailItem
                label="Preferred date"
                value={formatDate(
                  lead.preferredDate,
                )}
                icon={CalendarDays}
              />
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">
              Inquiry
            </h2>

            <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700">
              {lead.message ??
                "No inquiry message was provided."}
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">
              Property
            </h2>

            {lead.property ? (
              <div className="mt-5 rounded-xl bg-slate-50 p-4">
                <div className="flex items-start gap-3">
                  <Building2
                    size={20}
                    className="mt-0.5 text-emerald-700"
                  />

                  <div>
                    <p className="font-semibold text-slate-900">
                      {
                        lead.property
                          .title
                      }
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
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

                    <p className="mt-2 text-sm font-medium text-slate-700">
                      {formatMoney(
                        lead.property
                          .price,
                      )}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">
                This is a general
                property inquiry.
              </p>
            )}
          </article>
        </div>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">
              Lead status
            </h2>

            <label className="mt-5 block space-y-2">
              <span className="text-sm font-medium text-slate-700">
                Current status
              </span>

              <select
                value={selectedStatus}
                onChange={(event) => {
                  setSelectedStatus(
                    event.target
                      .value as LeadStatus,
                  );
                }}
                disabled={
                  statusMutation.isPending
                }
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              >
                {LEAD_STATUSES.map(
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
            </label>

            <button
              type="button"
              onClick={() => {
                statusMutation.mutate(
                  selectedStatus,
                );
              }}
              disabled={
                statusMutation.isPending ||
                selectedStatus ===
                  lead.status
              }
              className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {statusMutation.isPending ? (
                <LoaderCircle
                  size={17}
                  className="animate-spin"
                />
              ) : (
                <Save size={17} />
              )}

              Save Status
            </button>

            {statusMutation.isSuccess && (
              <p className="mt-3 text-sm font-medium text-emerald-700">
                Status updated
                successfully.
              </p>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">
              Assignment
            </h2>

            <dl className="mt-4 space-y-4">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Broker
                </dt>

                <dd className="mt-1 text-sm font-medium text-slate-900">
                  {getBrokerName(lead)}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Created
                </dt>

                <dd className="mt-1 text-sm text-slate-700">
                  {formatDateTime(
                    lead.createdAt,
                  )}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Last updated
                </dt>

                <dd className="mt-1 text-sm text-slate-700">
                  {formatDateTime(
                    lead.updatedAt,
                  )}
                </dd>
              </div>
            </dl>
          </section>
        </aside>
      </section>

      {mutationError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {getErrorMessage(
            mutationError,
          )}
        </div>
      )}
    </div>
  );
}

export function LeadDetails() {
  const params =
    useParams<{ id: string }>();

  const id = params.id;

  const {
    data,
    error,
    isError,
    isPending,
  } = useQuery({
    queryKey: [
      "leads",
      "detail",
      id,
    ],
    queryFn: () =>
      leadsService.getLeadById(id),
  });

  if (isPending) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="flex items-center gap-3 text-slate-600">
          <LoaderCircle
            size={22}
            className="animate-spin"
          />

          <span>
            Loading lead details...
          </span>
        </div>
      </div>
    );
  }

  if (
    isError ||
    !data
  ) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <h1 className="text-xl font-semibold text-red-900">
          Unable to load lead
        </h1>

        <p className="mt-2 text-sm text-red-700">
          {getErrorMessage(error)}
        </p>

        <Link
          href="/dashboard/leads"
          className="mt-5 inline-flex rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white"
        >
          Back to leads
        </Link>
      </div>
    );
  }

  return (
    <LeadDetailsContent
      key={`${data.id}-${data.status}`}
      lead={data}
    />
  );
}
