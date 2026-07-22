"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import axios from "axios";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  CircleX,
  ListTodo,
  LoaderCircle,
  Plus,
  RotateCcw,
  Trash2,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import {
  type FormEvent,
  useState,
} from "react";

import {
  followUpsService,
} from "./follow-ups-service";
import type {
  CreateLeadFollowUpInput,
  LeadFollowUpPriority,
  LeadFollowUpStatus,
  LeadFollowUpTask,
  UpdateLeadFollowUpInput,
} from "./follow-ups-types";

interface ApiErrorResponse {
  message?: string;
  error?: {
    message?: string;
  };
}

const dateFormatter =
  new Intl.DateTimeFormat(
    "en-PH",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  );

const STATUS_LABELS: Record<
  LeadFollowUpStatus,
  string
> = {
  PENDING: "Pending",
  DONE: "Done",
  CANCELLED: "Cancelled",
};

const PRIORITY_LABELS: Record<
  LeadFollowUpPriority,
  string
> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

const STATUS_CLASSES: Record<
  LeadFollowUpStatus,
  string
> = {
  PENDING:
    "bg-amber-50 text-amber-700 ring-amber-200",
  DONE:
    "bg-emerald-50 text-emerald-700 ring-emerald-200",
  CANCELLED:
    "bg-slate-100 text-slate-600 ring-slate-200",
};

const PRIORITY_CLASSES: Record<
  LeadFollowUpPriority,
  string
> = {
  LOW:
    "bg-sky-50 text-sky-700 ring-sky-200",
  MEDIUM:
    "bg-violet-50 text-violet-700 ring-violet-200",
  HIGH:
    "bg-red-50 text-red-700 ring-red-200",
};

function formatDate(
  value?: string | null,
) {
  if (!value) {
    return "No due date";
  }

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

function getLeadName(
  task: LeadFollowUpTask,
) {
  if (!task.lead) {
    return "Lead unavailable";
  }

  return [
    task.lead.firstName,
    task.lead.lastName,
  ]
    .filter(Boolean)
    .join(" ");
}

function getErrorMessage(
  error: unknown,
) {
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
      error.response.data?.error
        ?.message ??
      `Request failed with status ${error.response.status}.`
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "The follow-up operation failed.";
}

export function FollowUpsDashboard() {
  const queryClient =
    useQueryClient();

  const [page, setPage] =
    useState(1);

  const [
    statusFilter,
    setStatusFilter,
  ] = useState<
    LeadFollowUpStatus | "ALL"
  >("ALL");

  const [
    priorityFilter,
    setPriorityFilter,
  ] = useState<
    LeadFollowUpPriority | "ALL"
  >("ALL");

  const [
    referenceTime,
  ] = useState(
    () =>
      new Date().toISOString(),
  );

  const [leadId, setLeadId] =
    useState("");

  const [title, setTitle] =
    useState("");

  const [
    description,
    setDescription,
  ] = useState("");

  const [priority, setPriority] =
    useState<LeadFollowUpPriority>(
      "MEDIUM",
    );

  const [dueDate, setDueDate] =
    useState("");

  const [
    validationError,
    setValidationError,
  ] = useState<string | null>(
    null,
  );

  const listQuery = useQuery({
    queryKey: [
      "follow-ups",
      "list",
      {
        page,
        statusFilter,
        priorityFilter,
      },
    ],

    queryFn: () =>
      followUpsService.list({
        page,
        limit: 10,

        ...(statusFilter !==
        "ALL"
          ? {
              status:
                statusFilter,
            }
          : {}),

        ...(priorityFilter !==
        "ALL"
          ? {
              priority:
                priorityFilter,
            }
          : {}),
      }),
  });

  const leadsQuery = useQuery({
    queryKey: [
      "leads",
      "follow-up-options",
    ],

    queryFn: () =>
      followUpsService
        .getLeadOptions(),
  });

  const pendingSummary =
    useQuery({
      queryKey: [
        "follow-ups",
        "summary",
        "pending",
      ],

      queryFn: () =>
        followUpsService.list({
          status: "PENDING",
          page: 1,
          limit: 1,
        }),
    });

  const overdueSummary =
    useQuery({
      queryKey: [
        "follow-ups",
        "summary",
        "overdue",
        referenceTime,
      ],

      queryFn: () =>
        followUpsService.list({
          status: "PENDING",
          dueTo: referenceTime,
          page: 1,
          limit: 1,
        }),
    });

  const highPrioritySummary =
    useQuery({
      queryKey: [
        "follow-ups",
        "summary",
        "high-priority",
      ],

      queryFn: () =>
        followUpsService.list({
          status: "PENDING",
          priority: "HIGH",
          page: 1,
          limit: 1,
        }),
    });

  const doneSummary = useQuery({
    queryKey: [
      "follow-ups",
      "summary",
      "done",
    ],

    queryFn: () =>
      followUpsService.list({
        status: "DONE",
        page: 1,
        limit: 1,
      }),
  });

  async function refreshData() {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: [
          "follow-ups",
        ],
      }),

      queryClient.invalidateQueries({
        queryKey: [
          "dashboard",
        ],
      }),

      queryClient.invalidateQueries({
        queryKey: ["leads"],
      }),
    ]);
  }

  const createMutation =
    useMutation({
      mutationFn: ({
        selectedLeadId,
        input,
      }: {
        selectedLeadId: string;
        input:
          CreateLeadFollowUpInput;
      }) =>
        followUpsService.create(
          selectedLeadId,
          input,
        ),

      onSuccess: async () => {
        setLeadId("");
        setTitle("");
        setDescription("");
        setPriority("MEDIUM");
        setDueDate("");
        setValidationError(null);

        await refreshData();
      },
    });

  const updateMutation =
    useMutation({
      mutationFn: ({
        id,
        input,
      }: {
        id: string;
        input:
          UpdateLeadFollowUpInput;
      }) =>
        followUpsService.update(
          id,
          input,
        ),

      onSuccess: refreshData,
    });

  const deleteMutation =
    useMutation({
      mutationFn: (
        id: string,
      ) =>
        followUpsService.delete(id),

      onSuccess: async () => {
        await refreshData();
      },
    });

  const tasks =
    listQuery.data?.items ?? [];

  const meta =
    listQuery.data?.meta;

  const isCreating =
    createMutation.isPending;

  const operationError =
    createMutation.error ??
    updateMutation.error ??
    deleteMutation.error;

  function resetErrors() {
    setValidationError(null);
    createMutation.reset();
    updateMutation.reset();
    deleteMutation.reset();
  }

  function handleCreate(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    resetErrors();

    if (!leadId) {
      setValidationError(
        "Select a lead.",
      );
      return;
    }

    if (!title.trim()) {
      setValidationError(
        "Follow-up title is required.",
      );
      return;
    }

    let dueDateIso:
      | string
      | undefined;

    if (dueDate) {
      const parsedDate =
        new Date(dueDate);

      if (
        Number.isNaN(
          parsedDate.getTime(),
        )
      ) {
        setValidationError(
          "Select a valid due date and time.",
        );
        return;
      }

      dueDateIso =
        parsedDate.toISOString();
    }

    createMutation.mutate({
      selectedLeadId: leadId,

      input: {
        title: title.trim(),

        description:
          description.trim() ||
          undefined,

        priority,

        dueDate: dueDateIso,
      },
    });
  }

  function updateStatus(
    task: LeadFollowUpTask,
    status:
      LeadFollowUpStatus,
  ) {
    resetErrors();

    if (
      status === "CANCELLED" &&
      !window.confirm(
        "Cancel this follow-up task?",
      )
    ) {
      return;
    }

    updateMutation.mutate({
      id: task.id,
      input: {
        status,
      },
    });
  }

  function deleteTask(
    task: LeadFollowUpTask,
  ) {
    resetErrors();

    if (
      window.confirm(
        `Delete "${task.title}" permanently?`,
      )
    ) {
      deleteMutation.mutate(
        task.id,
      );
    }
  }

  return (
    <div className="space-y-7">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">
          Follow-ups
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Schedule, prioritize, and
          complete lead follow-up
          activities.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Pending"
          value={
            pendingSummary.data
              ?.meta.total ?? 0
          }
          icon={<ListTodo size={20} />}
        />

        <SummaryCard
          label="Overdue"
          value={
            overdueSummary.data
              ?.meta.total ?? 0
          }
          icon={
            <AlertTriangle
              size={20}
            />
          }
        />

        <SummaryCard
          label="High priority"
          value={
            highPrioritySummary.data
              ?.meta.total ?? 0
          }
          icon={
            <CalendarClock
              size={20}
            />
          }
        />

        <SummaryCard
          label="Completed"
          value={
            doneSummary.data
              ?.meta.total ?? 0
          }
          icon={
            <CheckCircle2
              size={20}
            />
          }
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <form
          onSubmit={handleCreate}
          className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="flex items-center gap-2">
            <Plus
              size={19}
              className="text-emerald-700"
            />

            <h2 className="font-semibold text-slate-950">
              New Follow-up
            </h2>
          </div>

          <div className="mt-5 space-y-4">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">
                Lead
              </span>

              <select
                value={leadId}
                onChange={(event) =>
                  setLeadId(
                    event.target
                      .value,
                  )
                }
                disabled={
                  isCreating ||
                  leadsQuery.isLoading
                }
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              >
                <option value="">
                  Select lead
                </option>

                {leadsQuery.data?.map(
                  (lead) => (
                    <option
                      key={lead.id}
                      value={lead.id}
                    >
                      {[
                        lead.firstName,
                        lead.lastName,
                      ]
                        .filter(
                          Boolean,
                        )
                        .join(" ")}
                      {" — "}
                      {lead.phone}
                    </option>
                  ),
                )}
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">
                Title
              </span>

              <input
                value={title}
                onChange={(event) =>
                  setTitle(
                    event.target
                      .value,
                  )
                }
                disabled={isCreating}
                placeholder="Call about viewing schedule"
                className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">
                Description
              </span>

              <textarea
                rows={4}
                value={description}
                onChange={(event) =>
                  setDescription(
                    event.target
                      .value,
                  )
                }
                disabled={isCreating}
                placeholder="Add instructions or conversation notes."
                className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">
                Priority
              </span>

              <select
                value={priority}
                onChange={(event) =>
                  setPriority(
                    event.target
                      .value as LeadFollowUpPriority,
                  )
                }
                disabled={isCreating}
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              >
                <option value="LOW">
                  Low
                </option>
                <option value="MEDIUM">
                  Medium
                </option>
                <option value="HIGH">
                  High
                </option>
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">
                Due date
              </span>

              <input
                type="datetime-local"
                value={dueDate}
                onChange={(event) =>
                  setDueDate(
                    event.target
                      .value,
                  )
                }
                disabled={isCreating}
                className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              />
            </label>
          </div>

          {validationError && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {validationError}
            </div>
          )}

          {operationError && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {getErrorMessage(
                operationError,
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={
              isCreating ||
              leadsQuery.isLoading
            }
            className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isCreating ? (
              <LoaderCircle
                size={17}
                className="animate-spin"
              />
            ) : (
              <Plus size={17} />
            )}

            {isCreating
              ? "Creating..."
              : "Create Follow-up"}
          </button>
        </form>

        <div className="space-y-5">
          <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row">
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(
                  event.target
                    .value as
                    | LeadFollowUpStatus
                    | "ALL",
                );
                setPage(1);
              }}
              className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm"
            >
              <option value="ALL">
                All statuses
              </option>
              <option value="PENDING">
                Pending
              </option>
              <option value="DONE">
                Done
              </option>
              <option value="CANCELLED">
                Cancelled
              </option>
            </select>

            <select
              value={priorityFilter}
              onChange={(event) => {
                setPriorityFilter(
                  event.target
                    .value as
                    | LeadFollowUpPriority
                    | "ALL",
                );
                setPage(1);
              }}
              className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm"
            >
              <option value="ALL">
                All priorities
              </option>
              <option value="LOW">
                Low
              </option>
              <option value="MEDIUM">
                Medium
              </option>
              <option value="HIGH">
                High
              </option>
            </select>
          </section>

          {listQuery.isLoading ? (
            <div className="flex min-h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white">
              <LoaderCircle className="animate-spin text-emerald-700" />
            </div>
          ) : listQuery.isError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
              {getErrorMessage(
                listQuery.error,
              )}
            </div>
          ) : tasks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <ListTodo className="mx-auto text-slate-400" />

              <h2 className="mt-4 font-semibold text-slate-900">
                No follow-ups found
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Create a task or change
                the selected filters.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.map((task) => (
                <FollowUpCard
                  key={task.id}
                  task={task}
                  isUpdating={
                    updateMutation
                      .isPending &&
                    updateMutation
                      .variables
                      ?.id === task.id
                  }
                  isDeleting={
                    deleteMutation
                      .isPending &&
                    deleteMutation
                      .variables ===
                      task.id
                  }
                  onStatusChange={
                    updateStatus
                  }
                  onDelete={
                    deleteTask
                  }
                />
              ))}
            </div>
          )}

          {meta &&
            meta.totalPages > 1 && (
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 text-sm">
                <button
                  type="button"
                  disabled={
                    page <= 1 ||
                    listQuery.isFetching
                  }
                  onClick={() =>
                    setPage(
                      (current) =>
                        Math.max(
                          1,
                          current - 1,
                        ),
                    )
                  }
                  className="rounded-lg border border-slate-300 px-4 py-2 font-medium disabled:opacity-40"
                >
                  Previous
                </button>

                <span className="text-slate-500">
                  Page {meta.page} of{" "}
                  {meta.totalPages}
                </span>

                <button
                  type="button"
                  disabled={
                    page >=
                      meta.totalPages ||
                    listQuery.isFetching
                  }
                  onClick={() =>
                    setPage(
                      (current) =>
                        current + 1,
                    )
                  }
                  className="rounded-lg border border-slate-300 px-4 py-2 font-medium disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
        </div>
      </section>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500">
          {label}
        </span>

        <span className="text-emerald-700">
          {icon}
        </span>
      </div>

      <p className="mt-4 text-3xl font-bold text-slate-950">
        {value}
      </p>
    </div>
  );
}

function FollowUpCard({
  task,
  isUpdating,
  isDeleting,
  onStatusChange,
  onDelete,
}: {
  task: LeadFollowUpTask;
  isUpdating: boolean;
  isDeleting: boolean;
  onStatusChange: (
    task: LeadFollowUpTask,
    status: LeadFollowUpStatus,
  ) => void;
  onDelete: (
    task: LeadFollowUpTask,
  ) => void;
}) {
  const isBusy =
    isUpdating || isDeleting;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${STATUS_CLASSES[task.status]}`}
            >
              {
                STATUS_LABELS[
                  task.status
                ]
              }
            </span>

            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${PRIORITY_CLASSES[task.priority]}`}
            >
              {
                PRIORITY_LABELS[
                  task.priority
                ]
              }
            </span>
          </div>

          <h2 className="mt-3 text-base font-semibold text-slate-950">
            {task.title}
          </h2>

          {task.description && (
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {task.description}
            </p>
          )}
        </div>

        <div className="shrink-0 text-sm text-slate-500">
          <CalendarClock
            size={16}
            className="mr-1.5 inline"
          />
          {formatDate(
            task.dueDate,
          )}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-slate-100 pt-4 text-sm text-slate-500">
        <Link
          href={`/dashboard/leads/${task.leadId}`}
          className="inline-flex items-center gap-2 font-medium text-emerald-700 hover:text-emerald-800"
        >
          <UserRound size={16} />
          {getLeadName(task)}
        </Link>

        {task.lead?.phone && (
          <span>
            {task.lead.phone}
          </span>
        )}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {task.status !==
          "DONE" && (
          <button
            type="button"
            disabled={isBusy}
            onClick={() =>
              onStatusChange(
                task,
                "DONE",
              )
            }
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-emerald-700 px-3 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
          >
            {isUpdating ? (
              <LoaderCircle
                size={15}
                className="animate-spin"
              />
            ) : (
              <CheckCircle2
                size={15}
              />
            )}
            Mark Done
          </button>
        )}

        {task.status !==
          "PENDING" && (
          <button
            type="button"
            disabled={isBusy}
            onClick={() =>
              onStatusChange(
                task,
                "PENDING",
              )
            }
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RotateCcw
              size={15}
            />
            Reopen
          </button>
        )}

        {task.status ===
          "PENDING" && (
          <button
            type="button"
            disabled={isBusy}
            onClick={() =>
              onStatusChange(
                task,
                "CANCELLED",
              )
            }
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 text-xs font-semibold text-amber-700 hover:bg-amber-100 disabled:opacity-50"
          >
            <CircleX size={15} />
            Cancel
          </button>
        )}

        <button
          type="button"
          disabled={isBusy}
          onClick={() =>
            onDelete(task)
          }
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-red-200 px-3 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
        >
          {isDeleting ? (
            <LoaderCircle
              size={15}
              className="animate-spin"
            />
          ) : (
            <Trash2 size={15} />
          )}
          Delete
        </button>
      </div>
    </article>
  );
}
