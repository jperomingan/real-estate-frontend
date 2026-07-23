import axios from "axios";

import type {
  DecimalValue,
} from "./revenues-types";

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

const currencyFormatter =
  new Intl.NumberFormat(
    "en-PH",
    {
      style: "currency",
      currency: "PHP",
      maximumFractionDigits: 2,
    },
  );

const dateFormatter =
  new Intl.DateTimeFormat(
    "en-PH",
    {
      dateStyle: "medium",
    },
  );

export function toRevenueNumber(
  value: DecimalValue,
): number {
  const numberValue =
    Number(value);

  return Number.isFinite(
    numberValue,
  )
    ? numberValue
    : 0;
}

export function formatRevenueMoney(
  value: DecimalValue,
): string {
  return currencyFormatter.format(
    toRevenueNumber(value),
  );
}

export function formatRevenueDate(
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

export function getRevenueErrorMessage(
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

  return "The revenue operation failed.";
}
