# Conventions

These rules apply to the whole project. When AI writes code, it follows them; when the human writes code, same. When in doubt, the convention wins over personal style.

## Commit messages — Conventional Commits

Format: `type: short description in imperative mood`

Types we use:
- `feat:` — new functionality
- `fix:` — bug fix
- `docs:` — documentation only
- `chore:` — maintenance (config, dependencies)
- `refactor:` — rewrite without behavior change
- `style:` — formatting, no logic
- `test:` — adding or changing tests

Examples:
- `feat: add language switcher to header`
- `fix: correct broken link in footer`
- `docs: update architecture.md with DB decision`
- `chore: bump next to 15.0.3`

One discipline rule: if a commit does more than one thing, split it into two commits.

## Branch strategy

For now we work directly on `main`, since it's one person. Once the business partner is added or risky experiments start, we'll introduce `feature/*` branches and pull requests.

## File and folder naming

- Folders: `kebab-case` (`property-card`, `language-switcher`)
- React components (file and component): `PascalCase` (`PropertyCard.tsx`)
- Hooks: `useCamelCase.ts` (`useTranslation.ts`)
- Utility functions and non-component modules: `camelCase.ts`
- Tests: `*.test.ts` or `*.test.tsx` next to the file they test

## TypeScript

- `strict: true` in `tsconfig.json` — not negotiable
- No `any` except as a last resort, and only with a comment explaining why
- Explicit types on public function signatures; let inference handle locals

## Comments

Write a comment when:
- The decision is non-obvious and without the comment the next reader would break it
- There's a link to a bug, doc, or ADR
- There's a workaround for something specific

Don't write a comment when:
- The code already says it (`// increment counter` above `counter++`)
- You could rename something so the need for the comment disappears

## Dependencies

Before adding a new package:
- Why this one and not an alternative
- Bundle size impact
- Maintenance status (last commit, open issues)
- Lock-in risk

Record it in an ADR if the dependency is non-trivial (a new auth system, a new CMS plugin, a query client, etc.).

## SOLID, but not religiously

Principles are guidance, not law. The goal: code we can re-read tomorrow without archaeology. When abstraction adds more noise than value, it gets removed.