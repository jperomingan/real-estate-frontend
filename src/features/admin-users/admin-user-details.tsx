"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  ArrowLeft,
  Check,
  LoaderCircle,
  Mail,
  Phone,
  ShieldCheck,
  Trash2,
  UserRound,
  UserX,
} from "lucide-react";
import Link from "next/link";
import {
  type ReactNode,
  useEffect,
  useState,
} from "react";
import {
  useRouter,
} from "next/navigation";

import {
  useAuthUser,
} from "@/features/auth/use-auth-user";

import {
  adminUsersService,
} from "./admin-users-service";
import type {
  AdminUserStatus,
} from "./admin-user-types";
import {
  formatAdminUserDate,
  formatAdminUserRole,
  formatAdminUserStatus,
  getAdminUserErrorMessage,
} from "./admin-user-utils";

const STATUS_OPTIONS:
  AdminUserStatus[] = [
    "PENDING",
    "APPROVED",
    "REJECTED",
    "ACTIVE",
    "INACTIVE",
  ];

export function AdminUserDetails({
  userId,
}: {
  userId: string;
}) {
  const router = useRouter();

  const currentUser =
    useAuthUser();

  const queryClient =
    useQueryClient();

  const [
    selectedStatus,
    setSelectedStatus,
  ] =
    useState<AdminUserStatus | "">(
      "",
    );

  const userQuery = useQuery({
    queryKey: [
      "admin-users",
      "detail",
      userId,
    ],

    queryFn: () =>
      adminUsersService.getById(
        userId,
      ),

    enabled:
      currentUser?.role ===
      "ADMIN",
  });

  useEffect(() => {
    if (userQuery.data) {
      setSelectedStatus(
        userQuery.data.status,
      );
    }
  }, [userQuery.data]);

  async function refreshUser() {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: [
          "admin-users",
          "detail",
          userId,
        ],
      }),

      queryClient.invalidateQueries({
        queryKey: [
          "admin-users",
          "list",
        ],
      }),
    ]);
  }

  const approveMutation =
    useMutation({
      mutationFn: () =>
        adminUsersService.approve(
          userId,
        ),

      onSuccess:
        refreshUser,
    });

  const rejectMutation =
    useMutation({
      mutationFn: () =>
        adminUsersService.reject(
          userId,
        ),

      onSuccess:
        refreshUser,
    });

  const statusMutation =
    useMutation({
      mutationFn: (
        status:
          AdminUserStatus,
      ) =>
        adminUsersService
          .updateStatus(
            userId,
            status,
          ),

      onSuccess:
        refreshUser,
    });

  const deleteMutation =
    useMutation({
      mutationFn: () =>
        adminUsersService.delete(
          userId,
        ),

      onSuccess: async () => {
        await queryClient
          .invalidateQueries({
            queryKey: [
              "admin-users",
            ],
          });

        router.replace(
          "/dashboard/admin/users",
        );
      },
    });

  if (
    currentUser &&
    currentUser.role !==
      "ADMIN"
  ) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        Administrator access is
        required.
      </div>
    );
  }

  if (
    userQuery.isLoading ||
    !currentUser
  ) {
    return (
      <div className="flex min-h-72 items-center justify-center">
        <LoaderCircle className="animate-spin text-blue-700" />
      </div>
    );
  }

  if (
    userQuery.isError ||
    !userQuery.data
  ) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        {getAdminUserErrorMessage(
          userQuery.error ??
            new Error(
              "User not found.",
            ),
        )}
      </div>
    );
  }

  const user =
    userQuery.data;

  const isCurrentUser =
    user.id === currentUser.id;

  const operationError =
    approveMutation.error ??
    rejectMutation.error ??
    statusMutation.error ??
    deleteMutation.error;

  function approveUser() {
    if (
      window.confirm(
        `Approve ${user.firstName} ${user.lastName}?`,
      )
    ) {
      approveMutation.mutate();
    }
  }

  function rejectUser() {
    if (
      window.confirm(
        `Reject ${user.firstName} ${user.lastName}?`,
      )
    ) {
      rejectMutation.mutate();
    }
  }

  function updateStatus() {
    if (
      !selectedStatus ||
      selectedStatus ===
        user.status
    ) {
      return;
    }

    const selfWarning =
      isCurrentUser
        ? " This is your own administrator account and changing its status may prevent you from signing in."
        : "";

    const confirmed =
      window.confirm(
        `Change ${user.firstName} ${user.lastName}'s status to ${formatAdminUserStatus(selectedStatus)}?${selfWarning}`,
      );

    if (confirmed) {
      statusMutation.mutate(
        selectedStatus,
      );
    }
  }

  function deleteUser() {
    if (isCurrentUser) {
      return;
    }

    const confirmed =
      window.confirm(
        `Permanently delete ${user.firstName} ${user.lastName}? This action cannot be undone.`,
      );

    if (confirmed) {
      deleteMutation.mutate();
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <Link
          href="/dashboard/admin/users"
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-700"
        >
          <ArrowLeft size={16} />
          Back to User Management
        </Link>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-950">
            {user.firstName}{" "}
            {user.lastName}
          </h1>

          {isCurrentUser && (
            <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
              Your Account
            </span>
          )}
        </div>

        <p className="mt-2 text-sm text-slate-500">
          {formatAdminUserRole(
            user.role,
          )}
          {" · "}
          {formatAdminUserStatus(
            user.status,
          )}
        </p>
      </header>

      {operationError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {getAdminUserErrorMessage(
            operationError,
          )}
        </div>
      )}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="space-y-6">
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <UserRound
                size={19}
                className="text-blue-700"
              />

              <h2 className="font-semibold text-slate-950">
                Account Information
              </h2>
            </div>

            <dl className="mt-6 grid gap-5 sm:grid-cols-2">
              <Detail
                label="First name"
                value={
                  user.firstName
                }
              />

              <Detail
                label="Last name"
                value={
                  user.lastName
                }
              />

              <Detail
                label="Email"
                value={user.email}
                icon={<Mail size={15} />}
              />

              <Detail
                label="Phone"
                value={
                  user.phone ??
                  "Not provided"
                }
                icon={<Phone size={15} />}
              />

              <Detail
                label="Role"
                value={formatAdminUserRole(
                  user.role,
                )}
              />

              <Detail
                label="Status"
                value={formatAdminUserStatus(
                  user.status,
                )}
              />

              <Detail
                label="Registered"
                value={formatAdminUserDate(
                  user.createdAt,
                )}
              />

              <Detail
                label="Last updated"
                value={formatAdminUserDate(
                  user.updatedAt,
                )}
              />
            </dl>

            <div className="mt-6 border-t border-slate-100 pt-5">
              <Detail
                label="User ID"
                value={user.id}
              />
            </div>
          </article>
        </div>

        <aside className="space-y-6">
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <ShieldCheck
                size={19}
                className="text-blue-700"
              />

              <h2 className="font-semibold text-slate-950">
                Account Status
              </h2>
            </div>

            <label className="mt-5 block space-y-2">
              <span className="text-sm font-medium text-slate-700">
                New status
              </span>

              <select
                value={selectedStatus}
                onChange={(event) =>
                  setSelectedStatus(
                    event.target
                      .value as
                      AdminUserStatus,
                  )
                }
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm"
              >
                {STATUS_OPTIONS.map(
                  (status) => (
                    <option
                      key={status}
                      value={status}
                    >
                      {formatAdminUserStatus(
                        status,
                      )}
                    </option>
                  ),
                )}
              </select>
            </label>

            <button
              type="button"
              disabled={
                !selectedStatus ||
                selectedStatus ===
                  user.status ||
                statusMutation
                  .isPending
              }
              onClick={updateStatus}
              className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {statusMutation.isPending && (
                <LoaderCircle
                  size={16}
                  className="animate-spin"
                />
              )}

              Update Status
            </button>

            {user.status ===
              "PENDING" && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={
                    approveMutation
                      .isPending
                  }
                  onClick={approveUser}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 text-sm font-semibold text-emerald-700"
                >
                  <Check size={16} />
                  Approve
                </button>

                <button
                  type="button"
                  disabled={
                    rejectMutation
                      .isPending
                  }
                  onClick={rejectUser}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 text-sm font-semibold text-red-700"
                >
                  <UserX size={16} />
                  Reject
                </button>
              </div>
            )}
          </article>

          <article className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-red-800">
              Delete Account
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Permanently remove this
              user account and its
              access to the system.
            </p>

            {isCurrentUser && (
              <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
                You cannot delete your
                own administrator
                account.
              </p>
            )}

            <button
              type="button"
              disabled={
                isCurrentUser ||
                deleteMutation
                  .isPending
              }
              onClick={deleteUser}
              className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-red-700 px-4 text-sm font-semibold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {deleteMutation.isPending ? (
                <LoaderCircle
                  size={16}
                  className="animate-spin"
                />
              ) : (
                <Trash2 size={16} />
              )}

              Delete User
            </button>
          </article>
        </aside>
      </section>
    </div>
  );
}

function Detail({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </dt>

      <dd className="mt-1 flex items-center gap-2 break-words text-sm font-semibold text-slate-800">
        {icon}
        {value}
      </dd>
    </div>
  );
}
