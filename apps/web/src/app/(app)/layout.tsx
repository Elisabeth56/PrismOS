import { redirect } from 'next/navigation'

import { Shell } from '@/components/app/shell'
import { createClient } from '@/lib/supabase/server'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')
  const login = (user.user_metadata?.user_name as string | undefined) ?? user.email ?? 'you'
  return <Shell login={login}>{children}</Shell>
}
