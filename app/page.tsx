import Link from "next/link";
import { ArrowRight, Boxes, CircleAlert, ClipboardCheck, PackageCheck, Pill, ShieldCheck } from "lucide-react";
import { connection } from "next/server";

import { isDemoDataMode } from "@/modules/medicines/repositories";

const cards = [
  { label: "Danh mục thuốc", value: "Sẵn sàng", note: "Module tham chiếu", icon: Pill },
  { label: "Tồn khả dụng", value: "Theo lô", note: "Đọc từ view tổng hợp", icon: Boxes },
  { label: "Cảnh báo hạn", value: "90 ngày", note: "Theo VW_CANH_BAO_HAN_DUNG", icon: CircleAlert },
  { label: "Kiểm soát", value: "Maker–checker", note: "Bắt buộc với thuốc kiểm soát", icon: ShieldCheck },
];

export default async function DashboardPage() {
  await connection();
  const demo = isDemoDataMode();
  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div><p className="eyebrow">Tổng quan vận hành</p><h1 className="hero-title">Kho dược an toàn, rõ từng lô thuốc.</h1><p className="hero-copy">Nền tảng quản lý tồn theo FEFO, biệt trữ, thu hồi và sổ giao dịch bất biến trên Oracle.</p></div>
        <Link className="button button-primary" href="/medicines">Mở danh mục thuốc <ArrowRight size={17} aria-hidden="true" /></Link>
      </section>
      {demo ? <div className="notice notice-info" role="status"><PackageCheck size={19} aria-hidden="true" /><div><strong>Đang dùng dữ liệu demo cục bộ.</strong><span>Cấu hình biến môi trường Oracle để đọc và ghi schema thật.</span></div></div> : null}
      <section className="metric-grid" aria-label="Tổng quan hệ thống">
        {cards.map(({ label, value, note, icon: Icon }) => <article className="metric-card" key={label}><div className="metric-icon"><Icon size={20} aria-hidden="true" /></div><p>{label}</p><strong>{value}</strong><span>{note}</span></article>)}
      </section>
      <section className="panel roadmap-panel">
        <div><p className="eyebrow">Tiến độ triển khai</p><h2>Danh mục thuốc là module chuẩn đầu tiên</h2><p>Luồng tồn kho sẽ gọi trực tiếp các package PL/SQL hiện hữu sau khi mô hình danh tính và phê duyệt được xác nhận.</p></div>
        <ol className="step-list"><li className="done"><ClipboardCheck size={18} /> Phân tích database &amp; kiến trúc</li><li className="active"><Pill size={18} /> Danh mục thuốc đầy đủ</li><li><Boxes size={18} /> Nhập, xuất FEFO và nghiệp vụ nâng cao</li></ol>
      </section>
    </div>
  );
}
