"use client";

import {
  useQuery,
} from "@tanstack/react-query";
import {
  Bell,
} from "lucide-react";
import Link from "next/link";

import {
  notificationsService,
} from "./notifications-service";

export function NotificationBell() {
  const unreadQuery = useQuery({
    queryKey: [
      "notifications",
      "unread-count",
    ],

    queryFn: () =>
      notificationsService
        .unreadCount(),

    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });

  const unreadCount =
    unreadQuery.data ?? 0;

  return (
    <Link
      href="/dashboard/notifications"
      aria-label={
        unreadCount > 0
          ? `${unreadCount} unread notifications`
          : "Notifications"
      }
      className="relative inline-flex size-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
    >
      <Bell size={20} />

      {unreadCount > 0 && (
        <span className="absolute -right-1.5 -top-1.5 flex min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold leading-4 text-white">
          {unreadCount > 99
            ? "99+"
            : unreadCount}
        </span>
      )}
    </Link>
  );
}
