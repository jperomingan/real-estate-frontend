import axios from "axios";

import type {
  AuditAction,
  JsonValue,
} from "./audit-log-types";

interface ApiErrorResponse {
  message?: string;

  error?: {
    message?: string;
  };

  details?: Record<
    string,
    string[] | undefined
  >;

  errors?: Record<
    string,
    string[] | undefined
  >;
}

const dateFormatter =
  new Intl.DateTimeFormat(
    "en-PH",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  );

const ACTION_LABELS: Record<
  AuditAction,
  string
> = {
  CREATE: "Create",
  UPDATE: "Update",
  DELETE: "Delete",
  APPROVE: "Approve",
  REJECT: "Reject",
  LOGIN: "Login",
  LOGOUT: "Logout",
  STATUS_CHANGE:
    "Status Change",
};

export function formatAuditAction(
  action: AuditAction,
): string {
  return ACTION_LABELS[action];
}

export function formatAuditDate(
  value: string,
): string {
  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "Invalid date";
  }

  return dateFormatter.format(date);
}

export function formatAuditJson(
  value: JsonValue | undefined,
): string {
  if (
    value === undefined ||
    value === null
  ) {
    return "";
  }

  return JSON.stringify(
    value,
    null,
    2,
  );
}

export function getAuditResourceTarget(
  resourceType: string,
  resourceId?: string | null,
): string | null {
  if (!resourceId) {
    return null;
  }

  const normalized =
    resourceType
      .toLowerCase()
      .replace(
        /[^a-z]/g,
        "",
      );

  switch (normalized) {
    case "property":
      return `/dashboard/properties/${resourceId}`;

    case "lead":
      return `/dashboard/leads/${resourceId}`;

    case "viewing":
    case "viewingappointment":
      return `/dashboard/viewings/${resourceId}`;

    case "revenue":
      return `/dashboard/revenues/${resourceId}`;

    default:
      return null;
  }
}

export function getAuditErrorMessage(
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

    const fieldErrors = {
      ...error.response.data
        ?.errors,

      ...error.response.data
        ?.details,
    };

    const fieldMessage =
      Object.values(fieldErrors)
        .flatMap(
          (messages) =>
            messages ?? [],
        )
        .find(Boolean);

    return (
      fieldMessage ??
      error.response.data?.message ??
      error.response.data?.error
        ?.message ??
      `Request failed with status ${error.response.status}.`
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "The audit log request failed.";
}
