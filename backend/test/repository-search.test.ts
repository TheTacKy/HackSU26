import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('../src/clients/github-client.js', () => ({ searchRepositories: vi.fn() }));
import { searchRepositories } from '../src/clients/github-client.js';
import { findRepos } from '../src/services/repository-service.js';
import { GitHubSearchError } from '../src/clients/github-search-error.js';
import type { GitHubRepo, Persona } from '../src/types/index.js';
const search = vi.mocked(searchRepositories);
const persona: Persona = { stack: ['Python'], level: 'beginner', interests: 'game development', experience: 'none', extracted_keywords: ['game development'] };
const repo: GitHubRepo = { id: 1, name: 'game', full_name: 'example/game', html_url: 'https://github.com/example/game', stargazers_count: 10, language: 'Python', owner: { login: 'example' } };
beforeEach(() => vi.resetAllMocks());
describe('repository discovery', () => {
  it('separates qualifiers with spaces and trusts the pushed-date filter', async () => {
    search.mockResolvedValue([repo]);
    await expect(findRepos(persona)).resolves.toEqual([repo]);
    expect(search.mock.calls[0]![0]).toMatch(/^"game development" is:public archived:false pushed:>\d{4}-\d{2}-\d{2} language:"python"$/);
  });
  it('propagates upstream failure if no repositories can be returned', async () => {
    const error = new GitHubSearchError('Unavailable', 'GITHUB_SEARCH_UNAVAILABLE', 503);
    search.mockRejectedValue(error);
    await expect(findRepos(persona)).rejects.toBe(error);
  });
  it('preserves usable partial results when another query fails', async () => {
    search.mockResolvedValueOnce([repo]).mockRejectedValueOnce(new Error('unavailable'));
    await expect(findRepos({ ...persona, extracted_keywords: ['games', 'tools'] })).resolves.toEqual([repo]);
  });
  it('does not confuse Java with JavaScript', async () => {
    search.mockResolvedValue([{ ...repo, language: 'JavaScript' }]);
    await expect(findRepos({ ...persona, stack: ['Java'] })).resolves.toEqual([]);
  });
  it('searches each distinct selected language and merges without duplicates', async () => {
    const javascriptRepo = { ...repo, id: 2, language: 'JavaScript' };
    search.mockResolvedValueOnce([repo]).mockResolvedValueOnce([javascriptRepo, repo]);
    const result = await findRepos({ ...persona, stack: ['Python', 'JavaScript', ' python '] });
    expect(search).toHaveBeenCalledTimes(2);
    expect(search.mock.calls.map(call => call[0])).toEqual([
      expect.stringContaining('language:"python"'),
      expect.stringContaining('language:"javascript"'),
    ]);
    expect(result.map(item => item.id).sort()).toEqual([1, 2]);
  });
  it('supports searches without a language selection', async () => {
    search.mockResolvedValue([repo]);
    await expect(findRepos({ ...persona, stack: [] })).resolves.toEqual([repo]);
    expect(search.mock.calls[0]![0]).not.toContain('language:');
  });
  it('preserves punctuation in language qualifiers', async () => {
    search.mockResolvedValue([]);
    await findRepos({ ...persona, stack: ['C++', 'C#'] });
    expect(search.mock.calls.map(call => call[0])).toEqual([
      expect.stringContaining('language:"c++"'),
      expect.stringContaining('language:"c#"'),
    ]);
  });
});
