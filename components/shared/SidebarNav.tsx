"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Boxes, ClipboardList, LayoutDashboard, Pill, Settings, Truck, Warehouse } from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  disabled?: boolean;
};

const primary: NavItem[] = [
  { href: "/", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/medicines", label: "Danh mục thuốc", icon: Pill },
  { href: "/inventory", label: "Tồn kho", icon: Boxes },
  { href: "/stock-in", label: "Nhập kho", icon: Truck },
  { href: "/stock-out", label: "Xuất kho", icon: ClipboardList },
];

export function SidebarNav() {
  const pathname = usePathname();
  return (
    <nav className="sidebar-nav" aria-label="Điều hướng chính">
      <p className="nav-label">Vận hành</p>
      {primary.map(({ href, label, icon: Icon, disabled }) => {
        const active =
          href === "/"
            ? pathname === "/"
            : pathname.startsWith(href) ||
              (href === "/stock-in" && pathname.startsWith("/receipts")) ||
              (href === "/stock-out" && pathname.startsWith("/issues"));

        if (disabled) {
          return (
            <span className="nav-item disabled" key={href}>
              <Icon size={18} />
              {label}
              <small>Sắp có</small>
            </span>
          );
        }
        return (
          <Link
            className={`nav-item ${active ? "active" : ""}`}
            href={href}
            key={href}
          >
            <Icon size={18} />
            {label}
          </Link>
        );
      })}
      <p className="nav-label nav-label-spaced">Hệ thống</p>
      <span className="nav-item disabled">
        <Warehouse size={18} />
        Danh mục chung
        <small>Sắp có</small>
      </span>
      <span className="nav-item disabled">
        <Settings size={18} />
        Cấu hình
        <small>Sắp có</small>
      </span>
    </nav>
  );
}
