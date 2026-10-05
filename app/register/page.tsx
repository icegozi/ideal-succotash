import type { Metadata } from "next";
import Link from "next/link";
import { Cross } from "lucide-react";

import { RegisterForm } from "@/modules/auth/components/RegisterForm";

export const metadata: Metadata = {
  title: "Đăng ký tài khoản",
  description: "Đăng ký tài khoản cán bộ kho dược bệnh viện MedStock.",
};

export default function RegisterPage() {
  return (
    <div className="auth-container auth-container-wide">
      <div className="auth-card">
        <div className="auth-header">
          <Link href="/" className="auth-brand" aria-label="MedStock - Trang chủ">
            <span className="brand-mark">
              <Cross size={22} strokeWidth={2.6} />
            </span>
            <span className="auth-brand-name">MedStock</span>
          </Link>
          <h1 className="auth-title">Đăng ký tài khoản</h1>
          <p className="auth-subtitle">Tạo tài khoản cán bộ quản trị / dược sĩ kho</p>
        </div>

        <RegisterForm />
      </div>
    </div>
  );
}
