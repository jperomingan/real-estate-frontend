"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Banknote,
  Building2,
  CalendarDays,
  CircleDollarSign,
  LoaderCircle,
  RefreshCw,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";

import { dashboardService } from "./dashboard-service";
import type {
  DashboardSummary,
  StatusCount,
} from "./dashboard-types";

const moneyFormatter =
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  });

function formatMoney(
  value: number,
): string {
  return moneyFormatter.format(
    Number(value || 0),
  );
}

function formatLabel(
  value: string,
): string {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase(),
    );
}

function getErrorMessage(
  error: unknown,
): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to load dashboard data.";
}

interface SummaryCardProps {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
}

function SummaryCard({
  title,
  value,
  description,
  icon: Icon,
}: SummaryCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
            {value}
          </p>

          <p className="mt-2 text-xs text-slate-500">
            {description}
          </p>
        </div>

        <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700">
          <Icon size={22} />
        </div>
      </div>
    </article>
  );
}

interface StatusSectionProps {
  title: string;
  items: StatusCount[];
}

function StatusSection({
  title,
  items,
}: StatusSectionProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-slate-950">
        {title}
      </h2>

      {items.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">
          No records available.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {items.map((item) => (
            <div
              key={item.status}
              className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"
            >
              <span className="text-sm text-slate-700">
                {formatLabel(
                  item.status,
                )}
              </span>

              <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-900 shadow-sm">
                {item.count}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function DashboardContent({
  dashboard,
}: {
  dashboard: DashboardSummary;
}) {
  const mainCards: SummaryCardProps[] = [
    {
      title: "Properties",
      value:
        dashboard.properties.total.toLocaleString(),
      description:
        "Total properties in the system",
      icon: Building2,
    },
    {
      title: "Leads",
      value:
        dashboard.leads.total.toLocaleString(),
      description:
        "Total property inquiries and leads",
      icon: Users,
    },
    {
      title: "Viewings",
      value:
        dashboard.viewings.total.toLocaleString(),
      description:
        "Total viewing appointments",
      icon: CalendarDays,
    },
    {
      title: "Gross Sales",
      value:
        formatMoney(
          dashboard.revenue
            .totalGrossSales,
        ),
      description:
        `${dashboard.revenue.totalRecords} revenue records`,
      icon: CircleDollarSign,
    },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-emerald-700">
            {dashboard.scope ===
            "GLOBAL"
              ? "Global overview"
              : "Broker overview"}
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
            Dashboard
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Property, lead, viewing,
            and revenue performance.
          </p>
        </div>

        <p className="text-sm text-slate-500">
          Role:{" "}
          <span className="font-semibold text-slate-700">
            {formatLabel(
              dashboard.role,
            )}
          </span>
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {mainCards.map((card) => (
          <SummaryCard
            key={card.title}
            {...card}
          />
        ))}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryCard
          title="Commission"
          value={formatMoney(
            dashboard.revenue
              .totalCommission,
          )}
          description="Total expected commission"
          icon={TrendingUp}
        />

        <SummaryCard
          title="Payments Received"
          value={formatMoney(
            dashboard.revenue
              .totalPaymentReceived,
          )}
          description="Total collected payments"
          icon={Banknote}
        />

        <SummaryCard
          title="Receivable"
          value={formatMoney(
            dashboard.revenue
              .totalReceivable,
          )}
          description="Outstanding payment balance"
          icon={CircleDollarSign}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        <StatusSection
          title="Property Status"
          items={
            dashboard.properties
              .byStatus
          }
        />

        <StatusSection
          title="Lead Status"
          items={
            dashboard.leads.byStatus
          }
        />

        <StatusSection
          title="Viewing Status"
          items={
            dashboard.viewings
              .byStatus
          }
        />

        <StatusSection
          title="Payment Status"
          items={
            dashboard.revenue
              .byPaymentStatus
          }
        />
      </section>
    </div>
  );
}

export function DashboardOverview() {
  const {
    data,
    error,
    isError,
    isPending,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: [
      "dashboard",
      "summary",
    ],
    queryFn: () =>
      dashboardService.getSummary({
        recentLimit: 5,
      }),
  });

  if (isPending) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="flex items-center gap-3 text-slate-600">
          <LoaderCircle
            size={22}
            className="animate-spin"
          />

          <span>
            Loading dashboard...
          </span>
        </div>
      </div>
    );
  }

  if (
    isError ||
    !data
  ) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <h1 className="text-xl font-semibold text-red-900">
          Unable to load dashboard
        </h1>

        <p className="mt-2 text-sm text-red-700">
          {getErrorMessage(error)}
        </p>

        <button
          type="button"
          onClick={() => {
            void refetch();
          }}
          disabled={isFetching}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          <RefreshCw
            size={16}
            className={
              isFetching
                ? "animate-spin"
                : ""
            }
          />

          Try again
        </button>
      </div>
    );
  }

  return (
    <DashboardContent
      dashboard={data}
    />
  );
}
