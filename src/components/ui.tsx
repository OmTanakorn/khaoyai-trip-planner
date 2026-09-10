import React from 'react';
import { X } from 'lucide-react';

/* ---------------------------------------------------------------
   Shared surfaces. Control classes live in ./ui-kit.
   --------------------------------------------------------------- */

export const Panel: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => <section className={`bg-paper px-6 sm:px-8 py-8 ${className}`}>{children}</section>;

export const PageHead: React.FC<{
  title: string;
  note?: string;
  aside?: React.ReactNode;
  action?: React.ReactNode;
}> = ({ title, note, aside, action }) => (
  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-mist-deep pb-6 mb-px">
    <div>
      <h1 className="font-display text-title text-ink">{title}</h1>
      {note && <p className="mt-2 text-fine text-stone max-w-xl">{note}</p>}
      {aside}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

export const Field: React.FC<{
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ label, htmlFor, hint, children, className = '' }) => (
  <div className={className}>
    <label htmlFor={htmlFor} className="block text-fine text-stone mb-1.5">
      {label}
    </label>
    {children}
    {hint && <p className="mt-1.5 text-fine text-stone/80">{hint}</p>}
  </div>
);

export const Modal: React.FC<{
  title: string;
  note?: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}> = ({ title, note, onClose, children, wide }) => (
  <div
    className="fixed inset-0 z-50 bg-ink/70 flex items-center justify-center p-4"
    onClick={onClose}
  >
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => e.stopPropagation()}
      className={`bg-paper rounded-ctl w-full ${
        wide ? 'max-w-2xl' : 'max-w-md'
      } px-6 sm:px-8 py-8 max-h-[90vh] overflow-y-auto`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-lead text-ink">{title}</h2>
          {note && <p className="mt-1 text-fine text-stone">{note}</p>}
        </div>
        <button
          onClick={onClose}
          aria-label="ปิด"
          className="text-stone hover:text-ink transition-colors shrink-0"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="mt-6">{children}</div>
    </div>
  </div>
);

/** Status marker: a coloured tick and plain text. No pill, no border. */
export const Tag: React.FC<{
  tone?: 'go' | 'wait' | 'off' | 'accent';
  children: React.ReactNode;
}> = ({ tone = 'off', children }) => {
  const dot = {
    go: 'bg-moss',
    wait: 'bg-brass',
    off: 'bg-mist-deep',
    accent: 'bg-ink',
  }[tone];
  return (
    <span className="inline-flex items-center gap-1.5 text-fine text-stone">
      <span className={`w-1.5 h-1.5 ${dot}`} aria-hidden="true" />
      {children}
    </span>
  );
};

/** Empty state: an invitation to act, never an apology. */
export const Empty: React.FC<{
  title: string;
  note: string;
  action?: React.ReactNode;
}> = ({ title, note, action }) => (
  <div className="py-16 text-center">
    <p className="font-display text-lead text-ink">{title}</p>
    <p className="mt-2 text-body text-stone max-w-sm mx-auto">{note}</p>
    {action && <div className="mt-6">{action}</div>}
  </div>
);

/** Thin proportional bar — used for seats filled, budget shares, packing. */
export const Meter: React.FC<{ value: number; max: number; tone?: 'ink' | 'brass' }> = ({
  value,
  max,
  tone = 'ink',
}) => (
  <div className="h-px w-full bg-mist-deep" role="presentation">
    <div
      className={`h-px ${tone === 'brass' ? 'bg-brass' : 'bg-ink'}`}
      style={{ width: `${max > 0 ? Math.min(100, (value / max) * 100) : 0}%` }}
    />
  </div>
);
