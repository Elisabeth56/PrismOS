import { ButtonLink } from '@/components/ui'

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="flex max-w-[420px] flex-col gap-4 text-center">
        <span className="font-mono text-[12px] text-ink-3">404</span>
        <h1 className="text-title-1 font-semibold">Nothing here</h1>
        <p className="text-ink-2">The page moved or never existed. Your projects and runs are where you left them.</p>
        <div className="flex justify-center gap-2">
          <ButtonLink href="/projects" variant="primary">
            Go to projects
          </ButtonLink>
          <ButtonLink href="/">Home</ButtonLink>
        </div>
      </div>
    </main>
  )
}
