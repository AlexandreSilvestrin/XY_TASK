import { useState, type ReactNode } from 'react'

type ExplanationAccordionProps = {
  title: string
  children?: ReactNode
  defaultOpen?: boolean
  disabled?: boolean
}

export function ExplanationAccordion({
  title,
  children,
  defaultOpen = false,
  disabled = false,
}: ExplanationAccordionProps) {
  const [open, setOpen] = useState(defaultOpen)

  const canExpand = !disabled && children != null

  return (
    <div className="explanation-accordion">
      <button
        type="button"
        onClick={() => canExpand && setOpen((value) => !value)}
        disabled={!canExpand}
        aria-expanded={open}
        className="explanation-accordion__trigger"
      >
        <span className="explanation-accordion__title">{title}</span>
        <ChevronIcon
          className={`explanation-accordion__chevron ${open ? 'is-open' : ''} ${
            disabled ? 'opacity-40' : ''
          }`}
        />
      </button>

      {canExpand && (
        <div
          className={`explanation-accordion__panel-wrap ${open ? 'is-open' : ''}`}
          aria-hidden={!open}
        >
          <div className="explanation-accordion__panel">
            <div className="explanation-accordion__panel-inner">{children}</div>
          </div>
        </div>
      )}
    </div>
  )
}

function ChevronIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}
