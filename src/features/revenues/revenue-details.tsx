"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  ArrowLeft,
  Building2,
  LoaderCircle,
  Save,
  Trash2,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import {
  useRouter,
} from "next/navigation";
import {
  type FormEvent,
  useState,
} from "react";

import {
  revenuesService,
} from "./revenues-service";
import type {
  RevenueCommissionStatus,
  RevenueRecord,
} from "./revenues-types";
import {
  formatRevenueDate,
  formatRevenueMoney,
  getRevenueErrorMessage,
  toRevenueNumber,
} from "./revenues-utils";

export function RevenueDetails({
  revenueId,
}: {
  revenueId: string;
}) {
  const router = useRouter();

  const queryClient =
    useQueryClient();

  const [paymentInput, setPaymentInput] =
    useState("");

  const [
    validationError,
    setValidationError,
  ] = useState<string | null>(
    null,
  );

  const revenueQuery = useQuery({
    queryKey: [
      "revenues",
      "detail",
      revenueId,
    ],

    queryFn: () =>
      revenuesService.getById(
        revenueId,
      ),
  });

  async function refreshRevenue(
    revenue?: RevenueRecord,
  ) {
    if (revenue) {
      queryClient.setQueryData(
        [
          "revenues",
          "detail",
          revenueId,
        ],
        revenue,
      );
    }

    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: [
          "revenues",
        ],
      }),

      queryClient.invalidateQueries({
        queryKey: [
          "reports",
        ],
      }),

      queryClient.invalidateQueries({
        queryKey: [
          "dashboard",
        ],
      }),
    ]);
  }

  const paymentMutation =
    useMutation({
      mutationFn: (
        paymentReceived: number,
      ) =>
        revenuesService
          .updatePayment(
            revenueId,
            {
              paymentReceived,
            },
          ),

      onSuccess: async (
        revenue,
      ) => {
        setPaymentInput(
          String(
            toRevenueNumber(
              revenue.paymentReceived,
            ),
          ),
        );

        await refreshRevenue(
          revenue,
        );
      },
    });

  const commissionMutation =
    useMutation({
      mutationFn: (
        commissionStatus:
          RevenueCommissionStatus,
      ) =>
        revenuesService
          .updateCommission(
            revenueId,
            {
              commissionStatus,
            },
          ),

      onSuccess: refreshRevenue,
    });

  const deleteMutation =
    useMutation({
      mutationFn: () =>
        revenuesService.delete(
          revenueId,
        ),

      onSuccess: async () => {
        await refreshRevenue();

        router.replace(
          "/dashboard/revenues",
        );

        router.refresh();
      },
    });

  const revenue =
    revenueQuery.data;

  function submitPayment(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setValidationError(null);
    paymentMutation.reset();

    if (!revenue) {
      return;
    }

    const value =
      Number(paymentInput);

    const gross =
      toRevenueNumber(
        revenue.grossSaleAmount,
      );

    if (
      !Number.isFinite(value) ||
      value < 0
    ) {
      setValidationError(
        "Payment received must not be negative.",
      );
      return;
    }

    if (value > gross) {
      setValidationError(
        "Payment received must not exceed the gross sale amount.",
      );
      return;
    }

    paymentMutation.mutate(value);
  }

  function changeCommission(
    status:
      RevenueCommissionStatus,
  ) {
    setValidationError(null);
    commissionMutation.reset();

    commissionMutation.mutate(
      status,
    );
  }

  function deleteRevenue() {
    setValidationError(null);

    if (
      window.confirm(
        "Delete this revenue record permanently?",
      )
    ) {
      deleteMutation.mutate();
    }
  }

  if (revenueQuery.isLoading) {
    return (
      <div className="flex min-h-72 items-center justify-center">
        <LoaderCircle className="animate-spin text-emerald-700" />
      </div>
    );
  }

  if (
    revenueQuery.isError ||
    !revenue
  ) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        {getRevenueErrorMessage(
          revenueQuery.error ??
            new Error(
              "Revenue record not found.",
            ),
        )}
      </div>
    );
  }

  const gross =
    toRevenueNumber(
      revenue.grossSaleAmount,
    );

  const received =
    toRevenueNumber(
      revenue.paymentReceived,
    );

  const receivable =
    Math.max(
      0,
      gross - received,
    );

  const operationError =
    paymentMutation.error ??
    commissionMutation.error ??
    deleteMutation.error;

  const isBusy =
    paymentMutation.isPending ||
    commissionMutation.isPending ||
    deleteMutation.isPending;

  return (
    <div className="space-y-6">
      <header>
        <Link
          href="/dashboard/revenues"
          className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700"
        >
          <ArrowLeft size={16} />
          Back to Revenue
        </Link>

        <div className="mt-4">
          <h1 className="text-2xl font-bold text-slate-950">
            {
              revenue.property
                .title
            }
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Revenue record from{" "}
            {formatRevenueDate(
              revenue.saleDate,
            )}
          </p>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Gross Sale"
          value={formatRevenueMoney(
            revenue.grossSaleAmount,
          )}
        />

        <MetricCard
          label="Payment Received"
          value={formatRevenueMoney(
            revenue.paymentReceived,
          )}
        />

        <MetricCard
          label="Receivable"
          value={formatRevenueMoney(
            receivable,
          )}
        />

        <MetricCard
          label="Commission"
          value={formatRevenueMoney(
            revenue.commissionAmount,
          )}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-slate-950">
              Sale Information
            </h2>

            <dl className="mt-5 grid gap-5 sm:grid-cols-2">
              <Detail
                label="Payment status"
                value={
                  revenue.paymentStatus
                }
              />

              <Detail
                label="Commission status"
                value={
                  revenue.commissionStatus
                }
              />

              <Detail
                label="Commission rate"
                value={`${Number(revenue.commissionRate)}%`}
              />

              <Detail
                label="Sale date"
                value={formatRevenueDate(
                  revenue.saleDate,
                )}
              />

              <Detail
                label="Broker"
                value={`${revenue.broker.firstName} ${revenue.broker.lastName}`}
              />

              <Detail
                label="Broker email"
                value={
                  revenue.broker.email
                }
              />
            </dl>

            {revenue.notes && (
              <div className="mt-6 border-t border-slate-100 pt-5">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Notes
                </p>

                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                  {revenue.notes}
                </p>
              </div>
            )}
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-slate-950">
              Related Records
            </h2>

            <div className="mt-5 grid gap-3">
              <Link
                href={`/dashboard/properties/${revenue.propertyId}`}
                className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 hover:bg-slate-50"
              >
                <Building2 className="text-emerald-700" />

                <div>
                  <p className="font-medium text-slate-900">
                    {
                      revenue.property
                        .title
                    }
                  </p>

                  <p className="text-sm text-slate-500">
                    {
                      revenue.property
                        .city
                    }
                    ,{" "}
                    {
                      revenue.property
                        .province
                    }
                  </p>
                </div>
              </Link>

              {revenue.lead &&
                revenue.leadId && (
                  <Link
                    href={`/dashboard/leads/${revenue.leadId}`}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 hover:bg-slate-50"
                  >
                    <UserRound className="text-emerald-700" />

                    <div>
                      <p className="font-medium text-slate-900">
                        {[
                          revenue.lead
                            .firstName,
                          revenue.lead
                            .lastName,
                        ]
                          .filter(
                            Boolean,
                          )
                          .join(" ")}
                      </p>

                      <p className="text-sm text-slate-500">
                        {
                          revenue.lead
                            .phone
                        }
                      </p>
                    </div>
                  </Link>
                )}
            </div>
          </article>
        </div>

        <aside className="space-y-6">
          <form
            onSubmit={submitPayment}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h2 className="font-semibold text-slate-950">
              Update Payment
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Enter the cumulative
              total payment received,
              not only the latest
              installment.
            </p>

            <label className="mt-5 block space-y-2">
              <span className="text-sm font-medium text-slate-700">
                Total payment received
              </span>

              <input
                type="number"
                min="0"
                max={gross}
                step="0.01"
                value={
                  paymentInput ||
                  String(received)
                }
                onChange={(event) =>
                  setPaymentInput(
                    event.target.value,
                  )
                }
                disabled={isBusy}
                className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm"
              />
            </label>

            <button
              type="submit"
              disabled={isBusy}
              className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 text-sm font-semibold text-white disabled:opacity-50"
            >
              {paymentMutation.isPending ? (
                <LoaderCircle
                  size={17}
                  className="animate-spin"
                />
              ) : (
                <Save size={17} />
              )}

              Save Payment
            </button>
          </form>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-slate-950">
              Commission Status
            </h2>

            <div className="mt-5 grid gap-3">
              <button
                type="button"
                disabled={
                  isBusy ||
                  revenue.commissionStatus ===
                    "PENDING"
                }
                onClick={() =>
                  changeCommission(
                    "PENDING",
                  )
                }
                className="h-11 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 disabled:opacity-40"
              >
                Mark Pending
              </button>

              <button
                type="button"
                disabled={
                  isBusy ||
                  revenue.commissionStatus ===
                    "RELEASED"
                }
                onClick={() =>
                  changeCommission(
                    "RELEASED",
                  )
                }
                className="h-11 rounded-xl bg-blue-700 text-sm font-semibold text-white disabled:opacity-40"
              >
                {commissionMutation.isPending
                  ? "Updating..."
                  : "Mark Released"}
              </button>
            </div>
          </section>

          {(validationError ||
            operationError) && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {validationError ??
                getRevenueErrorMessage(
                  operationError,
                )}
            </div>
          )}

          <button
            type="button"
            disabled={isBusy}
            onClick={deleteRevenue}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-white text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            {deleteMutation.isPending ? (
              <LoaderCircle
                size={17}
                className="animate-spin"
              />
            ) : (
              <Trash2 size={17} />
            )}

            Delete Revenue
          </button>
        </aside>
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">
        {label}
      </p>

      <p className="mt-3 break-words text-2xl font-bold text-slate-950">
        {value}
      </p>
    </article>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </dt>

      <dd className="mt-1 text-sm font-semibold text-slate-800">
        {value}
      </dd>
    </div>
  );
}
