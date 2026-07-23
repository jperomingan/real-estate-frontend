"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Bell,
  BellRing,
  Building2,
  CalendarDays,
  Check,
  CheckCheck,
  CircleUserRound,
  LoaderCircle,
  Megaphone,
  PhilippinePeso,
  Search,
  Trash2,
  UserPlus,
} from "lucide-react";
import {
  useRouter,
} from "next/navigation";
import {
  type FormEvent,
  type ReactNode,
  useState,
} from "react";

import {
  notificationsService,
} from "./notifications-service";
import type {
  NotificationItem,
  NotificationType,
} from "./notifications-types";
import {
  formatNotificationDate,
  formatNotificationType,
  getNotificationErrorMessage,
  getNotificationTarget,
} from "./notifications-utils";

type ReadFilter =
  | "ALL"
  | "UNREAD"
  | "READ";

const NOTIFICATION_TYPES:
  Array<{
    value:
      | NotificationType
      | "ALL";
    label: string;
  }> = [
    {
      value: "ALL",
      label: "All types",
    },
    {
      value: "LEAD_CREATED",
      label: "Lead Created",
    },
    {
      value:
        "VIEWING_REQUESTED",
      label:
        "Viewing Requested",
    },
    {
      value:
        "VIEWING_UPDATED",
      label:
        "Viewing Updated",
    },
    {
      value:
        "REVENUE_CREATED",
      label:
        "Revenue Created",
    },
    {
      value:
        "PROPERTY_UPDATED",
      label:
        "Property Updated",
    },
    {
      value:
        "ACCOUNT_APPROVED",
      label:
        "Account Approved",
    },
    {
      value:
        "ACCOUNT_REJECTED",
      label:
        "Account Rejected",
    },
    {
      value: "GENERAL",
      label: "General",
    },
  ];

export function NotificationsDashboard() {
  const router = useRouter();

  const queryClient =
    useQueryClient();

  const [page, setPage] =
    useState(1);

  const [
    draftSearch,
    setDraftSearch,
  ] = useState("");

  const [
    appliedSearch,
    setAppliedSearch,
  ] = useState("");

  const [
    typeFilter,
    setTypeFilter,
  ] = useState<
    NotificationType | "ALL"
  >("ALL");

  const [
    readFilter,
    setReadFilter,
  ] =
    useState<ReadFilter>(
      "ALL",
    );

  const listQuery = useQuery({
    queryKey: [
      "notifications",
      "list",
      {
        page,
        appliedSearch,
        typeFilter,
        readFilter,
      },
    ],

    queryFn: () =>
      notificationsService.list({
        page,
        limit: 10,

        ...(appliedSearch
          ? {
              search:
                appliedSearch,
            }
          : {}),

        ...(typeFilter !== "ALL"
          ? {
              type: typeFilter,
            }
          : {}),

        ...(readFilter !== "ALL"
          ? {
              isRead:
                readFilter ===
                "READ",
            }
          : {}),
      }),
  });

  const unreadQuery = useQuery({
    queryKey: [
      "notifications",
      "unread-count",
    ],

    queryFn: () =>
      notificationsService
        .unreadCount(),
  });

  async function refreshNotifications() {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: [
          "notifications",
          "list",
        ],
      }),

      queryClient.invalidateQueries({
        queryKey: [
          "notifications",
          "unread-count",
        ],
      }),
    ]);
  }

  const markReadMutation =
    useMutation({
      mutationFn: (
        id: string,
      ) =>
        notificationsService
          .markRead(id),

      onSuccess:
        refreshNotifications,
    });

  const markAllMutation =
    useMutation({
      mutationFn: () =>
        notificationsService
          .markAllRead(),

      onSuccess:
        refreshNotifications,
    });

  const deleteMutation =
    useMutation({
      mutationFn: (
        id: string,
      ) =>
        notificationsService
          .delete(id),

      onSuccess: async () => {
        await refreshNotifications();
      },
    });

  const openMutation =
    useMutation({
      mutationFn: async (
        notification:
          NotificationItem,
      ) => {
        if (
          !notification.isRead
        ) {
          await notificationsService
            .markRead(
              notification.id,
            );
        }

        return getNotificationTarget(
          notification.metadata,
        );
      },

      onSuccess: async (
        target,
      ) => {
        await refreshNotifications();

        if (target) {
          router.push(target);
        }
      },
    });

  const items =
    listQuery.data?.items ?? [];

  const pagination =
    listQuery.data
      ?.pagination;

  const operationError =
    markReadMutation.error ??
    markAllMutation.error ??
    deleteMutation.error ??
    openMutation.error;

  function applySearch(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setAppliedSearch(
      draftSearch.trim(),
    );

    setPage(1);
  }

  function resetFilters() {
    setDraftSearch("");
    setAppliedSearch("");
    setTypeFilter("ALL");
    setReadFilter("ALL");
    setPage(1);
  }

  function deleteNotification(
    notification:
      NotificationItem,
  ) {
    if (
      window.confirm(
        `Delete "${notification.title}"?`,
      )
    ) {
      deleteMutation.mutate(
        notification.id,
      );
    }
  }

  return (
    <div className="space-y-7">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">
            Notifications
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Review system activity
            and updates assigned to
            your account.
          </p>
        </div>

        <button
          type="button"
          disabled={
            markAllMutation.isPending ||
            (unreadQuery.data ??
              0) === 0
          }
          onClick={() =>
            markAllMutation.mutate()
          }
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {markAllMutation.isPending ? (
            <LoaderCircle
              size={17}
              className="animate-spin"
            />
          ) : (
            <CheckCheck size={17} />
          )}

          Mark All Read
        </button>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          label="Total"
          value={
            pagination?.total ?? 0
          }
          icon={<Bell size={20} />}
        />

        <SummaryCard
          label="Unread"
          value={
            unreadQuery.data ?? 0
          }
          icon={
            <BellRing size={20} />
          }
        />

        <SummaryCard
          label="Current Page"
          value={items.length}
          icon={
            <CheckCheck size={20} />
          }
        />
      </section>

      <form
        onSubmit={applySearch}
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,2fr)_1fr_1fr_auto_auto]">
          <label className="space-y-2">
            <span className="block text-sm font-medium text-slate-700">
              Search
            </span>

            <div className="relative">
              <Search
                size={17}
                className="absolute left-3 top-3 text-slate-400"
              />

              <input
                value={draftSearch}
                onChange={(event) =>
                  setDraftSearch(
                    event.target.value,
                  )
                }
                placeholder="Search title or message"
                className="h-11 w-full rounded-xl border border-slate-300 pl-10 pr-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </label>

          <label className="space-y-2">
            <span className="block text-sm font-medium text-slate-700">
              Type
            </span>

            <select
              value={typeFilter}
              onChange={(event) => {
                setTypeFilter(
                  event.target
                    .value as
                    | NotificationType
                    | "ALL",
                );

                setPage(1);
              }}
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm"
            >
              {NOTIFICATION_TYPES.map(
                (option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ),
              )}
            </select>
          </label>

          <label className="space-y-2">
            <span className="block text-sm font-medium text-slate-700">
              Read status
            </span>

            <select
              value={readFilter}
              onChange={(event) => {
                setReadFilter(
                  event.target
                    .value as
                    ReadFilter,
                );

                setPage(1);
              }}
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm"
            >
              <option value="ALL">
                All
              </option>

              <option value="UNREAD">
                Unread
              </option>

              <option value="READ">
                Read
              </option>
            </select>
          </label>

          <button
            type="submit"
            className="h-11 self-end rounded-xl bg-blue-700 px-5 text-sm font-semibold text-white hover:bg-blue-800"
          >
            Apply
          </button>

          <button
            type="button"
            onClick={resetFilters}
            className="h-11 self-end rounded-xl border border-slate-300 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Reset
          </button>
        </div>
      </form>

      {operationError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {getNotificationErrorMessage(
            operationError,
          )}
        </div>
      )}

      {listQuery.isLoading ? (
        <div className="flex min-h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <LoaderCircle className="animate-spin text-blue-700" />
        </div>
      ) : listQuery.isError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {getNotificationErrorMessage(
            listQuery.error,
          )}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <Bell className="mx-auto text-slate-400" />

          <h2 className="mt-4 font-semibold text-slate-900">
            No notifications
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            New lead, viewing,
            property, and revenue
            activities will appear
            here.
          </p>
        </div>
      ) : (
        <section className="space-y-3">
          {items.map(
            (notification) => {
              const target =
                getNotificationTarget(
                  notification.metadata,
                );

              const isBusy =
                (markReadMutation
                  .isPending &&
                  markReadMutation
                    .variables ===
                    notification.id) ||
                (deleteMutation
                  .isPending &&
                  deleteMutation
                    .variables ===
                    notification.id) ||
                (openMutation
                  .isPending &&
                  openMutation
                    .variables
                    ?.id ===
                    notification.id);

              return (
                <article
                  key={
                    notification.id
                  }
                  className={[
                    "rounded-2xl border p-5 shadow-sm transition",
                    notification.isRead
                      ? "border-slate-200 bg-white"
                      : "border-blue-200 bg-blue-50/50",
                  ].join(" ")}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <div
                      className={[
                        "flex size-11 shrink-0 items-center justify-center rounded-xl",
                        notification.isRead
                          ? "bg-slate-100 text-slate-600"
                          : "bg-blue-100 text-blue-700",
                      ].join(" ")}
                    >
                      <NotificationIcon
                        type={
                          notification.type
                        }
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="font-semibold text-slate-950">
                              {
                                notification.title
                              }
                            </h2>

                            {!notification.isRead && (
                              <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                                New
                              </span>
                            )}
                          </div>

                          <p className="mt-1 text-xs font-medium text-blue-700">
                            {formatNotificationType(
                              notification.type,
                            )}
                          </p>
                        </div>

                        <time className="shrink-0 text-xs text-slate-500">
                          {formatNotificationDate(
                            notification.createdAt,
                          )}
                        </time>
                      </div>

                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        {
                          notification.message
                        }
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {target && (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() =>
                              openMutation.mutate(
                                notification,
                              )
                            }
                            className="inline-flex h-9 items-center justify-center rounded-lg bg-blue-700 px-3 text-xs font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
                          >
                            Open Record
                          </button>
                        )}

                        {!notification.isRead && (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() =>
                              markReadMutation.mutate(
                                notification.id,
                              )
                            }
                            className="inline-flex h-9 items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                          >
                            {markReadMutation.isPending &&
                            markReadMutation.variables ===
                              notification.id ? (
                              <LoaderCircle
                                size={14}
                                className="animate-spin"
                              />
                            ) : (
                              <Check
                                size={14}
                              />
                            )}

                            Mark Read
                          </button>
                        )}

                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() =>
                            deleteNotification(
                              notification,
                            )
                          }
                          className="inline-flex h-9 items-center gap-2 rounded-lg border border-red-200 bg-white px-3 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                          {deleteMutation.isPending &&
                          deleteMutation.variables ===
                            notification.id ? (
                            <LoaderCircle
                              size={14}
                              className="animate-spin"
                            />
                          ) : (
                            <Trash2
                              size={14}
                            />
                          )}

                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            },
          )}
        </section>
      )}

      {pagination &&
        pagination.totalPages > 1 && (
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
              Page {pagination.page} of{" "}
              {pagination.totalPages}
            </span>

            <button
              type="button"
              disabled={
                page >=
                  pagination.totalPages ||
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
  );
}

function SummaryCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-slate-500">
          {label}
        </p>

        <span className="rounded-xl bg-blue-50 p-2 text-blue-700">
          {icon}
        </span>
      </div>

      <p className="mt-4 text-3xl font-bold text-slate-950">
        {value}
      </p>
    </article>
  );
}

function NotificationIcon({
  type,
}: {
  type: NotificationType;
}) {
  switch (type) {
    case "LEAD_CREATED":
      return <UserPlus size={20} />;

    case "VIEWING_REQUESTED":
    case "VIEWING_UPDATED":
      return (
        <CalendarDays size={20} />
      );

    case "REVENUE_CREATED":
      return (
        <PhilippinePeso
          size={20}
        />
      );

    case "PROPERTY_UPDATED":
      return <Building2 size={20} />;

    case "ACCOUNT_APPROVED":
    case "ACCOUNT_REJECTED":
      return (
        <CircleUserRound
          size={20}
        />
      );

    case "GENERAL":
      return <Megaphone size={20} />;
  }
}
