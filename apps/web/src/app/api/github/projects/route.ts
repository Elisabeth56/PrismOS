import { forwardWithGitHubToken } from '@/lib/github/forward'

/** Attaching a repo needs the GitHub token, so it goes through here rather than straight to the API. */
export async function POST(request: Request) {
  return forwardWithGitHubToken('/projects', { method: 'POST', body: await request.text() })
}
