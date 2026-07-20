"use client";

import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import axios from "axios";
import {
  ArrowLeft,
  LoaderCircle,
  Save,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type FormEvent,
  useState,
} from "react";

import { propertiesService } from "./properties-service";
import {
  PROPERTY_STATUSES,
  PROPERTY_TYPES,
  type CreatePropertyInput,
  type PropertyStatus,
  type PropertyType,
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

  imageUrls: string;
}

interface ApiErrorResponse {
  message?: string;
  errors?: Record<
    string,
    string[] | undefined
  >;
}

const initialValues: PropertyFormValues = {
  title: "",
  description: "",
  type: "HOUSE_AND_LOT",
  status: "PUBLISHED",

  price: "",
  lotAreaSqm: "",
  floorAreaSqm: "",
  bedrooms: "",
  bathrooms: "",

  address: "",
  barangay: "",
  city: "",
  province: "",
  zipCode: "",

  latitude: "",
  longitude: "",

  imageUrls: "",
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

function optionalNumber(
  value: string,
): number | undefined {
  const normalized = value.trim();

  if (!normalized) {
    return undefined;
  }

  const number = Number(normalized);

  if (!Number.isFinite(number)) {
    return undefined;
  }

  return number;
}

function parseImageUrls(
  value: string,
): string[] {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function validateImageUrls(
  urls: string[],
): string | null {
  for (const url of urls) {
    try {
      const parsed = new URL(url);

      if (
        parsed.protocol !== "http:" &&
        parsed.protocol !== "https:"
      ) {
        return `Invalid image URL: ${url}`;
      }
    } catch {
      return `Invalid image URL: ${url}`;
    }
  }

  return null;
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
      .flatMap((items) => items ?? [])
      .find(Boolean);

    return (
      fieldError ??
      error.response.data?.message ??
      `Request failed with status ${error.response.status}.`
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to create the property.";
}

export function CreatePropertyForm() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [values, setValues] =
    useState<PropertyFormValues>(
      initialValues,
    );

  const [
    validationError,
    setValidationError,
  ] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (
      input: CreatePropertyInput,
    ) =>
      propertiesService.createProperty(
        input,
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

      router.push(
        "/dashboard/properties",
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

    const title = values.title.trim();
    const address = values.address.trim();
    const city = values.city.trim();
    const province =
      values.province.trim();

    const price = Number(values.price);

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
      optionalNumber(values.lotAreaSqm);

    const floorAreaSqm =
      optionalNumber(
        values.floorAreaSqm,
      );

    const bedrooms =
      optionalNumber(values.bedrooms);

    const bathrooms =
      optionalNumber(values.bathrooms);

    const latitude =
      optionalNumber(values.latitude);

    const longitude =
      optionalNumber(values.longitude);

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
      (!Number.isInteger(bathrooms) ||
        bathrooms < 0)
    ) {
      setValidationError(
        "Bathrooms must be a whole number of zero or more.",
      );
      return;
    }

    const imageUrls = parseImageUrls(
      values.imageUrls,
    );

    const imageError =
      validateImageUrls(imageUrls);

    if (imageError) {
      setValidationError(imageError);
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

      ...(values.description.trim()
        ? {
            description:
              values.description.trim(),
          }
        : {}),

      ...(values.barangay.trim()
        ? {
            barangay:
              values.barangay.trim(),
          }
        : {}),

      ...(values.zipCode.trim()
        ? {
            zipCode:
              values.zipCode.trim(),
          }
        : {}),

      ...(lotAreaSqm !== undefined
        ? { lotAreaSqm }
        : {}),

      ...(floorAreaSqm !== undefined
        ? { floorAreaSqm }
        : {}),

      ...(bedrooms !== undefined
        ? { bedrooms }
        : {}),

      ...(bathrooms !== undefined
        ? { bathrooms }
        : {}),

      ...(latitude !== undefined
        ? { latitude }
        : {}),

      ...(longitude !== undefined
        ? { longitude }
        : {}),

      ...(imageUrls.length > 0
        ? { imageUrls }
        : {}),
    });
  }

  const inputClass =
    "h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <Link
          href="/dashboard/properties"
          className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-800"
        >
          <ArrowLeft size={16} />
          Back to properties
        </Link>

        <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">
          Add Property
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Create a new real estate
          listing and assign its
          availability status.
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
                disabled={mutation.isPending}
                className={inputClass}
                placeholder="Three-Bedroom House and Lot in Cebu City"
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
                disabled={mutation.isPending}
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
                disabled={mutation.isPending}
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
                disabled={mutation.isPending}
                className={inputClass}
                placeholder="3500000"
              />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-slate-700">
                Description
              </span>

              <textarea
                rows={5}
                value={values.description}
                onChange={(event) => {
                  updateField(
                    "description",
                    event.target.value,
                  );
                }}
                disabled={mutation.isPending}
                className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                placeholder="Describe the property, nearby establishments, amenities, and selling points."
              />
            </label>
          </div>
        </section>

        <section className="border-t border-slate-200 pt-7">
          <h2 className="text-lg font-semibold text-slate-950">
            Property specifications
          </h2>

          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                key: "lotAreaSqm",
                label: "Lot area (sqm)",
                placeholder: "120",
              },
              {
                key: "floorAreaSqm",
                label: "Floor area (sqm)",
                placeholder: "90",
              },
              {
                key: "bedrooms",
                label: "Bedrooms",
                placeholder: "3",
              },
              {
                key: "bathrooms",
                label: "Bathrooms",
                placeholder: "2",
              },
            ].map((field) => (
              <label
                key={field.key}
                className="space-y-2"
              >
                <span className="text-sm font-medium text-slate-700">
                  {field.label}
                </span>

                <input
                  type="number"
                  min="0"
                  step={
                    field.key ===
                      "bedrooms" ||
                    field.key ===
                      "bathrooms"
                      ? "1"
                      : "0.01"
                  }
                  value={
                    values[
                      field.key as
                        | "lotAreaSqm"
                        | "floorAreaSqm"
                        | "bedrooms"
                        | "bathrooms"
                    ]
                  }
                  onChange={(event) => {
                    updateField(
                      field.key as
                        | "lotAreaSqm"
                        | "floorAreaSqm"
                        | "bedrooms"
                        | "bathrooms",
                      event.target.value,
                    );
                  }}
                  disabled={
                    mutation.isPending
                  }
                  className={inputClass}
                  placeholder={
                    field.placeholder
                  }
                />
              </label>
            ))}
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
                disabled={mutation.isPending}
                className={inputClass}
                placeholder="123 Sample Street"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">
                Barangay
              </span>

              <input
                type="text"
                value={values.barangay}
                onChange={(event) => {
                  updateField(
                    "barangay",
                    event.target.value,
                  );
                }}
                disabled={mutation.isPending}
                className={inputClass}
                placeholder="Lahug"
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
                disabled={mutation.isPending}
                className={inputClass}
                placeholder="Cebu City"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">
                Province *
              </span>

              <input
                type="text"
                value={values.province}
                onChange={(event) => {
                  updateField(
                    "province",
                    event.target.value,
                  );
                }}
                disabled={mutation.isPending}
                className={inputClass}
                placeholder="Cebu"
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
                disabled={mutation.isPending}
                className={inputClass}
                placeholder="6000"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">
                Latitude
              </span>

              <input
                type="number"
                step="any"
                value={values.latitude}
                onChange={(event) => {
                  updateField(
                    "latitude",
                    event.target.value,
                  );
                }}
                disabled={mutation.isPending}
                className={inputClass}
                placeholder="10.3157"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">
                Longitude
              </span>

              <input
                type="number"
                step="any"
                value={values.longitude}
                onChange={(event) => {
                  updateField(
                    "longitude",
                    event.target.value,
                  );
                }}
                disabled={mutation.isPending}
                className={inputClass}
                placeholder="123.8854"
              />
            </label>
          </div>
        </section>

        <section className="border-t border-slate-200 pt-7">
          <h2 className="text-lg font-semibold text-slate-950">
            Property images
          </h2>

          <label className="mt-5 block space-y-2">
            <span className="text-sm font-medium text-slate-700">
              Image URLs
            </span>

            <textarea
              rows={4}
              value={values.imageUrls}
              onChange={(event) => {
                updateField(
                  "imageUrls",
                  event.target.value,
                );
              }}
              disabled={mutation.isPending}
              className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              placeholder={`https://example.com/front-view.jpg
https://example.com/living-room.jpg`}
            />

            <p className="text-xs text-slate-500">
              Enter one image URL per
              line. Direct file upload
              will be added later.
            </p>
          </label>
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
            href="/dashboard/properties"
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
              : "Save Property"}
          </button>
        </div>
      </form>
    </div>
  );
}
