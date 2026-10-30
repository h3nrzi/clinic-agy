import type { ReactNode } from 'react';
export function Panel({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return <section className="analytics-panel"><header><h3>{title}</h3>{description && <p>{description}</p>}</header>{children}</section>;
}
