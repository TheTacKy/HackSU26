export class GitHubSearchError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode = 502,
  ) {
    super(message);
    this.name = "GitHubSearchError";
  }
}
