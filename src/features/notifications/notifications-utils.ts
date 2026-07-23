import axios from "axios";

import type {
  JsonValue,
  NotificationType,
} from "./notifications-types";

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

const dateFormatter =
  new Intl.DateTimeFormat(
    "en-PH",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  );

const TYPE_LABELS: Record<
  NotificationType,
  string
> = {
  LEAD_CREATED: "Lead Created",
  VIEWING_REQUESTED:
    "Viewing Requested",
  VIEWING_UPDATED:
    "Viewing Updated",
  REVENUE_CREATED:
    "Revenue Created",
  PROPERTY_UPDATED:
    "Property Updated",
  ACCOUNT_APPROVED:
    "Account Approved",
  ACCOUNT_REJECTED:
    "Account Rejected",
  GENERAL: "General",
};

export function formatNotificationDate(
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

export function formatNotificationType(
  type: NotificationType,
): string {
  return TYPE_LABELS[type];
}

function isMetadataObject(
  metadata: JsonValue | undefined,
): metadata is Record<
  string,
  JsonValue
> {
  return (
    typeof metadata === "object" &&
    metadata !== null &&
    !Array.isArray(metadata)
  );
}

function getStringValue(
  metadata: Record<
    string,
    JsonValue
  >,
  key: string,
): string | null {
  const value = metadata[key];

  return typeof value === "string"
    ? value
    : null;
}

export function getNotificationTarget(
  metadata?: JsonValue,
): string | null {
  if (!isMetadataObject(metadata)) {
    return null;
  }

  const leadId =
    getStringValue(
      metadata,
      "leadId",
    );

  if (leadId) {
    return `/dashboard/leads/${leadId}`;
  }

  const viewingId =
    getStringValue(
      metadata,
      "viewingId",
    ) ??
    getStringValue(
      metadata,
      "viewingAppointmentId",
    );

  if (viewingId) {
    return `/dashboard/viewings/${viewingId}`;
  }

  const revenueId =
    getStringValue(
      metadata,
      "revenueId",
    );

  if (revenueId) {
    return `/dashboard/revenues/${revenueId}`;
  }

  const propertyId =
    getStringValue(
      metadata,
      "propertyId",
    );

  if (propertyId) {
    return `/dashboard/properties/${propertyId}`;
  }

  const resourceType =
    getStringValue(
      metadata,
      "resourceType",
    )?.toLowerCase();

  const resourceId =
    getStringValue(
      metadata,
      "resourceId",
    );

  if (
    resourceType &&
    resourceId
  ) {
    if (
      resourceType === "lead"
    ) {
      return `/dashboard/leads/${resourceId}`;
    }

    if (
      resourceType === "viewing"
    ) {
      return `/dashboard/viewings/${resourceId}`;
    }

    if (
      resourceType === "revenue"
    ) {
      return `/dashboard/revenues/${resourceId}`;
    }

    if (
      resourceType === "property"
    ) {
      return `/dashboard/properties/${resourceId}`;
    }
  }

  return null;
}

export function getNotificationErrorMessage(
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

    const fieldMessage =
      Object.values(
        error.response.data
          ?.errors ?? {},
      )
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

  return "The notification operation failed.";
}
