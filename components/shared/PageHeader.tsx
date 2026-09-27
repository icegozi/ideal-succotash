import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export function PageHeader({ title, description, actions, parent }: { title: string; description?: string; actions?: ReactNode; parent?: { href: string; label: string } }) {
  return <header className="page-header"><div><nav className="breadcrumb" aria-label="Breadcrumb"><Link href="/" aria-label="Trang chủ"><Home size={14} /></Link><ChevronRight size={13} />{parent ? <><Link href={parent.href}>{parent.label}</Link><ChevronRight size={13} /></> : null}<span aria-current="page">{title}</span></nav><h1>{title}</h1>{description ? <p>{description}</p> : null}</div>{actions ? <div className="page-actions">{actions}</div> : null}</header>;
}
