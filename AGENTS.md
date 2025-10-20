# Repository Guidelines

## Project Structure & Module Organization
- `src/pages` owns Astro routes; `src/content` supplies Markdown entries.
- UI components live in `src/components`, while Firebase/CMS helpers are in `src/lib`.
- Serve static assets from `public/`; keep build output in `dist/` out of version control.
- Firebase Functions and emulators stay under `functions/`; deep-dive docs sit in `docs/`.
- Root config (`astro.config.mjs`, `tailwind.config.js`, `tsconfig.json`) defines global build and styling rules.

## Build, Test, and Development Commands
- `npm run dev` (or `./start-dev.sh`) starts the dev server on `localhost:4321`.
- `npm run build && npm run postbuild` produces the production bundle plus pagefind index.
- `npx astro preview` lets you sanity-check the generated site before deployment.
- `npx tsc --noEmit` and `npm run format` enforce type safety and Prettier + Tailwind formatting.
- `npm --prefix functions run serve` or `run lint` handles Firebase Function validation.

## Coding Style & Naming Conventions
- Prettier governs `.astro`, `.ts(x)`, and `.scss`; stick to two-space indentation and semicolons.
- Components (Astro/React) use PascalCase filenames; utilities stay camelCase; content folders remain kebab-case.
- Declare shared interfaces in `src/types` and avoid `any` unless bridging third-party APIs.
- Let `prettier-plugin-tailwindcss` order Tailwind classes; group utilities by intent.

## Testing Guidelines
- Always run `npm run build` before pushing to catch Astro, Tailwind, and content schema issues.
- Follow with `npx tsc --noEmit` for type regressions, especially after CMS or Firebase changes.
- For Function edits, execute `npm --prefix functions run lint` and smoke test via the emulator.
- Log manual results for `/admin` auth, CRUD flows, and site search inside the PR description when those areas change.

## Commit & Pull Request Guidelines
- Use Conventional Commits (`feat:`, `fix:`, `docs:`) as in current history; one concern per commit.
- PRs should summarize scope, link issues with `Closes #123`, and include UI evidence (screenshots/GIFs) plus test notes.
- Ensure format/build/type steps pass locally; call out skipped checks explicitly.
- Request reviewers who own the affected area (web UI, CMS, or functions) before merging.

## Security & Configuration Tips
- Keep Firebase credentials in `.env` (`PUBLIC_FIREBASE_*`) or Firebase config; never commit secrets or service accounts.
- Favor environment-specific `.env.local` files and audit `database.rules.json` after data model updates.
- Sanitize user content when adding integrations and double-check Storage rules for new upload surfaces.
