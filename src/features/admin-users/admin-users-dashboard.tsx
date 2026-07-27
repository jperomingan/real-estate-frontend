"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  ArrowRight,
  Check,
  LoaderCircle,
  RotateCcw,
  Search,
  ShieldCheck,
  UserCheck,
  UserRound,
  UserX,
  Users,
} from "lucide-react";
import Link from "next/link";
import {
  type FormEvent,
  type ReactNode,
  useState,
} from "react";

import {
  useAuthUser,
} from "@/features/auth/use-auth-user";

import {
  adminUsersService,
} from "./admin-users-service";
import type {
  AdminUser,
  AdminUserRole,
  AdminUserStatus,
} from "./admin-user-types";
import {
  formatAdminUserDate,
  formatAdminUserRole,
  formatAdminUserStatus,
  getAdminUserErrorMessage,
} from "./admin-user-utils";

type RoleFilter =
  | AdminUserRole
  | "ALL";

type StatusFilter =
  | AdminUserStatus
  | "ALL";

const ROLE_OPTIONS:
  Array<{
    value: RoleFilter;
    label: string;
  }> = [
    {
      value: "ALL",
      label: "All roles",
    },
    {
      value: "ADMIN",
      label: "Administrators",
    },
    {
      value: "BROKER",
      label: "Brokers",
    },
    {
      value: "CLIENT",
      label: "Clients",
    },
  ];

const STATUS_OPTIONS:
  Array<{
    value: StatusFilter;
    label: string;
  }> = [
    {
      value: "ALL",
      label: "All statuses",
    },
    {
      value: "PENDING",
      label: "Pending",
    },
    {
      value: "APPROVED",
      label: "Approved",
    },
    {
      value: "REJECTED",
      label: "Rejected",
    },
    {
      value: "ACTIVE",
      label: "Active",
    },
    {
      value: "INACTIVE",
      label: "Inactive",
    },
  ];

const STATUS_CLASSES: Record<
  AdminUserStatus,
  string
> = {
  PENDING:
    "bg-amber-50 text-amber-700 ring-amber-200",

  APPROVED:
    "bg-blue-50 text-blue-700 ring-blue-200",

  REJECTED:
    "bg-red-50 text-red-700 ring-red-200",

  ACTIVE:
    "bg-emerald-50 text-emerald-700 ring-emerald-200",

  INACTIVE:
    "bg-slate-100 text-slate-700 ring-slate-200",
};

export function AdminUsersDashboard() {
  const currentUser =
    useAuthUser();

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

  const [role, setRole] =
    useState<RoleFilter>("ALL");

  const [status, setStatus] =
    useState<StatusFilter>("ALL");

  const usersQuery = useQuery({
    queryKey: [
      "admin-users",
      "list",
      {
        page,
        appliedSearch,
        role,
        status,
      },
    ],

    queryFn: () =>
      adminUsersService.list({
        page,
        limit: 10,

        ...(appliedSearch
          ? {
              search:
                appliedSearch,
            }
          : {}),

        ...(role !== "ALL"
          ? { role }
          : {}),

        ...(status !== "ALL"
          ? { status }
          : {}),
      }),

    enabled:
      currentUser?.role ===
      "ADMIN",
  });

  async function refreshUsers() {
    await queryClient.invalidateQueries({
      queryKey: [
        "admin-users",
      ],
    });
  }

  const approveMutation =
    useMutation({
      mutationFn: (
        id: string,
      ) =>
        adminUsersService
          .approve(id),

      onSuccess:
        refreshUsers,
    });

  const rejectMutation =
    useMutation({
      mutationFn: (
        id: string,
      ) =>
        adminUsersService
          .reject(id),

      onSuccess:
        refreshUsers,
    });

  const items =
    usersQuery.data?.items ?? [];

  const pagination =
    usersQuery.data
      ?.pagination;

  const pendingCount =
    items.filter(
      (user) =>
        user.status ===
        "PENDING",
    ).length;

  const activeCount =
    items.filter(
      (user) =>
        user.status ===
        "ACTIVE",
    ).length;

  const operationError =
    approveMutation.error ??
    rejectMutation.error;

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
    setRole("ALL");
    setStatus("ALL");
    setPage(1);
  }

  function approveUser(
    user: AdminUser,
  ) {
    const confirmed =
      window.confirm(
        `Approve ${user.firstName} ${user.lastName}?`,
      );

    if (confirmed) {
      approveMutation.mutate(
        user.id,
      );
    }
  }

  function rejectUser(
    user: AdminUser,
  ) {
    const confirmed =
      window.confirm(
        `Reject ${user.firstName} ${user.lastName}?`,
      );

    if (confirmed) {
      rejectMutation.mutate(
        user.id,
      );
    }
  }

  if (
    currentUser &&
    currentUser.role !==
      "ADMIN"
  ) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <h1 className="font-semibold text-red-800">
          Access denied
        </h1>

        <p className="mt-2 text-sm text-red-700">
          Administrator access is
          required to manage users.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">
          User Management
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Review registrations,
          approve accounts, and
          manage user access.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          label="Matching Users"
          value={
            pagination?.total ?? 0
          }
          icon={
            <Users size={20} />
          }
        />

        <SummaryCard
          label="Pending on Page"
          value={pendingCount}
          icon={
            <UserCheck
              size={20}
            />
          }
        />

        <SummaryCard
          label="Active on Page"
          value={activeCount}
          icon={
            <ShieldCheck
              size={20}
            />
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
                placeholder="Name or email"
                className="h-11 w-full rounded-xl border border-slate-300 pl-10 pr-3 text-sm"
              />
            </div>
          </label>

          <label className="space-y-2">
            <span className="block text-sm font-medium text-slate-700">
              Role
            </span>

            <select
              value={role}
              onChange={(event) => {
                setRole(
                  event.target
                    .value as
                    RoleFilter,
                );

                setPage(1);
              }}
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm"
            >
              {ROLE_OPTIONS.map(
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
              Status
            </span>

            <select
              value={status}
              onChange={(event) => {
                setStatus(
                  event.target
                    .value as
                    StatusFilter,
                );

                setPage(1);
              }}
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm"
            >
              {STATUS_OPTIONS.map(
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

          <button
            type="submit"
            className="h-11 self-end rounded-xl bg-blue-700 px-5 text-sm font-semibold text-white hover:bg-blue-800"
          >
            Apply
          </button>

          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex h-11 items-center justify-center gap-2 self-end rounded-xl border border-slate-300 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RotateCcw size={16} />
            Reset
          </button>
        </div>
      </form>

      {operationError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {getAdminUserErrorMessage(
            operationError,
          )}
        </div>
      )}

      {usersQuery.isLoading ||
      !currentUser ? (
        <div className="flex min-h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <LoaderCircle className="animate-spin text-blue-700" />
        </div>
      ) : usersQuery.isError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {getAdminUserErrorMessage(
            usersQuery.error,
          )}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <UserRound className="mx-auto text-slate-400" />

          <h2 className="mt-4 font-semibold text-slate-900">
            No users found
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Adjust the search or
            account filters.
          </p>
        </div>
      ) : (
        <section className="space-y-3">
          {items.map((user) => {
            const isCurrentUser =
              user.id ===
              currentUser.id;

            const isBusy =
              (
                approveMutation
                  .isPending &&
                approveMutation
                  .variables ===
                  user.id
              ) ||
              (
                rejectMutation
                  .isPending &&
                rejectMutation
                  .variables ===
                  user.id
              );

            return (
              <article
                key={user.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold text-slate-950">
                        {user.firstName}{" "}
                        {user.lastName}
                      </h2>

                      {isCurrentUser && (
                        <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
                          Your Account
                        </span>
                      )}

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${STATUS_CLASSES[user.status]}`}
                      >
                        {formatAdminUserStatus(
                          user.status,
                        )}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-slate-600">
                      {user.email}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {formatAdminUserRole(
                        user.role,
                      )}
                      {" · Registered "}
                      {formatAdminUserDate(
                        user.createdAt,
                      )}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {user.status ===
                      "PENDING" && (
                      <>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() =>
                            approveUser(
                              user,
                            )
                          }
                          className="inline-flex h-10 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                        >
                          <Check size={16} />
                          Approve
                        </button>

                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() =>
                            rejectUser(
                              user,
                            )
                          }
                          className="inline-flex h-10 items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                        >
                          <UserX size={16} />
                          Reject
                        </button>
                      </>
                    )}

                    <Link
                      href={`/dashboard/admin/users/${user.id}`}
                      className="inline-flex h-10 items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 text-sm font-semibold text-blue-700 hover:bg-blue-100"
                    >
                      Details
                      <ArrowRight
                        size={16}
                      />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {pagination &&
        pagination.totalPages >
          1 && (
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 text-sm">
            <button
              type="button"
              disabled={
                page <= 1 ||
                usersQuery.isFetching
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
                usersQuery.isFetching
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
