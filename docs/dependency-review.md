# Dependency review before deployment

Reviewed on October 14, 2026 (Pacific time).

- Backend: updated `@fastify/static` from 8.x to 10.1.6 and refreshed compatible
  dependencies. The resulting full npm audit reports zero findings. This is an
  advisory scan, not a guarantee that the application is free of vulnerabilities.
- Frontend: applied compatible npm audit fixes. The scan decreased from 25
  findings to 11 (6 high, 5 moderate).
- Remaining frontend findings involve the Tailwind build-tool dependency chain,
  Vite/esbuild development-server tooling, and React Router. Build tools are not
  copied into the runtime image, but still matter in development and CI.
- React Router is included in browser assets. Its remaining advisories concern
  redirect handling and SSR hydration. This app uses BrowserRouter and a fixed
  `/search` to `/` redirect, not SSR hydration; this limits the affected paths but
  does not replace upgrading the dependency.

Before public deployment, review targeted React Router, Vite, and Tailwind
upgrades and test navigation, rendering, and builds. Do not blindly run
`npm audit fix --force`: the proposed fixes cross major versions and Tailwind
requires a configuration migration.

Recheck with `npm --prefix backend audit` and `npm --prefix frontend audit`.
