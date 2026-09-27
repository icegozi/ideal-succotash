"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { useEffect } from "react";

export default function MedicinesError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return <div className="error-state"><span><AlertTriangle size={28} /></span><h1>Không thể tải danh mục thuốc</h1><p>Kiểm tra kết nối Oracle hoặc thử lại sau.</p><button className="button button-primary" onClick={retry}><RotateCcw size={17} /> Thử lại</button></div>;
}
