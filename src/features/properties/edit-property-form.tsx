"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import axios from "axios";
import {
  ArrowLeft,
  LoaderCircle,
  Save,
} from "lucide-react";
import Link from "next/link";
import {
  useParams,
  useRouter,
} from "next/navigation";
import {
  type FormEvent,
  useEffect,
  useState,
} from "react";

import { propertiesService } from "./properties-service";
import {
  PROPERTY_STATUSES,
  PROPERTY_TYPES,
  type Property,
  type PropertyStatus,
  type PropertyType,
  type UpdatePropertyInput,
} from "./properties-types";

interface PropertyFormValues {
  title: string;
  description: string;
  type: PropertyType;
  status: PropertyStatus;

  price: string;
  lotAreaSqm: string;
  floorAreaSqm: string;
  bedrooms: string;
  bathrooms: string;

  address: string;
  barangay: string;
  city: string;
  province: string;
  zipCode: string;

  latitude: string;
  longitude: string;
}

interface ApiErrorResponse {
  message?: string;
  error?: {
    message?: string;
  };
  errors?: Record<
    string,
    string[] | undefined
  >;
}

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

function toInputValue(
  value:
    | number
    | string
    | null
    | undefined,
): string {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value);
}

function propertyToFormValues(
  property: Property,
): PropertyFormValues {
  return {
    title: property.title,
    description:
      property.description ?? "",
    type: property.type,
    status: property.status,

    price: toInputValue(
      property.price,
    ),

    lotAreaSqm: toInputValue(
      property.lotAreaSqm,
    ),

    floorAreaSqm: toInputValue(
      property.floorAreaSqm,
    ),

    bedrooms: toInputValue(
      property.bedrooms,
    ),

    bathrooms: toInputValue(
      property.bathrooms,
    ),

    address: property.address,
    barangay:
      property.barangay ?? "",
    city: property.city,
    province: property.province,
    zipCode:
      property.zipCode ?? "",

    latitude: toInputValue(
      property.latitude,
    ),

    longitude: toInputValue(
      property.longitude,
    ),
  };
}

function optionalNumber(
  value: string,
): number | undefined {
  const normalized = value.trim();

  if (!normalized) {
    return undefined;
  }

  const number = Number(normalized);

  return Number.isFinite(number)
    ? number
    : undefined;
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

    const fieldError = Object.values(
      error.response.data?.errors ?? {},
    )
      .flatMap(
        (messages) =>
          messages ?? [],
      )
      .find(Boolean);

    return (
      fieldError ??
      error.response.data?.message ??
      error.response.data?.error
        ?.message ??
      `Request failed with status ${error.response.status}.`
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to update the property.";
}

function EditPropertyContent({
  property,
}: {
  property: Property;
}) {
  const router = useRouter();
  const queryClient =
    useQueryClient();

  const [values, setValues] =
    useState<PropertyFormValues>(() =>
      propertyToFormValues(property),
    );

  const [
    validationError,
    setValidationError,
  ] = useState<string | null>(null);

  useEffect(() => {
    setValues(
      propertyToFormValues(property),
    );
  }, [property]);

  const mutation = useMutation({
    mutationFn: (
      input: UpdatePropertyInput,
    ) =>
      propertiesService.updateProperty(
        property.id,
        input,
      ),

    onSuccess: async (
      updatedProperty,
    ) => {
      queryClient.setQueryData(
        [
          "properties",
          "detail",
          property.id,
        ],
        updatedProperty,
      );

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["properties"],
        }),

        queryClient.invalidateQueries({
          queryKey: ["dashboard"],
        }),
      ]);

      router.push(
        `/dashboard/properties/${property.id}`,
      );

      router.refresh();
    },
  });

  function updateField<
    Key extends keyof PropertyFormValues,
  >(
    key: Key,
    value: PropertyFormValues[Key],
  ) {
    setValues((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setValidationError(null);

    const title =
      values.title.trim();

    const address =
      values.address.trim();

    const city =
      values.city.trim();

    const province =
      values.province.trim();

    const price =
      Number(values.price);

    if (title.length < 3) {
      setValidationError(
        "Title must contain at least three characters.",
      );
      return;
    }

    if (
      !Number.isFinite(price) ||
      price <= 0
    ) {
      setValidationError(
        "Price must be greater than zero.",
      );
      return;
    }

    if (address.length < 3) {
      setValidationError(
        "Address must contain at least three characters.",
      );
      return;
    }

    if (city.length < 2) {
      setValidationError(
        "City must contain at least two characters.",
      );
      return;
    }

    if (province.length < 2) {
      setValidationError(
        "Province must contain at least two characters.",
      );
      return;
    }

    const lotAreaSqm =
      optionalNumber(
        values.lotAreaSqm,
      );

    const floorAreaSqm =
      optionalNumber(
        values.floorAreaSqm,
      );

    const bedrooms =
      optionalNumber(
        values.bedrooms,
      );

    const bathrooms =
      optionalNumber(
        values.bathrooms,
      );

    const latitude =
      optionalNumber(
        values.latitude,
      );

    const longitude =
      optionalNumber(
        values.longitude,
      );

    if (
      lotAreaSqm !== undefined &&
      lotAreaSqm <= 0
    ) {
      setValidationError(
        "Lot area must be greater than zero.",
      );
      return;
    }

    if (
      floorAreaSqm !== undefined &&
      floorAreaSqm <= 0
    ) {
      setValidationError(
        "Floor area must be greater than zero.",
      );
      return;
    }

    if (
      bedrooms !== undefined &&
      (!Number.isInteger(bedrooms) ||
        bedrooms < 0)
    ) {
      setValidationError(
        "Bedrooms must be a whole number of zero or more.",
      );
      return;
    }

    if (
      bathrooms !== undefined &&
      (!Number.isInteger(
        bathrooms,
      ) ||
        bathrooms < 0)
    ) {
      setValidationError(
        "Bathrooms must be a whole number of zero or more.",
      );
      return;
    }

    mutation.mutate({
      title,
      type: values.type,
      status: values.status,
      price,
      address,
      city,
      province,

      description:
        values.description.trim() ||
        undefined,

      barangay:
        values.barangay.trim() ||
        undefined,

      zipCode:
        values.zipCode.trim() ||
        undefined,

      lotAreaSqm,
      floorAreaSqm,
      bedrooms,
      bathrooms,
      latitude,
      longitude,
    });
  }

  const inputClass =
    "h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100";

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <Link
          href={`/dashboard/properties/${property.id}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-800"
        >
          <ArrowLeft size={16} />
          Back to property
        </Link>

        <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">
          Edit Property
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Update listing information,
          price, status, dimensions,
          and location.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="space-y-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <section>
          <h2 className="text-lg font-semibold text-slate-950">
            Basic information
          </h2>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-slate-700">
                Property title *
              </span>

              <input
                type="text"
                value={values.title}
                onChange={(event) => {
                  updateField(
                    "title",
                    event.target.value,
                  );
                }}
                disabled={
                  mutation.isPending
                }
                className={inputClass}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">
                Property type *
              </span>

              <select
                value={values.type}
                onChange={(event) => {
                  updateField(
                    "type",
                    event.target
                      .value as PropertyType,
                  );
                }}
                disabled={
                  mutation.isPending
                }
                className={inputClass}
              >
                {PROPERTY_TYPES.map(
                  (type) => (
                    <option
                      key={type}
                      value={type}
                    >
                      {formatLabel(type)}
                    </option>
                  ),
                )}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">
                Status *
              </span>

              <select
                value={values.status}
                onChange={(event) => {
                  updateField(
                    "status",
                    event.target
                      .value as PropertyStatus,
                  );
                }}
                disabled={
                  mutation.isPending
                }
                className={inputClass}
              >
                {PROPERTY_STATUSES.map(
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

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">
                Price *
              </span>

              <input
                type="number"
                min="1"
                step="0.01"
                value={values.price}
                onChange={(event) => {
                  updateField(
                    "price",
                    event.target.value,
                  );
                }}
                disabled={
                  mutation.isPending
                }
                className={inputClass}
              />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-slate-700">
                Description
              </span>

              <textarea
                rows={5}
                value={
                  values.description
                }
                onChange={(event) => {
                  updateField(
                    "description",
                    event.target.value,
                  );
                }}
                disabled={
                  mutation.isPending
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100"
              />
            </label>
          </div>
        </section>

        <section className="border-t border-slate-200 pt-7">
          <h2 className="text-lg font-semibold text-slate-950">
            Property specifications
          </h2>

          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">
                Lot area (sqm)
              </span>

              <input
                type="number"
                min="0"
                step="0.01"
                value={
                  values.lotAreaSqm
                }
                onChange={(event) => {
                  updateField(
                    "lotAreaSqm",
                    event.target.value,
                  );
                }}
                disabled={
                  mutation.isPending
                }
                className={inputClass}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">
                Floor area (sqm)
              </span>

              <input
                type="number"
                min="0"
                step="0.01"
                value={
                  values.floorAreaSqm
                }
                onChange={(event) => {
                  updateField(
                    "floorAreaSqm",
                    event.target.value,
                  );
                }}
                disabled={
                  mutation.isPending
                }
                className={inputClass}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">
                Bedrooms
              </span>

              <input
                type="number"
                min="0"
                step="1"
                value={values.bedrooms}
                onChange={(event) => {
                  updateField(
                    "bedrooms",
                    event.target.value,
                  );
                }}
                disabled={
                  mutation.isPending
                }
                className={inputClass}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">
                Bathrooms
              </span>

              <input
                type="number"
                min="0"
                step="1"
                value={
                  values.bathrooms
                }
                onChange={(event) => {
                  updateField(
                    "bathrooms",
                    event.target.value,
                  );
                }}
                disabled={
                  mutation.isPending
                }
                className={inputClass}
              />
            </label>
          </div>
        </section>

        <section className="border-t border-slate-200 pt-7">
          <h2 className="text-lg font-semibold text-slate-950">
            Location
          </h2>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-slate-700">
                Complete address *
              </span>

              <input
                type="text"
                value={values.address}
                onChange={(event) => {
                  updateField(
                    "address",
                    event.target.value,
                  );
                }}
                disabled={
                  mutation.isPending
                }
                className={inputClass}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">
                Barangay
              </span>

              <input
                type="text"
                value={
                  values.barangay
                }
                onChange={(event) => {
                  updateField(
                    "barangay",
                    event.target.value,
                  );
                }}
                disabled={
                  mutation.isPending
                }
                className={inputClass}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">
                City *
              </span>

              <input
                type="text"
                value={values.city}
                onChange={(event) => {
                  updateField(
                    "city",
                    event.target.value,
                  );
                }}
                disabled={
                  mutation.isPending
                }
                className={inputClass}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">
                Province *
              </span>

              <input
                type="text"
                value={
                  values.province
                }
                onChange={(event) => {
                  updateField(
                    "province",
                    event.target.value,
                  );
                }}
                disabled={
                  mutation.isPending
                }
                className={inputClass}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">
                ZIP code
              </span>

              <input
                type="text"
                value={values.zipCode}
                onChange={(event) => {
                  updateField(
                    "zipCode",
                    event.target.value,
                  );
                }}
                disabled={
                  mutation.isPending
                }
                className={inputClass}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">
                Latitude
              </span>

              <input
                type="number"
                step="any"
                value={
                  values.latitude
                }
                onChange={(event) => {
                  updateField(
                    "latitude",
                    event.target.value,
                  );
                }}
                disabled={
                  mutation.isPending
                }
                className={inputClass}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">
                Longitude
              </span>

              <input
                type="number"
                step="any"
                value={
                  values.longitude
                }
                onChange={(event) => {
                  updateField(
                    "longitude",
                    event.target.value,
                  );
                }}
                disabled={
                  mutation.isPending
                }
                className={inputClass}
              />
            </label>
          </div>
        </section>

        {validationError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {validationError}
          </div>
        )}

        {mutation.isError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {getErrorMessage(
              mutation.error,
            )}
          </div>
        )}

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
          <Link
            href={`/dashboard/properties/${property.id}`}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {mutation.isPending ? (
              <LoaderCircle
                size={17}
                className="animate-spin"
              />
            ) : (
              <Save size={17} />
            )}

            {mutation.isPending
              ? "Saving..."
              : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

export function EditPropertyForm() {
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
    <EditPropertyContent
      key={data.id}
      property={data}
    />
  );
}
