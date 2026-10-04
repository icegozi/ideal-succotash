import { AlertTriangle, Check, Clock, Lock, ShieldAlert, X } from "lucide-react";
import { Badge } from "@/components/shared/Badge";
import type {
  BatchStatus,
  ExpiryStatus,
  IssueStatus,
  ReceiptStatus,
} from "@/modules/inventory/types/inventory.types";

export function ExpiryBadge({
  status,
  days,
}: {
  status: ExpiryStatus;
  days?: number;
}) {
  if (status === "EXPIRED" || (days !== undefined && days < 0)) {
    return (
      <Badge variant="danger" icon={<AlertTriangle size={12} />}>
        Đã hết hạn
      </Badge>
    );
  }
  if (status === "NEAR_EXPIRY") {
    return (
      <Badge variant="warning" icon={<Clock size={12} />}>
        Sắp hết hạn{days !== undefined ? ` (${days} ngày)` : ""}
      </Badge>
    );
  }
  return (
    <Badge variant="success" showDot>
      Bình thường
    </Badge>
  );
}

export function BatchStatusBadge({ status }: { status: BatchStatus }) {
  switch (status) {
    case "AVAILABLE":
      return (
        <Badge variant="success" showDot>
          Khả dụng
        </Badge>
      );
    case "QUARANTINE":
      return (
        <Badge variant="warning" icon={<Lock size={12} />}>
          Biệt trữ
        </Badge>
      );
    case "BLOCKED":
      return (
        <Badge variant="danger" icon={<ShieldAlert size={12} />}>
          Khóa
        </Badge>
      );
    case "EXPIRED":
      return (
        <Badge variant="danger" icon={<AlertTriangle size={12} />}>
          Hết hạn
        </Badge>
      );
    case "RECALLED":
      return (
        <Badge variant="danger" icon={<X size={12} />}>
          Thu hồi
        </Badge>
      );
    default:
      return (
        <Badge variant="neutral" showDot>
          {status}
        </Badge>
      );
  }
}

export function DocumentStatusBadge({
  status,
}: {
  status: ReceiptStatus | IssueStatus;
}) {
  switch (status) {
    case "DRAFT":
      return (
        <Badge variant="warning" showDot>
          Bản nháp
        </Badge>
      );
    case "CONFIRMED":
      return (
        <Badge variant="success" icon={<Check size={12} />}>
          Đã xác nhận
        </Badge>
      );
    case "CANCELLED":
      return (
        <Badge variant="danger" icon={<X size={12} />}>
          Đã hủy
        </Badge>
      );
    default:
      return (
        <Badge variant="neutral" showDot>
          {status}
        </Badge>
      );
  }
}
