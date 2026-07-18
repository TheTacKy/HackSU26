# Repo Scout Optimization Ideas

## Current request path

A search currently waits on several external operations:

```text
OpenAI keyword extraction
→ multiple GitHub repository searches
→ OpenAI ranking of up to 50 repositories
→ GitHub issue requests for visible repositories
```

The largest delays are external API calls and the fact that some work blocks the user interface unnecessarily. React rendering and backend computation are unlikely to be the primary bottlenecks.

## Recommended priorities

### 1. Show repositories before loading issues

The frontend currently waits for issue loading before completely ending the search-loading state. Render repository cards as soon as `/match` returns, then populate issues independently.

This is likely the largest improvement to perceived performance.

### 2. Cache GitHub results and issues

Repository data does not need to be fetched fresh for every user.

Suggested TTLs:

- GitHub search results: 10–30 minutes
- Repository metadata: 1–6 hours
- Issues: 5–15 minutes
- Extracted keywords: several hours or indefinitely for identical input
- Complete search results: 10–30 minutes

An in-process Python TTL cache is sufficient for one backend instance. Use Redis when running multiple instances. AWS ElastiCache for Valkey or Redis is appropriate for a production AWS deployment.

Potential cache keys:

```text
keywords:{hash(normalized_interests)}
github-search:{hash(keywords+languages)}
ranking:{hash(profile+repo_ids)}
issues:{owner}/{repo}
match:{hash(normalized_profile)}
```

### 3. Reduce or eliminate the second OpenAI call

Ranking up to 50 repositories creates a large prompt and can add several seconds.

Possible approaches:

- Use the heuristic scores already calculated in `repo_search_agent.py`.
- Use OpenAI only to rerank the best 10–20 candidates.
- Return heuristic results immediately and refine their order asynchronously.
- Cache rankings using a normalized profile hash.

Reranking approximately 15 repositories is likely the best quality/performance compromise.

### 4. Remove OpenAI keyword extraction from the critical path

The application already has local fallback extraction. Possible improvements include:

- Run local extraction first.
- Call OpenAI only when local extraction produces poor results.
- Cache extraction results by normalized interest text.
- Construct GitHub queries directly from user interests and selected languages.

This can eliminate one complete network round trip.

### 5. Search fewer GitHub repositories

The backend can request 100 general results plus 100 results for every selected language, but returns at most 50.

Consider:

- Requesting only 25–50 results per query.
- Limiting searches to the first two or three languages.
- Stopping after finding 20–30 strong unique candidates.
- Fetching only enough results for the first one or two pages.

### 6. Add outbound request timeouts

Issue requests have a timeout, but repository searches currently do not. One slow GitHub request can therefore hold the entire search open.

Example limits:

- Connection timeout: 2 seconds
- Response timeout: 5–8 seconds

Return partial results if one parallel GitHub query fails or times out.

### 7. Reuse HTTP connections

Use a persistent `requests.Session` or an asynchronous `httpx.AsyncClient` rather than individual `requests.get()` calls.

Benefits include:

- TCP and TLS connection reuse
- Lower per-request overhead
- Better timeout handling
- Controlled connection pooling
- Cleaner asynchronous concurrency

### 8. Fetch issues only when needed

Opening a results page currently fetches issues for all 12 repositories. Alternatives include:

- Fetch issues when a card is expanded.
- Fetch only for cards entering the viewport.
- Fetch issues for the first 3–4 results immediately and load the remainder later.
- Add a `Show issues` action.

This reduces latency, GitHub traffic, and rate-limit pressure.

### 9. Return results progressively

Instead of waiting for every stage to finish:

- Return heuristic results first.
- Stream ranked updates using Server-Sent Events.
- Continue loading issues separately.
- Show progress such as `Repositories found; refining order…`.

AWS Lambda response streaming can send partial results, although ordinary Server-Sent Events from a container-hosted FastAPI service may be simpler.

## AWS and cloud options

### Suggested AWS architecture

```text
React frontend → S3 + CloudFront
FastAPI backend → ECS Fargate or App Runner
Shared cache → ElastiCache for Valkey/Redis
Logs and metrics → CloudWatch
Optional background work → SQS workers
```

### CloudFront and S3

Host the production React build in S3 and deliver it through CloudFront. This improves static JavaScript and CSS delivery, geographic latency, compression, browser caching, and repeat page loads.

CloudFront will not substantially accelerate the OpenAI and GitHub work behind `/match`, so it is not the primary solution to search latency.

### ECS Fargate or App Runner

These are a good fit for the FastAPI backend because the process stays warm and can retain HTTP connection pools. They also avoid making every request sensitive to serverless cold starts.

### Lambda

Lambda can run the backend, but it is not automatically faster. This application performs several external calls and may have long-running requests. Cold starts could worsen interactive latency.

Provisioned concurrency can keep Lambda environments ready, but it adds cost. Lambda is more attractive if traffic is infrequent and some cold-start latency is acceptable.

### ElastiCache

ElastiCache is a strong fit once the backend runs on multiple instances or needs a shared cache. It can store GitHub searches, issues, keyword extraction results, rankings, and complete match responses.

For a small or hackathon deployment, managed ElastiCache may cost more than it is worth. Start with an in-memory cache or a small Redis instance.

### API Gateway caching

API Gateway caching can reduce calls to backend endpoints, but `/match` is a POST request whose result depends on its JSON body. Application-level Redis caching provides more precise cache keys and behavior for this use case.

API Gateway caching may be useful later if the API is redesigned around cacheable GET resources or stable job-result endpoints.

### SQS

SQS fits non-interactive background work such as:

- Refreshing popular GitHub searches
- Preloading issues
- Retrying rate-limited requests
- Refreshing stale cache entries
- Building a repository search index

SQS will not directly make a synchronous search faster unless the UI submits a job and then polls or streams its progress.

## Larger-scale option: pre-index repositories

At larger scale, avoid searching GitHub live for every request:

1. Periodically collect active repository metadata.
2. Store searchable metadata locally.
3. Search using PostgreSQL full-text search, OpenSearch, or a vector database.
4. Refresh repository data asynchronously.

This provides much faster and more predictable searches but is probably excessive for the current project stage.

## Measurement and observability

Measure each stage before investing in infrastructure:

- Keyword extraction duration
- Duration of each GitHub search
- OpenAI ranking duration
- Issue batch duration
- Cache hit and miss counts
- Total time to first repository render
- Total time until issue loading finishes

Use structured timing logs locally and CloudWatch metrics in an AWS deployment.

## Suggested implementation order

1. Stop blocking the UI on issue loading.
2. Cache GitHub searches and issues.
3. Rerank only the best 10–20 repositories with OpenAI.
4. Use local or cached keyword extraction.
5. Add outbound timeouts and persistent connection pooling.
6. Reduce the number and size of GitHub searches.
7. Add Redis or ElastiCache when shared caching is needed.
8. Move optional refresh and indexing work to background workers.
9. Consider a local repository index only after traffic or GitHub limits justify it.

## Reference documentation

- [AWS API Gateway caching](https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-caching.html)
- [AWS Lambda provisioned concurrency](https://docs.aws.amazon.com/lambda/latest/dg/provisioned-concurrency.html)
- [AWS Lambda response streaming](https://docs.aws.amazon.com/lambda/latest/dg/configuration-response-streaming.html)
- [Amazon SQS documentation](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/welcome.html)
