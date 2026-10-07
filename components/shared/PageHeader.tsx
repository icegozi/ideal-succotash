import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  parent?: { href: string; label: string };
}

export function PageHeader({ title, description, actions, parent }: PageHeaderProps) {
  return (
    <header className="page-header">
      <div className="page-header-copy">
        <div className="page-header-heading">
          {parent && (
            <Link
              className="page-header-back"
              href={parent.href}
              aria-label={`Quay lại ${parent.label}`}
              title={`Quay lại ${parent.label}`}
            >
              <ArrowLeft size={17} aria-hidden="true" />
            </Link>
          )}
          <h1>{title}</h1>
        </div>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  );
}
