import { describe, expect, it, vi } from 'vitest';
vi.mock('../src/services/matcher-service.js', () => ({ runMatcher: vi.fn() }));
import { runMatcher } from '../src/services/matcher-service.js';
import { buildApp } from '../src/api/app.js';
import { GitHubSearchError } from '../src/clients/github-search-error.js';
describe('match API failure responses', () => {
  it('returns a clear upstream failure instead of an empty success', async () => {
    vi.mocked(runMatcher).mockRejectedValue(new GitHubSearchError('GitHub search is rate-limited.', 'GITHUB_SEARCH_UNAVAILABLE', 503));
    const app = buildApp();
    try {
      const response = await app.inject({ method: 'POST', url: '/match?include_issues=false', payload: { tech_stack: ['Python'], interests: 'games', skill_level: 'beginner', open_source_experience: 'none' } });
      expect(response.statusCode).toBe(503);
      expect(response.json()).toEqual({ code: 'GITHUB_SEARCH_UNAVAILABLE', detail: 'GitHub search is rate-limited.' });
    } finally { await app.close(); }
  });
});
