import type { ReactNode } from 'react';

interface Props {
  href?: string;
  class?: string;
  children: ReactNode;
}

export default function GlassCard({ href, class: className, children }: Props) {
  const Tag = href ? 'a' : 'div';
  return (
    <Tag
      href={href || undefined}
      className={`gc ${className || ''}`}
      target={href?.startsWith('http') ? '_blank' : undefined}
      rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
    >
      {children}
    </Tag>
  );
}
