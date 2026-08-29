# @tile-ui/buildx

Internal registry build helpers and test fixtures used by the Tile UI monorepo.

## Scope

This package powers registry generation for the React, Vue, and Solid docs apps. It is primarily intended for workspace-internal use.

## Exports

- `@tile-ui/buildx`
- `@tile-ui/buildx/registry`
- `@tile-ui/buildx/registry/presets/react`
- `@tile-ui/buildx/registry/presets/vue`
- `@tile-ui/buildx/registry/presets/solid`
- `@tile-ui/buildx/registry/types`

## Registry pipeline

The React, Vue, and Solid presets share the same build pipeline and differ only in the file transform and virtual-file assembly.

- `presets/react` / `presets/vue` / `presets/solid` assemble `__virtual__/` core and utils sources from `packages/core` so registry output never imports `@tile-ui/core` or `@tile-ui/styles`.
- Transforms rewrite those workspace imports to relative paths and move SCSS modules next to the component (`solid-component`, `solid-barrel`, `react-barrel`, `vue-barrel`, `style`, ...).
- The Solid lane additionally ships SSR-safe primitives (`@tile-ui/solid/primitives`): `solid-primitive` items publish three helper payloads (`create-local-storage`, `create-media-query`, `create-copy-to-clipboard`) and each primitive file is trimmed to the `exports` allowlist declared in the manifest.
- `validateManifest` enforces unique item names, at least one file per item, and resolvable `registryDependencies`.

Output is written to `apps/{react|vue|solid}/public/r/*` as `registry.json` plus one JSON file per item.

## Development

```bash
pnpm --filter @tile-ui/buildx test
pnpm --filter @tile-ui/buildx lint
```
