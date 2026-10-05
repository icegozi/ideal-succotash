"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Boxes,
  ClipboardList,
  Cross,
  LayoutDashboard,
  LogOut,
  Pill,
  Settings,
  Truck,
  Warehouse,
  X,
} from "lucide-react";

import { getCurrentUserAction, logoutAction } from "@/modules/auth/actions/auth.actions";
import type { SanitizedUser } from "@/modules/auth/types/auth.types";

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
  const [user, setUser] = useState<SanitizedUser | null>(null);

  useEffect(() => {
    if (isOpen) {
      void (async () => {
        const u = await getCurrentUserAction();
        setUser(u);
      })();
    }
  }, [isOpen]);

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
          {user ? (
            <div style={{ marginBottom: 12, paddingBottom: 12, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ color: "#fff", fontWeight: 600, fontSize: 13 }}>{user.name}</div>
              <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 8, wordBreak: "break-all" }}>{user.email}</div>
              <button
                type="button"
                className="nav-item"
                style={{
                  color: "#f87171",
                  width: "100%",
                  background: "rgba(239, 68, 68, 0.1)",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 12px",
                }}
                onClick={() => {
                  onClose();
                  void logoutAction();
                }}
              >
                <LogOut size={16} />
                <span>Đăng xuất</span>
              </button>
            </div>
          ) : (
            <div style={{ marginBottom: 12, paddingBottom: 12, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <Link
                href="/login"
                className="nav-item"
                onClick={onClose}
                style={{
                  color: "var(--brand-primary)",
                  width: "100%",
                  background: "rgba(5, 150, 105, 0.1)",
                  borderRadius: 6,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 12px",
                  textDecoration: "none",
                }}
              >
                <span>Đăng nhập tài khoản</span>
              </Link>
            </div>
          )}

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
