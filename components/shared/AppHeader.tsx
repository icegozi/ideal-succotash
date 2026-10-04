"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, ChevronDown, Cross, Menu, Search } from "lucide-react";

import { MobileNavDrawer } from "@/components/shared/MobileNavDrawer";

export function AppHeader() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <header className="topbar">
        <div className="topbar-left">
          <button
            type="button"
            className="mobile-nav-toggle"
            onClick={() => setDrawerOpen(true)}
            aria-label="Mở menu điều hướng"
            aria-expanded={drawerOpen}
          >
            <Menu size={22} />
          </button>

          <Link href="/" className="mobile-brand" aria-label="MedStock - Trang chủ">
            <span className="brand-mark">
              <Cross size={18} strokeWidth={2.4} />
            </span>
            <span className="mobile-brand-title">MedStock</span>
          </Link>

          <div className="global-search" aria-label="Tìm kiếm toàn cục">
            <Search size={17} aria-hidden="true" />
            <span>Tìm thuốc, lô, phiếu…</span>
            <kbd>⌘ K</kbd>
          </div>
        </div>

        <div className="topbar-actions">
          <button className="icon-button" type="button" aria-label="Thông báo hệ thống">
            <Bell size={19} />
          </button>
          <button className="profile-button" type="button" aria-label="Hồ sơ người dùng">
            <span className="avatar">DS</span>
            <span className="profile-copy">
              <strong>Dược sĩ</strong>
              <small>Kho Chẵn / Nội trú</small>
            </span>
            <ChevronDown size={15} />
          </button>
        </div>
      </header>

      <MobileNavDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
