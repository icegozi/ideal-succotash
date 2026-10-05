"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { ChevronDown, LogIn, LogOut, Shield, User as UserIcon } from "lucide-react";

import { getCurrentUserAction, logoutAction } from "@/modules/auth/actions/auth.actions";
import type { SanitizedUser } from "@/modules/auth/types/auth.types";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getRoleLabel(role: string): string {
  switch (role) {
    case "ADMIN":
      return "Quản trị viên";
    case "PHARMACIST":
      return "Dược sĩ";
    case "WAREHOUSE_STAFF":
      return "Thủ kho";
    case "VIEWER":
      return "Người xem";
    default:
      return role;
  }
}

export function UserMenu() {
  const [user, setUser] = useState<SanitizedUser | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void (async () => {
      const u = await getCurrentUserAction();
      setUser(u);
    })();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction();
    });
  };

  if (!user) {
    return (
      <div className="user-menu-wrapper" ref={menuRef}>
        <button
          className="profile-button"
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-label="Tài khoản cán bộ"
        >
          <span className="avatar">DS</span>
          <span className="profile-copy">
            <strong>Dược sĩ phát triển</strong>
            <small>Kho Chẵn / Nội trú</small>
          </span>
          <ChevronDown size={15} />
        </button>

        {isOpen && (
          <div className="user-dropdown-menu" role="menu">
            <div className="user-dropdown-header">
              <strong>Chế độ phát triển (Bypass)</strong>
              <small>Chưa đăng nhập tài khoản thực</small>
            </div>
            <Link
              href="/login"
              className="user-dropdown-item"
              onClick={() => setIsOpen(false)}
            >
              <LogIn size={16} />
              <span>Đăng nhập tài khoản</span>
            </Link>
            <Link
              href="/register"
              className="user-dropdown-item"
              onClick={() => setIsOpen(false)}
            >
              <UserIcon size={16} />
              <span>Đăng ký mới</span>
            </Link>
          </div>
        )}
      </div>
    );
  }

  const initials = getInitials(user.name);
  const roleLabel = getRoleLabel(user.role);

  return (
    <div className="user-menu-wrapper" ref={menuRef}>
      <button
        className="profile-button"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label={`Hồ sơ ${user.name}`}
      >
        <span className="avatar">{initials}</span>
        <span className="profile-copy">
          <strong>{user.name}</strong>
          <small>{user.department || roleLabel}</small>
        </span>
        <ChevronDown size={15} />
      </button>

      {isOpen && (
        <div className="user-dropdown-menu" role="menu">
          <div className="user-dropdown-header">
            <strong>{user.name}</strong>
            <small>{user.email}</small>
            <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--brand-primary)" }}>
              <Shield size={12} />
              <span>{roleLabel}</span>
            </div>
          </div>

          <button
            type="button"
            className="user-dropdown-item danger"
            onClick={handleLogout}
            disabled={isPending}
          >
            <LogOut size={16} />
            <span>{isPending ? "Đang đăng xuất…" : "Đăng xuất"}</span>
          </button>
        </div>
      )}
    </div>
  );
}
