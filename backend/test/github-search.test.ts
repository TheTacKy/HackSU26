import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ request: vi.fn(), getJson: vi.fn(), setJson: vi.fn() }));
vi.mock('undici', () => ({ Agent: class {}, request: mocks.request }));
vi.mock('../src/clients/redis-client.js', () => ({ getJson: mocks.getJson, setJson: mocks.setJson }));
vi.mock('../src/config/environment.js', () => ({ config: { githubToken: '' } }));
import { searchRepositories } from '../src/clients/github-client.js';
beforeEach(() => { vi.resetAllMocks(); mocks.getJson.mockResolvedValue(null); });
function response(status: number, data: unknown) { return { statusCode: status, headers: {}, body: { json: async () => data } }; }
describe('GitHub repository search', () => {
  it('encodes spaces once and preserves actual plus signs in a search term', async () => {
    mocks.request.mockResolvedValue(response(200, { items: [] }));
    await searchRepositories('C++ is:public archived:false');
    const url = new URL(mocks.request.mock.calls[0]![0]);
    expect(url.searchParams.get('q')).toBe('C++ is:public archived:false');
  });
  it('keeps successful empty searches distinct from failures', async () => {
    mocks.request.mockResolvedValue(response(200, { items: [] }));
    await expect(searchRepositories('rare-topic')).resolves.toEqual([]);
  });
  it.each([[401, 'GITHUB_AUTH_FAILED'], [403, 'GITHUB_SEARCH_UNAVAILABLE'], [429, 'GITHUB_SEARCH_UNAVAILABLE'], [422, 'GITHUB_SEARCH_FAILED'], [500, 'GITHUB_SEARCH_FAILED']])('reports HTTP %s without a retry delay', async (status, code) => {
    mocks.request.mockResolvedValue(response(status as number, {}));
    await expect(searchRepositories('python')).rejects.toMatchObject({ code });
    expect(mocks.request).toHaveBeenCalledTimes(1);
    expect(mocks.setJson).not.toHaveBeenCalled();
  });
  it('reports network failures rather than empty recommendations', async () => {
    mocks.request.mockRejectedValue(new Error('network down'));
    await expect(searchRepositories('python')).rejects.toMatchObject({ code: 'GITHUB_CONNECTION_FAILED' });
  });
});
