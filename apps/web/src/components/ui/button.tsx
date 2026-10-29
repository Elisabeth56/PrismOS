import Link from 'next/link'
import type { ComponentProps, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

const classes = (variant: Variant, size: Size, extra?: string) =>
  ['px-btn', variant !== 'secondary' && `px-btn--${variant}`, size !== 'md' && `px-btn--${size}`, extra]
    .filter(Boolean)
    .join(' ')

interface Shared {
  variant?: Variant
  size?: Size
  shortcut?: string
  children: ReactNode
}

/** One primary button per view (design system rule). Buttons lift 2px on hover. */
export function Button({
  variant = 'secondary',
  size = 'md',
  shortcut,
  className,
  children,
  type = 'button',
  ...props
}: Shared & ComponentProps<'button'>) {
  return (
    <button type={type} className={classes(variant, size, className)} {...props}>
      {children}
      {shortcut && <Kbd>{shortcut}</Kbd>}
    </button>
  )
}

export function ButtonLink({
  variant = 'secondary',
  size = 'md',
  shortcut,
  className,
  children,
  ...props
}: Shared & ComponentProps<typeof Link>) {
  return (
    <Link className={classes(variant, size, className)} {...props}>
      {children}
      {shortcut && <Kbd>{shortcut}</Kbd>}
    </Link>
  )
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="px-kbd">{children}</kbd>
}
