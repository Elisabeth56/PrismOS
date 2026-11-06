'use client'

import { useEffect, useRef } from 'react'

/** A modal on the native <dialog>: focus is trapped, Esc and the backdrop close it. */
export function Dialog({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(event) => event.target === ref.current && onClose()}
      aria-labelledby="dialog-title"
      className="m-auto w-[min(480px,calc(100vw-32px))] rounded-[20px] bg-surface-1 p-0 text-ink shadow-popover backdrop:bg-black/50"
    >
      <div className="flex flex-col gap-5 p-6">
        <h2 id="dialog-title" className="text-title-3 font-medium">
          {title}
        </h2>
        {children}
      </div>
    </dialog>
  )
}
