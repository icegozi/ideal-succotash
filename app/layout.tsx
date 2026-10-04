import type { Metadata } from "next";

import { AppShell } from "@/components/shared/AppShell";

import "./globals.css";

export const metadata: Metadata = {
  title: { default: "MedStock · Kho dược", template: "%s · MedStock" },
  description: "Quản lý kho dược theo lô, FEFO và truy vết giao dịch.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return <html lang="vi" suppressHydrationWarning><body suppressHydrationWarning><AppShell>{children}</AppShell></body></html>;
}
