"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import axios from "axios";
import {
  ArrowLeft,
  Bath,
  BedDouble,
  Building2,
  CalendarDays,
  Expand,
  LoaderCircle,
  Mail,
  MapPin,
  PhilippinePeso,
  Phone,
  Ruler,
  Trash2,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import {
  useParams,
  useRouter,
} from "next/navigation";

import { getApiAssetUrl } from "@/lib/api-asset-url";
import { PropertyImageManager } from "./property-image-manager";
import { propertiesService } from "./properties-service";
import type {
  Property,
  PropertyImage,
} from "./properties-types";

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

  const amount = Number(value);

  if (Number.isNaN(amount)) {
    return "Not specified";
  }

  return `${amount.toLocaleString()} sqm`;
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
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    },
  ).format(date);
}

function getBrokerName(
  property: Property,
): string {
  if (!property.broker) {
    return "Not assigned";
  }

  return [
    property.broker.firstName,
    property.broker.lastName,
  ]
    .filter(Boolean)
    .join(" ");
}

function getPropertyImages(
  property: Property,
): PropertyImage[] {
  if (
    property.images &&
    property.images.length > 0
  ) {
    return [...property.images].sort(
      (first, second) =>
        first.sortOrder -
        second.sortOrder,
    );
  }

  return (property.imageUrls ?? []).map(
    (url, index) => ({
      id: `${property.id}-${index}`,
      url,
      altText: `Property image ${index + 1}`,
      sortOrder: index,
      propertyId: property.id,
      createdAt: property.createdAt,
      updatedAt: property.updatedAt,
    }),
  );
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
  icon: typeof Building2;
}

function DetailItem({
  label,
  value,
  icon: Icon,
}: DetailItemProps) {
  return (
    <div className="flex gap-3 rounded-xl bg-slate-50 p-4">
      <Icon
        size={18}
        className="mt-0.5 shrink-0 text-emerald-700"
      />

      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-medium text-slate-900">
          {value}
        </p>
      </div>
    </div>
  );
}

function PropertyDetailsContent({
  property,
}: {
  property: Property;
}) {
  const router = useRouter();
  const queryClient =
    useQueryClient();

  const images =
    getPropertyImages(property);

  const deleteMutation = useMutation({
    mutationFn: () =>
      propertiesService.deleteProperty(
        property.id,
      ),

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["properties"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["dashboard"],
        }),
      ]);

      router.replace(
        "/dashboard/properties",
      );
    },
  });

  function handleDelete() {
    const confirmed =
      window.confirm(
        `Delete "${property.title}"? This action cannot be undone.`,
      );

    if (confirmed) {
      deleteMutation.mutate();
    }
  }

  const completeAddress = [
    property.address,
    property.barangay,
    property.city,
    property.province,
    property.zipCode,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <Link
            href="/dashboard/properties"
            className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-800"
          >
            <ArrowLeft size={16} />
            Back to properties
          </Link>

          <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-emerald-700">
            {formatLabel(
              property.type,
            )}
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
            {property.title}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              {formatLabel(
                property.status,
              )}
            </span>

            <span className="text-sm text-slate-500">
              Property ID:{" "}
              {property.id}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href={`/dashboard/properties/${property.id}/edit`}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-emerald-700 px-5 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            Edit Property
          </Link>

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

            Delete Property
          </button>
        </div>
      </header>

      {images.length > 0 ? (
        <section className="grid gap-4 md:grid-cols-2">
          {images.map(
            (image, index) => (
              <div
                key={image.id}
                role="img"
                aria-label={`${property.title} image ${index + 1}`}
                className="min-h-64 rounded-2xl border border-slate-200 bg-slate-100 bg-cover bg-center shadow-sm"
                style={{
                  backgroundImage:
                    `url("${getApiAssetUrl(image.url)}")`,
                }}
              />
            ),
          )}
        </section>
      ) : (
        <div className="flex min-h-72 items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 text-slate-400">
          <div className="text-center">
            <Building2
              size={48}
              className="mx-auto"
            />

            <p className="mt-3 text-sm">
              No property images
            </p>
          </div>
        </div>
      )}

      <PropertyImageManager
        propertyId={property.id}
        images={property.images ?? []}
      />

      <section className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <PhilippinePeso
                size={23}
                className="text-emerald-700"
              />

              <div>
                <p className="text-sm text-slate-500">
                  Selling price
                </p>

                <p className="text-3xl font-bold text-slate-950">
                  {formatMoney(
                    property.price,
                  )}
                </p>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">
              Property details
            </h2>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <DetailItem
                label="Bedrooms"
                value={String(
                  property.bedrooms ??
                  0,
                )}
                icon={BedDouble}
              />

              <DetailItem
                label="Bathrooms"
                value={String(
                  property.bathrooms ??
                  0,
                )}
                icon={Bath}
              />

              <DetailItem
                label="Lot area"
                value={formatArea(
                  property.lotAreaSqm,
                )}
                icon={Ruler}
              />

              <DetailItem
                label="Floor area"
                value={formatArea(
                  property.floorAreaSqm,
                )}
                icon={Expand}
              />
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">
              Description
            </h2>

            <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700">
              {property.description ??
                "No property description was provided."}
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">
              Location
            </h2>

            <div className="mt-5">
              <DetailItem
                label="Complete address"
                value={completeAddress}
                icon={MapPin}
              />
            </div>

            {property.latitude !== null &&
              property.longitude !== null && (
                <p className="mt-4 text-sm text-slate-500">
                  Coordinates:{" "}
                  {property.latitude},{" "}
                  {property.longitude}
                </p>
              )}
          </article>
        </div>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">
              Broker
            </h2>

            <div className="mt-5 space-y-4">
              <DetailItem
                label="Name"
                value={getBrokerName(
                  property,
                )}
                icon={UserRound}
              />

              <DetailItem
                label="Email"
                value={
                  property.broker
                    ?.email ??
                  "Not available"
                }
                icon={Mail}
              />

              <DetailItem
                label="Phone"
                value={
                  property.broker
                    ?.phone ??
                  "Not available"
                }
                icon={Phone}
              />
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">
              Record information
            </h2>

            <div className="mt-5 space-y-4">
              <DetailItem
                label="Created"
                value={formatDate(
                  property.createdAt,
                )}
                icon={CalendarDays}
              />

              <DetailItem
                label="Last updated"
                value={formatDate(
                  property.updatedAt,
                )}
                icon={CalendarDays}
              />
            </div>
          </section>
        </aside>
      </section>

      {deleteMutation.isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {getErrorMessage(
            deleteMutation.error,
          )}
        </div>
      )}
    </div>
  );
}

export function PropertyDetails() {
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
      "properties",
      "detail",
      id,
    ],

    queryFn: () =>
      propertiesService.getPropertyById(
        id,
      ),

    enabled: Boolean(id),
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
            Loading property...
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
          Unable to load property
        </h1>

        <p className="mt-2 text-sm text-red-700">
          {getErrorMessage(error)}
        </p>

        <Link
          href="/dashboard/properties"
          className="mt-5 inline-flex rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white"
        >
          Back to properties
        </Link>
      </div>
    );
  }

  return (
    <PropertyDetailsContent
      property={data}
    />
  );
}
