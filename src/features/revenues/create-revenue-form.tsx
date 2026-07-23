"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  ArrowLeft,
  Calculator,
  LoaderCircle,
  Save,
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
} from "./revenues-types";
import {
  formatRevenueMoney,
  getRevenueErrorMessage,
  toRevenueNumber,
} from "./revenues-utils";

function getLocalDateInputValue(): string {
  const now = new Date();

  const timezoneOffset =
    now.getTimezoneOffset() *
    60_000;

  return new Date(
    now.getTime() -
      timezoneOffset,
  )
    .toISOString()
    .slice(0, 10);
}

export function CreateRevenueForm() {
  const router = useRouter();

  const queryClient =
    useQueryClient();

  const [propertyId, setPropertyId] =
    useState("");

  const [leadId, setLeadId] =
    useState("");

  const [
    grossSaleAmount,
    setGrossSaleAmount,
  ] = useState("");

  const [
    commissionRate,
    setCommissionRate,
  ] = useState("");

  const [
    paymentReceived,
    setPaymentReceived,
  ] = useState("0");

  const [
    commissionStatus,
    setCommissionStatus,
  ] =
    useState<RevenueCommissionStatus>(
      "PENDING",
    );

  const [
    maximumSaleDate,
  ] = useState(
    getLocalDateInputValue,
  );

  const [saleDate, setSaleDate] =
    useState(
      maximumSaleDate,
    );

  const [notes, setNotes] =
    useState("");

  const [
    validationError,
    setValidationError,
  ] = useState<string | null>(
    null,
  );

  const propertiesQuery =
    useQuery({
      queryKey: [
        "properties",
        "revenue-options",
      ],

      queryFn: () =>
        revenuesService
          .propertyOptions(),
    });

  const leadsQuery = useQuery({
    queryKey: [
      "leads",
      "revenue-options",
    ],

    queryFn: () =>
      revenuesService
        .leadOptions(),
  });

  const createMutation =
    useMutation({
      mutationFn: () =>
        revenuesService.create({
          propertyId,

          ...(leadId
            ? { leadId }
            : {}),

          grossSaleAmount:
            Number(
              grossSaleAmount,
            ),

          commissionRate:
            Number(
              commissionRate,
            ),

          paymentReceived:
            Number(
              paymentReceived ||
                0,
            ),

          commissionStatus,

          saleDate: new Date(
            `${saleDate}T12:00:00`,
          ).toISOString(),

          notes:
            notes.trim() ||
            undefined,
        }),

      onSuccess: async (
        revenue,
      ) => {
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

        router.replace(
          `/dashboard/revenues/${revenue.id}`,
        );
      },
    });

  const gross =
    Number(
      grossSaleAmount,
    ) || 0;

  const rate =
    Number(
      commissionRate,
    ) || 0;

  const commissionPreview =
    gross * (rate / 100);

  function selectProperty(
    selectedId: string,
  ) {
    setPropertyId(selectedId);

    const property =
      propertiesQuery.data?.find(
        (item) =>
          item.id === selectedId,
      );

    if (
      property &&
      !grossSaleAmount
    ) {
      setGrossSaleAmount(
        String(
          toRevenueNumber(
            property.price,
          ),
        ),
      );
    }
  }

  function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setValidationError(null);
    createMutation.reset();

    const grossValue =
      Number(
        grossSaleAmount,
      );

    const rateValue =
      Number(
        commissionRate,
      );

    const paymentValue =
      Number(
        paymentReceived || 0,
      );

    if (!propertyId) {
      setValidationError(
        "Select a property.",
      );
      return;
    }

    if (
      !Number.isFinite(
        grossValue,
      ) ||
      grossValue <= 0
    ) {
      setValidationError(
        "Gross sale amount must be greater than zero.",
      );
      return;
    }

    if (
      !Number.isFinite(
        rateValue,
      ) ||
      rateValue < 0 ||
      rateValue > 100
    ) {
      setValidationError(
        "Commission rate must be between 0 and 100.",
      );
      return;
    }

    if (
      !Number.isFinite(
        paymentValue,
      ) ||
      paymentValue < 0
    ) {
      setValidationError(
        "Payment received must not be negative.",
      );
      return;
    }

    if (
      paymentValue >
      grossValue
    ) {
      setValidationError(
        "Payment received must not exceed the gross sale amount.",
      );
      return;
    }

    if (!saleDate) {
      setValidationError(
        "Sale date is required.",
      );
      return;
    }

    if (
      saleDate >
      maximumSaleDate
    ) {
      setValidationError(
        "Sale date must not be in the future.",
      );
      return;
    }

    createMutation.mutate();
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <Link
          href="/dashboard/revenues"
          className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700"
        >
          <ArrowLeft size={16} />
          Back to Revenue
        </Link>

        <h1 className="mt-4 text-2xl font-bold text-slate-950">
          New Revenue Record
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Record a property sale and
          calculate its commission.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="grid gap-5 md:grid-cols-2">
          <label className="space-y-2 md:col-span-2">
            <span className="block text-sm font-medium text-slate-700">
              Property
            </span>

            <select
              value={propertyId}
              onChange={(event) =>
                selectProperty(
                  event.target.value,
                )
              }
              disabled={
                createMutation.isPending ||
                propertiesQuery.isLoading
              }
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm"
            >
              <option value="">
                Select property
              </option>

              {propertiesQuery.data?.map(
                (property) => (
                  <option
                    key={property.id}
                    value={property.id}
                  >
                    {property.title}
                    {" — "}
                    {formatRevenueMoney(
                      property.price,
                    )}
                    {" — "}
                    {property.status}
                  </option>
                ),
              )}
            </select>
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="block text-sm font-medium text-slate-700">
              Related lead
            </span>

            <select
              value={leadId}
              onChange={(event) =>
                setLeadId(
                  event.target.value,
                )
              }
              disabled={
                createMutation.isPending ||
                leadsQuery.isLoading
              }
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm"
            >
              <option value="">
                No related lead
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
                      .filter(Boolean)
                      .join(" ")}
                    {" — "}
                    {lead.phone}
                    {" — "}
                    {lead.status}
                  </option>
                ),
              )}
            </select>

            <p className="text-xs text-slate-500">
              A lead can be connected
              to only one revenue
              record.
            </p>
          </label>

          <label className="space-y-2">
            <span className="block text-sm font-medium text-slate-700">
              Gross sale amount
            </span>

            <input
              type="number"
              min="0.01"
              step="0.01"
              value={grossSaleAmount}
              onChange={(event) =>
                setGrossSaleAmount(
                  event.target.value,
                )
              }
              className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm"
            />
          </label>

          <label className="space-y-2">
            <span className="block text-sm font-medium text-slate-700">
              Commission rate (%)
            </span>

            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={commissionRate}
              onChange={(event) =>
                setCommissionRate(
                  event.target.value,
                )
              }
              className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm"
            />
          </label>

          <label className="space-y-2">
            <span className="block text-sm font-medium text-slate-700">
              Total payment received
            </span>

            <input
              type="number"
              min="0"
              step="0.01"
              value={paymentReceived}
              onChange={(event) =>
                setPaymentReceived(
                  event.target.value,
                )
              }
              className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm"
            />
          </label>

          <label className="space-y-2">
            <span className="block text-sm font-medium text-slate-700">
              Commission status
            </span>

            <select
              value={
                commissionStatus
              }
              onChange={(event) =>
                setCommissionStatus(
                  event.target.value as RevenueCommissionStatus,
                )
              }
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm"
            >
              <option value="PENDING">
                Pending
              </option>

              <option value="RELEASED">
                Released
              </option>
            </select>
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="block text-sm font-medium text-slate-700">
              Sale date
            </span>

            <input
              type="date"
              value={saleDate}
              max={maximumSaleDate}
              onChange={(event) =>
                setSaleDate(
                  event.target.value,
                )
              }
              className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm"
            />
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="block text-sm font-medium text-slate-700">
              Notes
            </span>

            <textarea
              rows={5}
              maxLength={2000}
              value={notes}
              onChange={(event) =>
                setNotes(
                  event.target.value,
                )
              }
              placeholder="Payment terms, client details, or commission notes."
              className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm"
            />

            <p className="text-right text-xs text-slate-400">
              {notes.length}/2000
            </p>
          </label>
        </div>

        <div className="mt-6 rounded-2xl bg-slate-50 p-5">
          <div className="flex items-center gap-2">
            <Calculator
              size={18}
              className="text-emerald-700"
            />

            <h2 className="font-semibold text-slate-900">
              Commission Preview
            </h2>
          </div>

          <p className="mt-3 text-2xl font-bold text-slate-950">
            {formatRevenueMoney(
              commissionPreview,
            )}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Gross sale × commission
            rate
          </p>
        </div>

        {validationError && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {validationError}
          </div>
        )}

        {createMutation.isError && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {getRevenueErrorMessage(
              createMutation.error,
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={
            createMutation.isPending
          }
          className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
        >
          {createMutation.isPending ? (
            <LoaderCircle
              size={17}
              className="animate-spin"
            />
          ) : (
            <Save size={17} />
          )}

          {createMutation.isPending
            ? "Creating..."
            : "Create Revenue Record"}
        </button>
      </form>
    </div>
  );
}
