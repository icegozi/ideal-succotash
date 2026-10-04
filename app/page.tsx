import Link from "next/link";
import { ArrowRight, Boxes, CircleAlert, ClipboardCheck, PackageCheck, Pill, ShieldCheck } from "lucide-react";
import { connection } from "next/server";

import { isDemoDataMode } from "@/modules/medicines/repositories";
import { getInventoryService } from "@/modules/inventory/services";

export default async function DashboardPage() {
  await connection();
  const demo = isDemoDataMode();
  const metrics = await getInventoryService().getDashboardMetrics();

  const cards = [
    { label: "Tổng loại thuốc", value: `${metrics.totalMedicineCount} loại`, note: "Trong danh mục theo dõi", icon: Pill, href: "/inventory" },
    { label: "Lô thuốc còn tồn", value: `${metrics.totalBatchCount} lô`, note: "Đang lưu tại các kho", icon: Boxes, href: "/inventory" },
    { label: "Lô sắp hết hạn", value: `${metrics.nearExpiryBatchCount} lô`, note: "Cảnh báo trong 90 ngày", icon: CircleAlert, href: "/inventory?expiryStatus=NEAR_EXPIRY" },
    { label: "Lô đã hết hạn", value: `${metrics.expiredBatchCount} lô`, note: "Khóa xuất khả dụng", icon: ShieldCheck, href: "/inventory?expiryStatus=EXPIRED" },
  ];

  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">Tổng quan vận hành</p>
          <h1 className="hero-title">Kho dược an toàn, rõ từng lô thuốc.</h1>
          <p className="hero-copy">
            Nền tảng quản lý tồn theo FEFO, biệt trữ, thu hồi và sổ giao dịch bất biến trên Oracle.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, zIndex: 1, flexWrap: "wrap" }}>
          <Link className="btn btn-primary" href="/inventory" style={{ minHeight: 42, padding: "0 18px" }}>
            Tra cứu tồn kho <ArrowRight size={16} aria-hidden="true" />
          </Link>
          <Link
            className="btn btn-secondary"
            href="/stock-out/new"
            style={{
              minHeight: 42,
              padding: "0 18px",
              background: "rgba(255, 255, 255, 0.16)",
              color: "white",
              borderColor: "rgba(255, 255, 255, 0.35)",
            }}
          >
            Xuất kho (FEFO)
          </Link>
        </div>
      </section>

      {demo ? (
        <div className="notice notice-info" role="status">
          <PackageCheck size={19} aria-hidden="true" />
          <div>
            <strong>Đang dùng dữ liệu demo cục bộ.</strong>
            <span>Hệ thống đã kích hoạt đầy đủ 3 module Tồn kho, Nhập kho và Xuất kho FEFO.</span>
          </div>
        </div>
      ) : null}

      <section className="metric-grid" aria-label="Tổng quan hệ thống">
        {cards.map(({ label, value, note, icon: Icon, href }) => (
          <Link href={href} key={label} style={{ textDecoration: "none" }}>
            <article className="metric-card" style={{ cursor: "pointer" }}>
              <div className="metric-icon">
                <Icon size={20} aria-hidden="true" />
              </div>
              <p>{label}</p>
              <strong>{value}</strong>
              <span>{note}</span>
            </article>
          </Link>
        ))}
      </section>

      <section className="panel roadmap-panel">
        <div>
          <p className="eyebrow">Tiến độ triển khai</p>
          <h2>3 Module Tồn kho, Nhập kho &amp; Xuất kho FEFO đã hoàn thành</h2>
          <p>
            Mọi biến động kho được kiểm soát bằng sổ giao dịch (ledger), bảo vệ giao dịch không âm kho và tự động ưu tiên xuất lô hết hạn sớm nhất.
          </p>
        </div>
        <ol className="step-list">
          <li className="done">
            <ClipboardCheck size={18} /> Phân tích database &amp; kiến trúc
          </li>
          <li className="done">
            <Pill size={18} /> Danh mục thuốc đầy đủ
          </li>
          <li className="done">
            <Boxes size={18} /> Tồn kho, Nhập kho &amp; Xuất kho FEFO chuẩn
          </li>
        </ol>
      </section>
    </div>
  );
}
