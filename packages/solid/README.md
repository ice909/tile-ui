# @tile-ui/solid

[English](./README.md) | [简体中文](./README.zh-CN.md)

Tile UI's SolidJS package, with 62 components and Solid-native runtime primitives built on the shared `@tile-ui/core` logic and `@tile-ui/styles` SCSS design system.

## Installation

```bash
corepack pnpm add @tile-ui/solid @tile-ui/styles solid-js
```

```tsx
import { Button, Toggle } from '@tile-ui/solid';

export function Example() {
	return (
		<>
			<Button variant="outline">Save</Button>
			<Toggle defaultPressed>Bold</Toggle>
		</>
	);
}
```

## Primitives

Runtime utilities use Solid-style `create*` names and are imported from the canonical subpath. These APIs are not re-exported from the package root.

```tsx
import { createIsMobile, createLocalStorage, createWindowSize } from '@tile-ui/solid/primitives';

const [theme, setTheme] = createLocalStorage('theme', 'light');
const isMobile = createIsMobile();
const windowSize = createWindowSize();
```

Every primitive binds to the current Solid owner, reads browser state and registers listeners on mount, and removes those listeners when the owner is disposed. The server does not read or subscribe to browser globals. Deterministic defaults are `0` for window, scroll, and pointer coordinates, `false` for media queries, and `true` for online status; storage uses the provided value or lazy default. Asynchronous clipboard operations do not update signals or create timers after owner disposal, and only the latest copy operation can commit its state.

## Runtime Contract

- The package is built as ESM. Conditional exports select the browser-rendering or Node SSR version of Solid's precompiled output.
- The `browser` condition loads hydratable DOM output, while the `node` condition loads SSR output. Consumer build tools must support package export conditions.
- `@tile-ui/solid/primitives` provides separate `browser` and `node` condition entrypoints and declarations.
- Styles are imported as `@tile-ui/styles` SCSS modules, so consumers must configure Sass and CSS Modules.
- Import the 62 components from `@tile-ui/solid`; import the 11 runtime primitives only from `@tile-ui/solid/primitives`.
