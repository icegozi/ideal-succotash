import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";

export default function MedicineNotFound() {
  return <div className="error-state"><span><SearchX size={28} /></span><h1>Không tìm thấy thuốc</h1><p>Bản ghi có thể đã thay đổi hoặc đường dẫn không hợp lệ.</p><Link className="button button-primary" href="/medicines"><ArrowLeft size={17} /> Về danh sách</Link></div>;
}
