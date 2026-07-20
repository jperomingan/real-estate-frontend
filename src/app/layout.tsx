import type { Metadata } from "next";
import type { ReactNode } from "react";

import { QueryProvider } from "@/providers/query-provider";

import "./globals.css";

export const metadata: Metadata = {
    title: "Real Estate Management System",
    description:
        "Manage properties, leads, viewings, follow-ups, and reports.",
};

interface RootLayoutProps {
    children: ReactNode;
}

export default function RootLayout({
    children,
}: Readonly<RootLayoutProps>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body suppressHydrationWarning>
                <QueryProvider>{children}</QueryProvider>
            </body>
        </html>
    );
}
