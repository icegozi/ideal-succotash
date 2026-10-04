import type { ReactNode } from "react";

export interface FormSectionProps {
  step?: string;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

// Styled section container for multi-part forms.
export function FormSection({
  step,
  title,
  description,
  children,
  className = "",
}: FormSectionProps) {
  return (
    <section className={`form-section ${className}`.trim()}>
      <div className="form-section-heading">
        {step ? <span>{step}</span> : null}
        <div>
          <h2>{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}
