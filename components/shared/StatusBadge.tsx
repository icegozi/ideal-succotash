export function StatusBadge({ active, children }: { active: boolean; children: React.ReactNode }) {
  return <span className={`status-badge ${active ? "positive" : "neutral"}`}><i />{children}</span>;
}
