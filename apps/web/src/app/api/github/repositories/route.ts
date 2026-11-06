import { forwardWithGitHubToken } from '@/lib/github/forward'

export async function GET() {
  return forwardWithGitHubToken('/github/repositories')
}
