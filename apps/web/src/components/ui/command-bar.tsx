'use client'

import { forwardRef, type ComponentProps } from 'react'

import { Kbd } from './button'

/** The request input: a prism mark, the request, the branch it will run against and the submit key. */
export const CommandBar = forwardRef<HTMLInputElement, ComponentProps<'input'> & { branch?: string }>(
  function CommandBar({ branch, id = 'request', ...props }, ref) {
    return (
      <label className="px-cmd" htmlFor={id}>
        <svg viewBox="0 0 24 24" aria-hidden>
          <path d="M12 3l9 16H3z" />
        </svg>
        <input ref={ref} id={id} autoComplete="off" {...props} />
        {branch && <span className="px-cmd-repo">{branch}</span>}
        <Kbd>↵</Kbd>
      </label>
    )
  },
)
