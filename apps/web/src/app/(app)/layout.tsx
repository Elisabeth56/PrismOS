import { redirect } from 'next/navigation'

import { Shell } from '@/components/app/shell'
import { createClient } from '@/lib/supabase/server'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')
  const meta = user.user_metadata ?? {}
  const account = {
    login: (meta.user_name as string | undefined) ?? user.email ?? 'you',
    name: (meta.full_name as string | undefined) ?? (meta.name as string | undefined) ?? null,
    avatarUrl: (meta.avatar_url as string | undefined) ?? null,
    email: user.email ?? null,
    joinedAt: user.created_at,
    readOnly: user.app_metadata?.read_only === true,
  }
  return <Shell account={account}>{children}</Shell>
}
