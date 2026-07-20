"use client";

import { useMutation } from "@tanstack/react-query";
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

import { leadsService } from "./leads-service";
import {
  LEAD_SOURCES,
  type CreateLeadInput,
  type LeadSource,
} from "./leads-types";

interface FormValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  message: string;
  source: LeadSource;
  budget: string;
  preferredDate: string;
}

interface StoredUser {
  id?: string;
}

interface ApiErrorResponse {
  message?: string;
  error?: {
    message?: string;
  };
}

const initialValues: FormValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  message: "",
  source: "WEBSITE",
  budget: "",
  preferredDate: "",
};

function formatLabel(value: string): string {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase(),
    );
}

function getAuthenticatedUserId(): string {
  const storedUser =
    localStorage.getItem("authUser");

  if (!storedUser) {
    throw new Error(
      "Your login session could not be found. Please log in again.",
    );
  }

  try {
    const user =
      JSON.parse(storedUser) as StoredUser;

    if (!user.id) {
      throw new Error(
        "The stored user does not have an ID.",
      );
    }

    return user.id;
  } catch {
    throw new Error(
      "Your login session is invalid. Please log in again.",
    );
  }
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

  return "Unable to create the lead.";
}

export function CreateLeadForm() {
  const router = useRouter();

  const [values, setValues] =
    useState<FormValues>(initialValues);

  const [validationError, setValidationError] =
    useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (
      input: CreateLeadInput,
    ) => leadsService.createLead(input),

    onSuccess: () => {
      router.push("/dashboard/leads");
      router.refresh();
    },
  });

  function updateField<K extends keyof FormValues>(
    field: K,
    value: FormValues[K],
  ) {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setValidationError(null);

    const firstName =
      values.firstName.trim();
    const phone = values.phone.trim();

    if (firstName.length < 2) {
      setValidationError(
        "First name must contain at least two characters.",
      );
      return;
    }

    if (phone.length < 5) {
      setValidationError(
        "Please enter a valid phone number.",
      );
      return;
    }

    const budget = values.budget
      ? Number(values.budget)
      : undefined;

    if (
      budget !== undefined &&
      (!Number.isFinite(budget) ||
        budget <= 0)
    ) {
      setValidationError(
        "Budget must be greater than zero.",
      );
      return;
    }

    const brokerId =
      getAuthenticatedUserId();

    mutation.mutate({
      firstName,
      phone,
      source: values.source,
      brokerId,
      ...(values.lastName.trim()
        ? {
            lastName:
              values.lastName.trim(),
          }
        : {}),
      ...(values.email.trim()
        ? {
            email:
              values.email.trim(),
          }
        : {}),
      ...(values.message.trim()
        ? {
            message:
              values.message.trim(),
          }
        : {}),
      ...(budget !== undefined
        ? { budget }
        : {}),
      ...(values.preferredDate
        ? {
            preferredDate:
              values.preferredDate,
          }
        : {}),
    });
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <Link
          href="/dashboard/leads"
          className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-800"
        >
          <ArrowLeft size={16} />
          Back to leads
        </Link>

        <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">
          Add New Lead
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Record a new prospective client
          and property inquiry.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="grid gap-5 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">
              First name *
            </span>

            <input
              type="text"
              value={values.firstName}
              onChange={(event) => {
                updateField(
                  "firstName",
                  event.target.value,
                );
              }}
              disabled={mutation.isPending}
              className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              placeholder="Juan"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">
              Last name
            </span>

            <input
              type="text"
              value={values.lastName}
              onChange={(event) => {
                updateField(
                  "lastName",
                  event.target.value,
                );
              }}
              disabled={mutation.isPending}
              className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              placeholder="Dela Cruz"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">
              Phone number *
            </span>

            <input
              type="tel"
              value={values.phone}
              onChange={(event) => {
                updateField(
                  "phone",
                  event.target.value,
                );
              }}
              disabled={mutation.isPending}
              className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              placeholder="09171234567"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">
              Email
            </span>

            <input
              type="email"
              value={values.email}
              onChange={(event) => {
                updateField(
                  "email",
                  event.target.value,
                );
              }}
              disabled={mutation.isPending}
              className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              placeholder="juan@example.com"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">
              Lead source *
            </span>

            <select
              value={values.source}
              onChange={(event) => {
                updateField(
                  "source",
                  event.target
                    .value as LeadSource,
                );
              }}
              disabled={mutation.isPending}
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            >
              {LEAD_SOURCES.map(
                (source) => (
                  <option
                    key={source}
                    value={source}
                  >
                    {formatLabel(source)}
                  </option>
                ),
              )}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">
              Estimated budget
            </span>

            <input
              type="number"
              min="1"
              step="0.01"
              value={values.budget}
              onChange={(event) => {
                updateField(
                  "budget",
                  event.target.value,
                );
              }}
              disabled={mutation.isPending}
              className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              placeholder="2500000"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">
              Preferred viewing date
            </span>

            <input
              type="date"
              value={values.preferredDate}
              onChange={(event) => {
                updateField(
                  "preferredDate",
                  event.target.value,
                );
              }}
              disabled={mutation.isPending}
              className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            />
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium text-slate-700">
              Inquiry or message
            </span>

            <textarea
              rows={5}
              value={values.message}
              onChange={(event) => {
                updateField(
                  "message",
                  event.target.value,
                );
              }}
              disabled={mutation.isPending}
              className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              placeholder="Describe the client's preferred property, location, or requirements."
            />
          </label>
        </div>

        {validationError && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {validationError}
          </div>
        )}

        {mutation.isError && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {getErrorMessage(
              mutation.error,
            )}
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
          <Link
            href="/dashboard/leads"
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
              : "Save Lead"}
          </button>
        </div>
      </form>
    </div>
  );
}
