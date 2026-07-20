import Link from "next/link";
import {
  Building2,
  CalendarDays,
  ChartNoAxesCombined,
  Users,
} from "lucide-react";

const modules = [
  {
    title: "Properties",
    description: "Manage property listings and availability.",
    icon: Building2,
  },
  {
    title: "Leads",
    description: "Track prospective buyers and clients.",
    icon: Users,
  },
  {
    title: "Viewings",
    description: "Manage property viewing appointments.",
    icon: CalendarDays,
  },
  {
    title: "Reports",
    description: "Review performance and sales analytics.",
    icon: ChartNoAxesCombined,
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-blue-600 text-white">
              <Building2 size={24} />
            </div>

            <div>
              <h1 className="font-semibold text-slate-950">
                Real Estate Management System
              </h1>

              <p className="text-sm text-slate-500">
                Lead Tracking and Property Management
              </p>
            </div>
          </div>

          <Link
            href="/dashboard"
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            Open Dashboard
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="max-w-3xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-blue-600">
            Management platform
          </p>

          <h2 className="text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
            Manage your real estate operations in one place.
          </h2>

          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
            Organize properties, monitor leads, schedule viewings, manage
            follow-ups, and review business performance.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {modules.map((module) => {
            const Icon = module.icon;

            return (
              <article
                key={module.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="mb-5 flex size-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Icon size={22} />
                </div>

                <h3 className="font-semibold text-slate-950">
                  {module.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {module.description}
                </p>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
