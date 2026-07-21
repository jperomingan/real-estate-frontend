"use client";

import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import axios from "axios";
import {
  CalendarClock,
  Check,
  LoaderCircle,
  Trash2,
} from "lucide-react";
import {
  useRouter,
} from "next/navigation";
import {
  type FormEvent,
  useState,
} from "react";

import {
  viewingsService,
} from "./viewings-service";
import type {
  RescheduleViewingInput,
  UpdateViewingStatusInput,
  ViewingAppointment,
  ViewingStatus,
} from "./viewings-types";

interface ViewingActionsProps {
  viewing: ViewingAppointment;
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

interface StatusActionDetails {
  label: string;
  confirmation?: string;
  className: string;
}

const NEXT_STATUSES: Record<
  ViewingStatus,
  readonly ViewingStatus[]
> = {
  REQUESTED: [
    "CONFIRMED",
    "CANCELLED",
    "DECLINED",
  ],

  CONFIRMED: [
    "COMPLETED",
    "CANCELLED",
  ],

  RESCHEDULED: [
    "CONFIRMED",
    "COMPLETED",
    "CANCELLED",
  ],

  COMPLETED: [],
  CANCELLED: [],
  DECLINED: [],
};

const TERMINAL_STATUSES =
  new Set<ViewingStatus>([
    "COMPLETED",
    "CANCELLED",
    "DECLINED",
  ]);

const STATUS_ACTIONS: Partial<
  Record<
    ViewingStatus,
    StatusActionDetails
  >
> = {
  CONFIRMED: {
    label: "Confirm Appointment",
    className:
      "bg-emerald-700 text-white hover:bg-emerald-800",
  },

  COMPLETED: {
    label: "Mark Completed",
    confirmation:
      "Mark this viewing appointment as completed?",
    className:
      "bg-blue-700 text-white hover:bg-blue-800",
  },

  CANCELLED: {
    label: "Cancel Appointment",
    confirmation:
      "Cancel this viewing appointment? This action cannot be reversed.",
    className:
      "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
  },

  DECLINED: {
    label: "Decline Request",
    confirmation:
      "Decline this viewing request? This action cannot be reversed.",
    className:
      "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100",
  },
};

function toDateTimeLocal(
  value: Date,
): string {
  const offset =
    value.getTimezoneOffset() *
    60_000;

  return new Date(
    value.getTime() - offset,
  )
    .toISOString()
    .slice(0, 16);
}

function getDefaultRescheduleDate(
  viewing: ViewingAppointment,
): string {
  const currentDate = new Date(
    viewing.confirmedDate ??
      viewing.preferredDate,
  );

  const minimumDate = new Date(
    Date.now() +
      60 * 60 * 1000,
  );

  if (
    !Number.isNaN(
      currentDate.getTime(),
    ) &&
    currentDate > minimumDate
  ) {
    return toDateTimeLocal(
      currentDate,
    );
  }

  return toDateTimeLocal(
    minimumDate,
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

  return "The appointment operation failed.";
}

export function ViewingActions({
  viewing,
}: ViewingActionsProps) {
  const router = useRouter();

  const queryClient =
    useQueryClient();

  const [notes, setNotes] =
    useState(
      viewing.notes ?? "",
    );

  const [
    rescheduleDate,
    setRescheduleDate,
  ] = useState(() =>
    getDefaultRescheduleDate(
      viewing,
    ),
  );

  const [
    minimumRescheduleDate,
  ] = useState(() =>
    toDateTimeLocal(
      new Date(
        Date.now() +
          5 * 60_000,
      ),
    ),
  );

  const [
    validationError,
    setValidationError,
  ] =
    useState<string | null>(
      null,
    );

  async function syncViewing(
    updatedViewing:
      ViewingAppointment,
  ) {
    queryClient.setQueryData(
      [
        "viewings",
        "detail",
        viewing.id,
      ],
      updatedViewing,
    );

    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["viewings"],
      }),

      queryClient.invalidateQueries({
        queryKey: ["dashboard"],
      }),
    ]);
  }

  const statusMutation =
    useMutation({
      mutationFn: (
        input:
          UpdateViewingStatusInput,
      ) =>
        viewingsService
          .updateViewingStatus(
            viewing.id,
            input,
          ),

      onSuccess: async (
        updatedViewing,
      ) => {
        setNotes(
          updatedViewing.notes ?? "",
        );

        await syncViewing(
          updatedViewing,
        );
      },
    });

  const rescheduleMutation =
    useMutation({
      mutationFn: (
        input:
          RescheduleViewingInput,
      ) =>
        viewingsService
          .rescheduleViewing(
            viewing.id,
            input,
          ),

      onSuccess: async (
        updatedViewing,
      ) => {
        setNotes(
          updatedViewing.notes ?? "",
        );

        if (
          updatedViewing
            .confirmedDate
        ) {
          setRescheduleDate(
            toDateTimeLocal(
              new Date(
                updatedViewing
                  .confirmedDate,
              ),
            ),
          );
        }

        await syncViewing(
          updatedViewing,
        );
      },
    });

  const deleteMutation =
    useMutation({
      mutationFn: () =>
        viewingsService
          .deleteViewing(
            viewing.id,
          ),

      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: ["viewings"],
          }),

          queryClient.invalidateQueries({
            queryKey: [
              "dashboard",
            ],
          }),
        ]);

        router.replace(
          "/dashboard/viewings",
        );

        router.refresh();
      },
    });

  const availableStatuses =
    NEXT_STATUSES[
      viewing.status
    ];

  const isTerminal =
    TERMINAL_STATUSES.has(
      viewing.status,
    );

  const isBusy =
    statusMutation.isPending ||
    rescheduleMutation.isPending ||
    deleteMutation.isPending;

  const operationError =
    statusMutation.error ??
    rescheduleMutation.error ??
    deleteMutation.error;

  function resetErrors() {
    setValidationError(null);

    statusMutation.reset();
    rescheduleMutation.reset();
    deleteMutation.reset();
  }

  function changeStatus(
    status: ViewingStatus,
  ) {
    resetErrors();

    const action =
      STATUS_ACTIONS[status];

    if (
      action?.confirmation &&
      !window.confirm(
        action.confirmation,
      )
    ) {
      return;
    }

    statusMutation.mutate({
      status,
      notes: notes.trim(),
    });
  }

  function handleReschedule(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    resetErrors();

    if (!rescheduleDate) {
      setValidationError(
        "Select a new appointment date and time.",
      );
      return;
    }

    const date =
      new Date(
        rescheduleDate,
      );

    if (
      Number.isNaN(
        date.getTime(),
      )
    ) {
      setValidationError(
        "Select a valid appointment date and time.",
      );
      return;
    }

    if (
      date.getTime() <=
      Date.now()
    ) {
      setValidationError(
        "The new appointment date must be in the future.",
      );
      return;
    }

    rescheduleMutation.mutate({
      confirmedDate:
        date.toISOString(),

      notes: notes.trim(),
    });
  }

  function handleDelete() {
    resetErrors();

    const confirmed =
      window.confirm(
        "Permanently delete this viewing appointment? This action cannot be reversed.",
      );

    if (confirmed) {
      deleteMutation.mutate();
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">
        Appointment Actions
      </h2>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        Notes entered here are saved
        together with the selected
        status or rescheduling action.
      </p>

      <label className="mt-5 block space-y-2">
        <span className="text-sm font-medium text-slate-700">
          Appointment notes
        </span>

        <textarea
          rows={5}
          maxLength={2000}
          value={notes}
          onChange={(event) => {
            setNotes(
              event.target.value,
            );
          }}
          disabled={isBusy}
          placeholder="Add confirmation details, instructions, cancellation reasons, or broker notes."
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100"
        />

        <p className="text-right text-xs text-slate-400">
          {notes.length}/2000
        </p>
      </label>

      {availableStatuses.length >
      0 ? (
        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Update status
          </p>

          <div className="mt-3 grid gap-3">
            {availableStatuses.map(
              (status) => {
                const action =
                  STATUS_ACTIONS[
                    status
                  ];

                if (!action) {
                  return null;
                }

                const isCurrentAction =
                  statusMutation
                    .isPending &&
                  statusMutation
                    .variables
                    ?.status === status;

                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => {
                      changeStatus(
                        status,
                      );
                    }}
                    disabled={isBusy}
                    className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${action.className}`}
                  >
                    {isCurrentAction ? (
                      <LoaderCircle
                        size={17}
                        className="animate-spin"
                      />
                    ) : (
                      <Check
                        size={17}
                      />
                    )}

                    {isCurrentAction
                      ? "Updating..."
                      : action.label}
                  </button>
                );
              },
            )}
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
          This appointment has a final
          status. No further status
          transitions are available.
        </div>
      )}

      {!isTerminal && (
        <form
          onSubmit={handleReschedule}
          className="mt-6 border-t border-slate-200 pt-6"
        >
          <div className="flex items-center gap-2">
            <CalendarClock
              size={18}
              className="text-emerald-700"
            />

            <h3 className="font-semibold text-slate-900">
              Reschedule
            </h3>
          </div>

          <label className="mt-4 block space-y-2">
            <span className="text-sm font-medium text-slate-700">
              New date and time
            </span>

            <input
              type="datetime-local"
              value={rescheduleDate}
              min={
                minimumRescheduleDate
              }
              onChange={(event) => {
                setRescheduleDate(
                  event.target.value,
                );
              }}
              disabled={isBusy}
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100"
            />
          </label>

          <button
            type="submit"
            disabled={isBusy}
            className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {rescheduleMutation
              .isPending ? (
              <LoaderCircle
                size={17}
                className="animate-spin"
              />
            ) : (
              <CalendarClock
                size={17}
              />
            )}

            {rescheduleMutation
              .isPending
              ? "Rescheduling..."
              : "Reschedule Appointment"}
          </button>
        </form>
      )}

      {validationError && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {validationError}
        </div>
      )}

      {operationError && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {getErrorMessage(
            operationError,
          )}
        </div>
      )}

      <div className="mt-6 border-t border-slate-200 pt-6">
        <button
          type="button"
          onClick={handleDelete}
          disabled={isBusy}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {deleteMutation.isPending ? (
            <LoaderCircle
              size={17}
              className="animate-spin"
            />
          ) : (
            <Trash2 size={17} />
          )}

          {deleteMutation.isPending
            ? "Deleting..."
            : "Delete Appointment"}
        </button>
      </div>
    </section>
  );
}
