"use client";

import {
  Bell,
  Building2,
  CalendarDays,
  ChartNoAxesCombined,
  ClipboardCheck,
  LayoutDashboard,
  LogOut,
  PhilippinePeso,
  Users,
} from "lucide-react";
import Link from "next/link";
import {
  usePathname,
  useRouter,
} from "next/navigation";
import type {
  ReactNode,
} from "react";

import {
  authStorage,
} from "@/features/auth/auth-storage";
import {
  NotificationBell,
} from "@/features/notifications/notification-bell";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Notifications",
    href: "/dashboard/notifications",
    icon: Bell,
  },
  {
    name: "Properties",
    href: "/dashboard/properties",
    icon: Building2,
  },
  {
    name: "Leads",
    href: "/dashboard/leads",
    icon: Users,
  },
  {
    name: "Viewings",
    href: "/dashboard/viewings",
    icon: CalendarDays,
  },
  {
    name: "Follow-ups",
    href: "/dashboard/follow-ups",
    icon: ClipboardCheck,
  },
  {
    name: "Reports",
    href: "/dashboard/reports",
    icon: ChartNoAxesCombined,
  },
  {
    name: "Revenue",
    href: "/dashboard/revenues",
    icon: PhilippinePeso,
  },
];

interface DashboardShellProps {
  children: ReactNode;
}

export function DashboardShell({
  children,
}: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    authStorage.clear();
    router.replace("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white lg:flex lg:flex-col">
        <div className="flex h-20 items-center gap-3 border-b border-slate-200 px-6">
          <div className="flex size-10 items-center justify-center rounded-xl bg-blue-600 text-white">
            <Building2 size={22} />
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-950">
              Real Estate
            </p>

            <p className="text-xs text-slate-500">
              Management System
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {navigation.map((item) => {
            const Icon = item.icon;

            const isActive =
              pathname === item.href ||
              (
                item.href !== "/dashboard" &&
                pathname.startsWith(
                  `${item.href}/`,
                )
              );

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition",
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
                ].join(" ")}
              >
                <Icon size={19} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-200 p-4">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-red-50 hover:text-red-700"
          >
            <LogOut size={19} />
            Sign out
          </button>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-20 items-center justify-between gap-4 border-b border-slate-200 bg-white/90 px-6 backdrop-blur">
          <div>
            <p className="font-semibold text-slate-950">
              Real Estate Management System
            </p>

            <p className="text-sm text-slate-500">
              Lead Tracking Dashboard
            </p>
          </div>

          <NotificationBell />
        </header>

        <main className="p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
