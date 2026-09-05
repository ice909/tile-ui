# Tile UI

Tile UI is a cross-framework component library built around a shared SCSS design system, framework-specific React, Vue, and SolidJS packages, and a shadcn-style registry distribution model.

## Vision

Tile UI aims to become a lightweight, practical UI toolkit with a shared design foundation and a consistent experience across React, Vue, and SolidJS.

The goal is not to build an oversized component library that tries to cover every possible case. The goal is to steadily build a solid base: a clear design language, stable shared styles, reusable core logic, and framework-specific packages that feel aligned rather than fragmented. A big part of that direction is offering a cleaner styling workflow than long, noisy utility class strings, while still keeping the registry-based distribution model flexible and practical.

That vision is still actively being implemented. Many ideas are already clear, but turning them into stable components, reliable documentation, a smooth installation flow, a predictable release process, and maintainable project structure still takes steady work.

Contributions are welcome in all forms, including:

- design direction and visual refinement
- documentation improvements and examples
- new components and component improvements
- API design and implementation work
- ideas, use cases, product needs, and feedback
- issues, bug reports, and reproducible cases

Whether you want to write code, improve docs, suggest an idea, report a problem, or help sharpen a rough edge, your contribution can move the project forward. For contribution guidelines and development workflow details, see [CONTRIBUTING.md](./CONTRIBUTING.md).

This repository exposes three framework-specific applications and three package-local registries.

- `apps/react` for the React documentation site and React registry.
- `apps/vue` for the Vue documentation site and Vue registry.
- `apps/solid` for the SolidJS documentation site and Solid registry.

More framework adaptations remain welcome as contributors step in.

Shared docs styles and layout primitives live in `apps/common`.

The current docs implementation provides aligned page groups for all three frameworks:

- installation
- registry
- registry/getting-started
- registry/schema
- registry/examples
- registry/faq
- components
- component detail pages
- hooks, composables, or primitives
- examples

Docs architecture:

- React: Next.js App Router + `fumadocs-mdx` + `content/docs/*.mdx`
- Vue: Nuxt + `content/docs/*.mdx` + server-side content loader
- Solid: SolidStart + Vite + `content/docs/*.mdx` + server-side content loader (`apps/solid/scripts/build-docs.mjs`)
- Shared presentation layer: `apps/common/styles/*` and selected shared docs components

Documentation pages now follow a richer structure with installation, usage, highlights, dependency notes, and API-style sections.

Quick links:

- [Package install](#package-install)
- [Registry install](#registry-install)
- [Release](#release)

## Workspace Layout

```text
tile-ui/
├── apps/
│   ├── common/                     # Shared docs styles and helpers
│   ├── react/                      # React site + React registry output
│   ├── vue/                        # Vue site + Vue registry output
│   └── solid/                      # SolidStart site + Solid registry output
├── packages/
│   ├── core/                       # Shared framework-agnostic logic
│   ├── styles/                     # Shared SCSS design system
│   ├── buildx/                     # Shared registry build core and tests
│   ├── react/                      # React package and registry source
│   ├── vue/                        # Vue package and registry source
│   └── solid/                      # Solid package and registry source
```

## Packages

| Package           | Purpose                                    |
| ----------------- | ------------------------------------------ |
| `@tile-ui/core`   | Shared design logic and utility helpers    |
| `@tile-ui/styles` | Global SCSS, variables, and mixins         |
| `@tile-ui/buildx` | Shared registry build pipeline and tests   |
| `@tile-ui/react`  | React components and hooks                 |
| `@tile-ui/vue`    | Vue components and composables             |
| `@tile-ui/solid`  | SolidJS components and SSR-safe primitives |

## Applications

### React

- App path: `apps/react`
- Local dev port: `3001`
- Docs site: <https://react.tileui.zmorg.cn>
- Registry output: `apps/react/public/r/*`
- Public registry URL shape: `https://react.tileui.zmorg.cn/r/{name}.json`

### Vue

- App path: `apps/vue`
- Local dev port: `3002`
- Docs site: <https://vue.tileui.zmorg.cn>
- Registry output: `apps/vue/public/r/*`
- Public registry URL shape: `https://vue.tileui.zmorg.cn/r/{name}.json`

### Solid

- App path: `apps/solid`
- Local dev port: `3003`
- Docs site: <https://solid.tileui.zmorg.cn>
- Registry output: `apps/solid/public/r/*`
- Public registry URL shape: `https://solid.tileui.zmorg.cn/r/{name}.json`

## Registries

### React Registry

- Source manifest: `packages/react/src/registry/manifest.ts`
- Source items: `packages/react/src/registry/items/*`
- Published output: `apps/react/public/r/*`
- Docs metadata source: `apps/react/public/r/registry.json`

Example items:

- `button`
- `input`
- `textarea`
- `label`
- `card`
- `core`
- `styles`
- `utils`
- `use-copy-to-clipboard`
- `use-media-query`
- `use-local-storage`

### Vue Registry

- Source manifest: `packages/vue/src/registry/manifest.ts`
- Source items: `packages/vue/src/registry/items/*`
- Published output: `apps/vue/public/r/*`
- Docs metadata source: `apps/vue/public/r/registry.json`

Example items:

- `core`
- `button`
- `input`
- `textarea`
- `label`
- `card`
- `styles`
- `utils`
- `use-copy-to-clipboard`
- `use-media-query`
- `use-local-storage`

### Solid Registry

- Source manifest: `packages/solid/src/registry/manifest.ts`
- Source items: `packages/solid/src/registry/items/*`
- Published output: `apps/solid/public/r/*`
- Docs metadata source: `apps/solid/public/r/registry.json`

Example items:

- `core`
- `styles`
- `utils`
- `theme-default`
- `button`
- `input`
- `dialog`
- `create-copy-to-clipboard`
- `create-media-query`
- `create-local-storage`

## Package install

### React package

```bash
pnpm add @tile-ui/react @tile-ui/styles @tile-ui/core
```

Import shared styles once in your app entry:

```tsx
import '@tile-ui/styles/scss/globals.scss';
```

### Vue package

```bash
pnpm add @tile-ui/vue @tile-ui/styles @tile-ui/core
```

In Nuxt, a common setup is:

```ts
export default defineNuxtConfig({
	css: ['@tile-ui/styles/scss/globals.scss'],
});
```

### Solid package

```bash
pnpm add @tile-ui/solid @tile-ui/styles @tile-ui/core
```

In SolidStart, import the shared styles once near the application root (`src/app.tsx`) so server rendering and hydration receive the same styles:

```tsx
import '@tile-ui/styles/scss/globals.scss';
```

SSR-safe browser state helpers import from the canonical `@tile-ui/solid/primitives` subpath:

```tsx
import { createIsMobile, createLocalStorage } from '@tile-ui/solid/primitives';
```

## Registry install

### React registry item

First, register the Tile UI namespace in `components.json`:

```json
{
	"registries": {
		"@tile-ui": "https://react.tileui.zmorg.cn/r/{name}.json"
	}
}
```

```bash
pnpm dlx shadcn@latest add @tile-ui/styles @tile-ui/button
```

### Vue registry item

First, register the Tile UI namespace in `components.json`:

```json
{
	"registries": {
		"@tile-ui": "https://vue.tileui.zmorg.cn/r/{name}.json"
	}
}
```

```bash
pnpm dlx shadcn@latest add @tile-ui/styles @tile-ui/button
```

### Solid registry item

First, register the Tile UI namespace in `components.json`:

```json
{
	"registries": {
		"@tile-ui": "https://solid.tileui.zmorg.cn/r/{name}.json"
	}
}
```

```bash
pnpm dlx shadcn@latest add @tile-ui/styles @tile-ui/button
```

## Release

Package publishing is handled by GitHub Actions with npm Trusted Publishing and OIDC.

Release tags are package-specific and use this format:

```bash
<package>/v<version>
```

Examples:

```bash
git tag core/v1.0.1
git push origin core/v1.0.1

git tag styles/v1.0.1
git push origin styles/v1.0.1
```

Supported package prefixes:

- `core`
- `styles`
- `react`
- `vue`
- `solid`

Before tagging a release:

1. Update the target package version in `packages/<name>/package.json`
2. Make sure the package version matches the tag version exactly
3. Build and validate the target package locally when possible

For the full release workflow and npm Trusted Publishing setup requirements, see [CONTRIBUTING.md](CONTRIBUTING.md).

## Development

```bash
corepack pnpm install
corepack pnpm dev
```

Useful commands:

```bash
corepack pnpm registry:build:react
corepack pnpm registry:build:vue
corepack pnpm registry:build:solid
corepack pnpm registry:build
corepack pnpm test:buildx
corepack pnpm docs:check
corepack pnpm parity:check
corepack pnpm --filter @tile-ui/react build
corepack pnpm --filter @tile-ui/vue build
corepack pnpm --filter @tile-ui/solid build
corepack pnpm --filter @tile-ui/react-docs build
corepack pnpm --filter @tile-ui/vue-docs build
corepack pnpm --filter @tile-ui/solid-docs build
```

`docs:check` validates expected docs entry routes, internal `/docs/...` links inside MDX content, and the exact component-doc/demo set for each framework. `parity:check` compares source manifests, public registry output, docs, and generated previews across React, Vue, and Solid.

## Current Scope

The current implementation provides:

- Separate React, Vue, and Solid registries
- Separate React, Vue, and Solid applications for docs and previews
- 62 shared components in each framework, plus Solid primitives (`@tile-ui/solid/primitives`)
- SolidStart documentation with SSR rendering and hydration
- Shared docs styling in `apps/common`
- Unified homepage and component showcase patterns across all three frameworks
- Expanded page groups for registry guides, components, utilities, and examples

The next iteration should continue the migration toward a more content-driven documentation system and richer live previews.

## License

MIT
