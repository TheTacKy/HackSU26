// Decode only selected identity claims. Never log the JWT or request token.
import { appendFileSync } from 'node:fs';

async function main() {
  const { ACTIONS_ID_TOKEN_REQUEST_URL: endpoint, ACTIONS_ID_TOKEN_REQUEST_TOKEN: credential } = process.env;
  if (!endpoint || !credential) throw new Error('GitHub OIDC is unavailable; the job needs id-token: write.');
  const url = new URL(endpoint);
  url.searchParams.set('audience', 'sts.amazonaws.com');
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${credential}` },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`GitHub OIDC request failed with HTTP ${response.status}.`);
  const { value } = await response.json();
  if (typeof value !== 'string' || value.split('.').length !== 3) throw new Error('GitHub returned an invalid OIDC token.');
  let claims;
  try {
    claims = JSON.parse(Buffer.from(value.split('.')[1], 'base64url').toString('utf8'));
  } catch {
    throw new Error('Unable to decode GitHub OIDC claims.');
  }
  // This is diagnostic decoding, not signature validation. AWS validates the JWT.
  const selected = Object.fromEntries(
    ['iss', 'aud', 'sub', 'repository', 'repository_id', 'ref', 'event_name', 'job_workflow_ref']
      .map(key => [key, claims[key] ?? null]),
  );
  const report = JSON.stringify(selected, null, 2);
  console.log(report);
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### GitHub OIDC identity (no credentials)\n\n\`\`\`json\n${report}\n\`\`\`\n`);
  }
  const expected = 'repo:TheTacKy/repo-scout:ref:refs/heads/main';
  if (claims.sub !== expected) {
    console.log('OIDC subject differs from the configured IAM trust policy. Review the subject above before changing AWS permissions.');
  }
}

main().catch(() => {
  // Avoid dumping response bodies or nested fetch errors containing credentials.
  console.error('OIDC diagnostic failed. Check GitHub id-token permissions and service availability. No token was logged.');
  process.exitCode = 1;
});
