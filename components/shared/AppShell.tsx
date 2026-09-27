import type { ReactNode } from "react";
import Link from "next/link";
import { Activity, Bell, ChevronDown, Cross, Search } from "lucide-react";

import { SidebarNav } from "@/components/shared/SidebarNav";

export function AppShell({ children }: { children: ReactNode }) {
  return <div className="app-shell">
    <aside className="sidebar">
      <Link className="brand" href="/" aria-label="MedStock - Trang chủ"><span className="brand-mark"><Cross size={20} strokeWidth={2.6} /></span><span><strong>MedStock</strong><small>Kho dược bệnh viện</small></span></Link>
      <SidebarNav />
      <div className="sidebar-health"><Activity size={18} aria-hidden="true" /><span><strong>Oracle 19c+</strong><small>Sẵn sàng kết nối</small></span></div>
    </aside>
    <div className="app-main"><header className="topbar"><div className="mobile-brand"><span className="brand-mark"><Cross size={18} /></span> MedStock</div><div className="global-search" aria-label="Tìm kiếm toàn cục chưa khả dụng"><Search size={17} aria-hidden="true" /><span>Tìm thuốc, lô, phiếu…</span><kbd>⌘ K</kbd></div><div className="topbar-actions"><button className="icon-button" type="button" aria-label="Thông báo"><Bell size={19} /></button><button className="profile-button" type="button"><span className="avatar">DS</span><span className="profile-copy"><strong>Dược sĩ</strong><small>Môi trường phát triển</small></span><ChevronDown size={15} /></button></div></header><main className="content">{children}</main></div>
  </div>;
}
