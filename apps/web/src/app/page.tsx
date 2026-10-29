import { ButtonLink } from '@/components/ui'

// Replaced by the landing page in #18.
export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-[1200px] flex-col justify-center gap-6 px-4">
      <h1 className="text-title-1 font-semibold">One request in. One reviewed pull request out.</h1>
      <div>
        <ButtonLink href="/sign-in" variant="primary">
          Start a run
        </ButtonLink>
      </div>
    </main>
  )
}
