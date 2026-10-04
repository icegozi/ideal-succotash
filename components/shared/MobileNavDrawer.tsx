"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Boxes,
  ClipboardList,
  Cross,
  LayoutDashboard,
  Pill,
  Settings,
  Truck,
  Warehouse,
  X,
} from "lucide-react";

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { href: "/", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/medicines", label: "Danh mục thuốc", icon: Pill },
  { href: "/inventory", label: "Tồn kho", icon: Boxes },
  { href: "/stock-in", label: "Nhập kho", icon: Truck },
  { href: "/stock-out", label: "Xuất kho (FEFO)", icon: ClipboardList },
];

export function MobileNavDrawer({ isOpen, onClose }: MobileNavDrawerProps) {
  const pathname = usePathname();

  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="mobile-drawer-root" role="dialog" aria-modal="true" aria-label="Menu điều hướng di động">
      <div className="mobile-drawer-backdrop" onClick={onClose} aria-hidden="true" />
      <aside className="mobile-drawer-panel">
        <div className="mobile-drawer-header">
          <Link className="brand" href="/" onClick={onClose} aria-label="MedStock - Trang chủ">
            <span className="brand-mark">
              <Cross size={20} strokeWidth={2.6} />
            </span>
            <span>
              <strong>MedStock</strong>
              <small>Kho dược bệnh viện</small>
            </span>
          </Link>
          <button
            type="button"
            className="mobile-drawer-close"
            onClick={onClose}
            aria-label="Đóng menu điều hướng"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="mobile-drawer-nav" aria-label="Điều hướng chính di động">
          <p className="nav-label">Phân hệ vận hành</p>
          {navItems.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/"
                ? pathname === "/"
                : pathname.startsWith(href) ||
                  (href === "/stock-in" && pathname.startsWith("/receipts")) ||
                  (href === "/stock-out" && pathname.startsWith("/issues"));

            return (
              <Link
                key={href}
                href={href}
                className={`nav-item ${active ? "active" : ""}`}
                onClick={onClose}
              >
                <Icon size={19} />
                <span>{label}</span>
              </Link>
            );
          })}

          <p className="nav-label nav-label-spaced">Hệ thống</p>
          <span className="nav-item disabled">
            <Warehouse size={18} />
            <span>Danh mục chung</span>
            <small>Sắp có</small>
          </span>
          <span className="nav-item disabled">
            <Settings size={18} />
            <span>Cấu hình</span>
            <small>Sắp có</small>
          </span>
        </nav>

        <div className="mobile-drawer-footer">
          <div className="sidebar-health">
            <Activity size={18} aria-hidden="true" />
            <span>
              <strong>Oracle 19c+</strong>
              <small>Sẵn sàng kết nối</small>
            </span>
          </div>
        </div>
      </aside>
    </div>
  );
}
