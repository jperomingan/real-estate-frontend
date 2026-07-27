import axios from "axios";

import type {
  AdminUserRole,
  AdminUserStatus,
} from "./admin-user-types";

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

const ROLE_LABELS: Record<
  AdminUserRole,
  string
> = {
  ADMIN: "Administrator",
  BROKER: "Broker",
  CLIENT: "Client",
};

const STATUS_LABELS: Record<
  AdminUserStatus,
  string
> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  ACTIVE: "Active",
  INACTIVE: "Inactive",
};

export function formatAdminUserDate(
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

export function formatAdminUserRole(
  role: AdminUserRole,
): string {
  return ROLE_LABELS[role];
}

export function formatAdminUserStatus(
  status: AdminUserStatus,
): string {
  return STATUS_LABELS[status];
}

export function getAdminUserErrorMessage(
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

  return "The user-management request failed.";
}
