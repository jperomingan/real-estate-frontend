"use client";

import {
  useQuery,
} from "@tanstack/react-query";
import axios from "axios";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Clock3,
  FileText,
  LoaderCircle,
  Mail,
  MapPin,
  Phone,
  UserRound,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import {
  useParams,
} from "next/navigation";

import {
  viewingsService,
} from "./viewings-service";
import type {
  ViewingAppointment,
  ViewingStatus,
} from "./viewings-types";

interface ApiErrorResponse {
  message?: string;
  error?: {
    message?: string;
  };
}

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

function getFullName(
  firstName: string,
  lastName:
    | string
    | null
    | undefined,
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

  return "Unable to load the viewing appointment.";
}

function InformationRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 shrink-0 text-slate-400">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          {label}
        </p>

        <div className="mt-1 break-words text-sm font-medium text-slate-800">
          {value}
        </div>
      </div>
    </div>
  );
}

function ViewingDetailsContent({
  viewing,
}: {
  viewing: ViewingAppointment;
}) {
  const viewerName =
    getFullName(
      viewing.firstName,
      viewing.lastName,
    );

  const brokerName =
    getFullName(
      viewing.broker.firstName,
      viewing.broker.lastName,
    );

  const clientName =
    viewing.client
      ? getFullName(
          viewing.client.firstName,
          viewing.client.lastName,
        )
      : "No registered client linked";

  const propertyLocation = [
    viewing.property.address,
    viewing.property.barangay,
    viewing.property.city,
    viewing.property.province,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="space-y-6">
      <header>
        <Link
          href="/dashboard/viewings"
          className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-800"
        >
          <ArrowLeft size={16} />
          Back to viewings
        </Link>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-700">
              Viewing appointment
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
              {viewerName}
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Appointment created{" "}
              {formatDate(
                viewing.createdAt,
              )}
            </p>
          </div>

          <span
            className={`inline-flex w-fit rounded-full border px-4 py-2 text-sm font-semibold ${statusClasses[viewing.status]}`}
          >
            {formatLabel(
              viewing.status,
            )}
          </span>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <UserRound
                size={20}
                className="text-emerald-700"
              />

              <h2 className="text-lg font-semibold text-slate-950">
                Viewer Information
              </h2>
            </div>

            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <InformationRow
                icon={
                  <UserRound size={17} />
                }
                label="Viewer"
                value={viewerName}
              />

              <InformationRow
                icon={
                  <Phone size={17} />
                }
                label="Phone"
                value={viewing.phone}
              />

              <InformationRow
                icon={
                  <Mail size={17} />
                }
                label="Email"
                value={
                  viewing.email ??
                  "No email provided"
                }
              />

              <InformationRow
                icon={
                  <UsersRound size={17} />
                }
                label="Registered client"
                value={clientName}
              />
            </div>

            {viewing.message && (
              <div className="mt-6 rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Viewer message
                </p>

                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                  {viewing.message}
                </p>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Building2
                size={20}
                className="text-emerald-700"
              />

              <h2 className="text-lg font-semibold text-slate-950">
                Property
              </h2>
            </div>

            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <InformationRow
                icon={
                  <Building2 size={17} />
                }
                label="Property"
                value={
                  <Link
                    href={`/dashboard/properties/${viewing.property.id}`}
                    className="text-emerald-700 hover:underline"
                  >
                    {viewing.property.title}
                  </Link>
                }
              />

              <InformationRow
                icon={
                  <FileText size={17} />
                }
                label="Listing status"
                value={formatLabel(
                  viewing.property.status,
                )}
              />

              <InformationRow
                icon={
                  <MapPin size={17} />
                }
                label="Location"
                value={propertyLocation}
              />

              <InformationRow
                icon={
                  <Building2 size={17} />
                }
                label="Price"
                value={currencyFormatter.format(
                  Number(
                    viewing.property.price,
                  ),
                )}
              />
            </div>
          </section>

          {viewing.notes && (
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <FileText
                  size={20}
                  className="text-emerald-700"
                />

                <h2 className="text-lg font-semibold text-slate-950">
                  Appointment Notes
                </h2>
              </div>

              <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                {viewing.notes}
              </p>
            </section>
          )}
        </div>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">
              Schedule
            </h2>

            <div className="mt-6 space-y-6">
              <InformationRow
                icon={
                  <CalendarDays
                    size={17}
                  />
                }
                label="Preferred date"
                value={formatDate(
                  viewing.preferredDate,
                )}
              />

              <InformationRow
                icon={
                  <Clock3 size={17} />
                }
                label="Confirmed date"
                value={formatDate(
                  viewing.confirmedDate,
                )}
              />
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">
              Assigned Broker
            </h2>

            <div className="mt-6 space-y-5">
              <InformationRow
                icon={
                  <UserRound size={17} />
                }
                label="Broker"
                value={brokerName}
              />

              <InformationRow
                icon={
                  <Mail size={17} />
                }
                label="Email"
                value={
                  viewing.broker.email
                }
              />

              <InformationRow
                icon={
                  <Phone size={17} />
                }
                label="Phone"
                value={
                  viewing.broker.phone ??
                  "No phone provided"
                }
              />
            </div>
          </section>

          <section className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6">
            <h2 className="font-semibold text-slate-900">
              Appointment Actions
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Confirmation,
              rescheduling, notes, and
              status actions will be
              added in the next step.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}

export function ViewingDetails() {
  const params =
    useParams<{ id: string }>();

  const id = params.id;

  const query = useQuery({
    queryKey: [
      "viewings",
      "detail",
      id,
    ],

    queryFn: () =>
      viewingsService.getViewingById(
        id,
      ),

    enabled: Boolean(id),
  });

  if (query.isPending) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="flex items-center gap-3 text-slate-600">
          <LoaderCircle
            size={22}
            className="animate-spin"
          />

          <span>
            Loading viewing appointment...
          </span>
        </div>
      </div>
    );
  }

  if (
    query.isError ||
    !query.data
  ) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <h1 className="text-xl font-semibold text-red-900">
          Unable to load viewing
        </h1>

        <p className="mt-2 text-sm text-red-700">
          {getErrorMessage(
            query.error,
          )}
        </p>

        <Link
          href="/dashboard/viewings"
          className="mt-5 inline-flex rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white"
        >
          Back to viewings
        </Link>
      </div>
    );
  }

  return (
    <ViewingDetailsContent
      viewing={query.data}
    />
  );
}
