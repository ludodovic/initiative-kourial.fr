# initiative-kourial.fr

## Commands

- Install the lockfile-pinned dependencies with `npm ci`.
- Run the development server with `npm start`; it regenerates the library manifest first.
- Build with `npm run build`; it also regenerates the manifest and outputs to `dist/initiative-kourial`.
- Run Karma tests with `npm test`. No lint or standalone typecheck script is configured.
- `npm run generate:library` recreates `assets/library/library-manifest.json` from `.png` and `.gif` files under `assets/library`; files prefixed `PREV` are intentionally excluded.

## Architecture

- This is a standalone Angular 21 application bootstrapped at `src/main.ts`; routes lazy-load page components from `src/app/pages/`.
- `src/app/services/api.service.ts` is the shared contract for the sibling `../Initiative_API_BOT` FastAPI service. Update both repositories together when API paths or payloads change.
- Development calls `https://initiative-kourial.fr`; production uses same-origin `/api` calls. The auth interceptor only adds the stored Bearer token to that API origin.
- Registration links carry `?token=`. `AuthTokenService` persists it as `initiative-kourial.authToken` and removes it from the URL, so preserve this flow when changing authentication.

## Build Constraints

- TypeScript and Angular templates are strict (`tsconfig.json`); production builds enforce 1 MB initial-bundle and 12 kB component-style error budgets.
- Static `assets/` are copied by Angular's build configuration. Do not edit the generated library manifest by hand.
