import type { ReactNode } from "react";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AuthGuard } from "@/features/auth/auth-guard";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({
  children,
}: Readonly<DashboardLayoutProps>) {
  return (
    <AuthGuard>
      <DashboardShell>{children}</DashboardShell>
    </AuthGuard>
  );
}
