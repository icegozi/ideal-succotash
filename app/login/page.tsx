import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Cross } from "lucide-react";

import { LoginForm } from "@/modules/auth/components/LoginForm";

export const metadata: Metadata = {
  title: "Đăng nhập",
  description: "Đăng nhập hệ thống quản lý kho dược bệnh viện MedStock.",
};

export default function LoginPage() {
  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <Link href="/" className="auth-brand" aria-label="MedStock - Trang chủ">
            <span className="brand-mark">
              <Cross size={22} strokeWidth={2.6} />
            </span>
            <span className="auth-brand-name">MedStock</span>
          </Link>
          <h1 className="auth-title">Đăng nhập hệ thống</h1>
          <p className="auth-subtitle">Cổng xác thực kho dược bệnh viện</p>
        </div>

        <Suspense fallback={<div className="loading-state">Đang tải biểu mẫu…</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
