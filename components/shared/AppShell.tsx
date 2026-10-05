"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Cross } from "lucide-react";

import { AppHeader } from "@/components/shared/AppHeader";
import { SidebarNav } from "@/components/shared/SidebarNav";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute = pathname === "/login" || pathname === "/register";

  if (isAuthRoute) {
    return <div className="auth-shell-root">{children}</div>;
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand" href="/" aria-label="MedStock - Trang chủ">
          <span className="brand-mark">
            <Cross size={20} strokeWidth={2.6} />
          </span>
          <span>
            <strong>MedStock</strong>
            <small>Kho dược bệnh viện</small>
          </span>
        </Link>
        <SidebarNav />
        <div className="sidebar-health">
          <Activity size={18} aria-hidden="true" />
          <span>
            <strong>Oracle 19c+</strong>
            <small>Sẵn sàng kết nối</small>
          </span>
        </div>
      </aside>

      <div className="app-main">
        <AppHeader />
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
