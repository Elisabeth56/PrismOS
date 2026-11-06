'use client'

import { createContext, useContext } from 'react'

export interface Account {
  login: string
  name: string | null
  avatarUrl: string | null
  email: string | null
  joinedAt: string
  /** the shared demo account: it can look at everything it's a member of but change nothing */
  readOnly: boolean
}

const AccountContext = createContext<Account | null>(null)
export const AccountProvider = AccountContext.Provider

export function useAccount() {
  const account = useContext(AccountContext)
  if (!account) throw new Error('useAccount must be used inside the signed-in app')
  return account
}

export function Avatar({ account, size = 24 }: { account: Account; size?: number }) {
  if (account.avatarUrl) {
    // GitHub avatars are small and already sized; next/image would need the domain configured for no gain
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={account.avatarUrl} alt="" width={size} height={size} className="flex-none rounded-full" />
  }
  return (
    <span
      className="inline-flex flex-none items-center justify-center rounded-full bg-surface-3 text-[11px] font-medium text-ink uppercase"
      style={{ width: size, height: size }}
    >
      {account.login.slice(0, 2)}
    </span>
  )
}
