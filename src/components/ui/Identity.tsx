import type { ReactNode } from "react";
export function PageTitle({
  children,
  label,
}: {
  children: ReactNode;
  label?: string;
}) {
  return (
    <div className="page-heading">
      {label && <p className="technical-label">{label}</p>}
      <h1>{children}</h1>
    </div>
  );
}
export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="section-title">{children}</h2>;
}
export function Brand() {
  return (
    <span className="brand-lockup">
      <span className="brand-word">
        SET<span className="brand-slash">/</span>
      </span>
      <span className="brand-caption">PRECISION IN EVERY REP.</span>
    </span>
  );
}
