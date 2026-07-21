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
  CalendarPlus,
  LoaderCircle,
} from "lucide-react";
import Link from "next/link";
import {
  useRouter,
} from "next/navigation";
import {
  type FormEvent,
  useState,
} from "react";

import {
  propertiesService,
} from "@/features/properties/properties-service";
import type {
  CreateViewingInput,
} from "@/features/viewings/viewings-types";

import {
  viewingsService,
} from "./viewings-service";

interface FormValues {
  propertyId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  preferredDate: string;
  message: string;
}

interface ApiErrorResponse {
  message?: string;
  error?: {
    message?: string;
  };
  details?: Record<
    string,
    string[] | undefined
  >;
}

const EMPTY_VALUES: FormValues = {
  propertyId: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  preferredDate: "",
  message: "",
};

const currencyFormatter =
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  });

function toDateTimeLocal(
  date: Date,
): string {
  const timezoneOffset =
    date.getTimezoneOffset() *
    60_000;

  return new Date(
    date.getTime() -
      timezoneOffset,
  )
    .toISOString()
    .slice(0, 16);
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

    const fieldError =
      Object.values(
        error.response.data
          ?.details ?? {},
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

  return "Unable to create the viewing appointment.";
}

export function CreateViewingForm() {
  const router = useRouter();

  const queryClient =
    useQueryClient();

  const [values, setValues] =
    useState<FormValues>(
      EMPTY_VALUES,
    );

  const [
    validationError,
    setValidationError,
  ] =
    useState<string | null>(
      null,
    );

  const [minimumDate] =
    useState(() =>
      toDateTimeLocal(
        new Date(
          Date.now() +
            5 * 60_000,
        ),
      ),
    );

  const propertiesQuery =
    useQuery({
      queryKey: [
        "properties",
        "published",
        "viewing-form",
      ],

      queryFn: () =>
        propertiesService.getProperties({
          status: "PUBLISHED",
          page: 1,
          limit: 100,
          sortBy: "title",
          sortOrder: "asc",
        }),

      staleTime: 60_000,
    });

  const mutation = useMutation({
    mutationFn: (
      input: CreateViewingInput,
    ) =>
      viewingsService.createViewing(
        input,
      ),

    onSuccess: async (
      viewing,
    ) => {
      queryClient.setQueryData(
        [
          "viewings",
          "detail",
          viewing.id,
        ],
        viewing,
      );

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["viewings"],
        }),

        queryClient.invalidateQueries({
          queryKey: ["dashboard"],
        }),
      ]);

      router.push(
        `/dashboard/viewings/${viewing.id}`,
      );

      router.refresh();
    },
  });

  function updateField<
    Key extends keyof FormValues,
  >(
    key: Key,
    value: FormValues[Key],
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

    const propertyId =
      values.propertyId.trim();

    const firstName =
      values.firstName.trim();

    const lastName =
      values.lastName.trim();

    const email =
      values.email.trim();

    const phone =
      values.phone.trim();

    const message =
      values.message.trim();

    if (!propertyId) {
      setValidationError(
        "Select a published property.",
      );
      return;
    }

    if (!firstName) {
      setValidationError(
        "First name is required.",
      );
      return;
    }

    if (!lastName) {
      setValidationError(
        "Last name is required.",
      );
      return;
    }

    if (!email) {
      setValidationError(
        "Email is required.",
      );
      return;
    }

    if (phone.length < 7) {
      setValidationError(
        "Phone number must contain at least seven characters.",
      );
      return;
    }

    const preferredDate =
      new Date(
        values.preferredDate,
      );

    if (
      !values.preferredDate ||
      Number.isNaN(
        preferredDate.getTime(),
      )
    ) {
      setValidationError(
        "Select a valid preferred date and time.",
      );
      return;
    }

    if (
      preferredDate.getTime() <=
      Date.now()
    ) {
      setValidationError(
        "Preferred date must be in the future.",
      );
      return;
    }

    mutation.mutate({
      propertyId,
      firstName,
      lastName,
      email,
      phone,
      preferredDate:
        preferredDate.toISOString(),

      ...(message
        ? { message }
        : {}),
    });
  }

  const properties =
    propertiesQuery.data
      ?.items ?? [];

  const inputClass =
    "h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-100";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <Link
          href="/dashboard/viewings"
          className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-800"
        >
          <ArrowLeft size={16} />
          Back to viewings
        </Link>

        <div className="mt-4 flex items-center gap-3">
          <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700">
            <CalendarPlus size={24} />
          </div>

          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">
              New Viewing Appointment
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Record a viewing request
              for a published property.
            </p>
          </div>
        </div>
      </header>

      <form
        onSubmit={handleSubmit}
        className="space-y-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <section>
          <div className="flex items-center gap-2">
            <Building2
              size={19}
              className="text-emerald-700"
            />

            <h2 className="text-lg font-semibold text-slate-950">
              Property and Schedule
            </h2>
          </div>

          {propertiesQuery.isPending ? (
            <div className="mt-5 flex h-24 items-center justify-center rounded-xl bg-slate-50">
              <LoaderCircle
                size={21}
                className="animate-spin text-emerald-700"
              />

              <span className="ml-3 text-sm text-slate-600">
                Loading published
                properties...
              </span>
            </div>
          ) : propertiesQuery.isError ? (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {getErrorMessage(
                propertiesQuery.error,
              )}
            </div>
          ) : properties.length === 0 ? (
            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm text-amber-800">
                There are no published
                properties available for
                viewing.
              </p>

              <Link
                href="/dashboard/properties"
                className="mt-3 inline-flex text-sm font-semibold text-amber-900 underline"
              >
                Go to Properties
              </Link>
            </div>
          ) : (
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-slate-700">
                  Published property *
                </span>

                <select
                  value={
                    values.propertyId
                  }
                  onChange={(event) => {
                    updateField(
                      "propertyId",
                      event.target.value,
                    );
                  }}
                  disabled={
                    mutation.isPending
                  }
                  className={inputClass}
                >
                  <option value="">
                    Select a property
                  </option>

                  {properties.map(
                    (property) => (
                      <option
                        key={property.id}
                        value={property.id}
                      >
                        {property.title}
                        {" — "}
                        {property.city}
                        {", "}
                        {property.province}
                        {" — "}
                        {currencyFormatter.format(
                          Number(
                            property.price,
                          ),
                        )}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-slate-700">
                  Preferred date and
                  time *
                </span>

                <input
                  type="datetime-local"
                  min={minimumDate}
                  value={
                    values.preferredDate
                  }
                  onChange={(event) => {
                    updateField(
                      "preferredDate",
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
          )}
        </section>

        <section className="border-t border-slate-200 pt-7">
          <h2 className="text-lg font-semibold text-slate-950">
            Viewer Information
          </h2>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">
                First name *
              </span>

              <input
                type="text"
                maxLength={100}
                value={
                  values.firstName
                }
                onChange={(event) => {
                  updateField(
                    "firstName",
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
                Last name *
              </span>

              <input
                type="text"
                maxLength={100}
                value={
                  values.lastName
                }
                onChange={(event) => {
                  updateField(
                    "lastName",
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
                Email *
              </span>

              <input
                type="email"
                maxLength={255}
                value={values.email}
                onChange={(event) => {
                  updateField(
                    "email",
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
                Phone *
              </span>

              <input
                type="tel"
                maxLength={30}
                value={values.phone}
                onChange={(event) => {
                  updateField(
                    "phone",
                    event.target.value,
                  );
                }}
                disabled={
                  mutation.isPending
                }
                placeholder="+63 9XX XXX XXXX"
                className={inputClass}
              />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-slate-700">
                Message
              </span>

              <textarea
                rows={5}
                maxLength={2000}
                value={values.message}
                onChange={(event) => {
                  updateField(
                    "message",
                    event.target.value,
                  );
                }}
                disabled={
                  mutation.isPending
                }
                placeholder="Add the viewer's questions, preferred arrangements, or other details."
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100"
              />

              <p className="text-right text-xs text-slate-400">
                {values.message.length}
                /2000
              </p>
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
            href="/dashboard/viewings"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={
              mutation.isPending ||
              propertiesQuery.isPending ||
              properties.length === 0
            }
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {mutation.isPending ? (
              <LoaderCircle
                size={17}
                className="animate-spin"
              />
            ) : (
              <CalendarPlus
                size={17}
              />
            )}

            {mutation.isPending
              ? "Creating..."
              : "Create Appointment"}
          </button>
        </div>
      </form>
    </div>
  );
}
