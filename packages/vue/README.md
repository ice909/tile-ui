# @tile-ui/vue

[English](./README.md) | [简体中文](./README.zh-CN.md)

Vue components and composables built on top of `@tile-ui/core` and `@tile-ui/styles`.

## Installation

```bash
pnpm add @tile-ui/vue @tile-ui/core @tile-ui/styles
```

## Exports

- Components: `Button`, `Input`, `Textarea`, `Label`, `Card`
- Card parts: `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`
- Composables: `useLocalStorage`, `useSessionStorage`, `useWindowSize`, `useMediaQuery`, `useIsMobile`, `useOnlineStatus`, `useScrollPosition`, `useCopyToClipboard`, `useClickOutside`, `useKeyPress`, `useMousePosition`
- Composables subpath export: `@tile-ui/vue/composables`

## Usage

```vue
<script setup lang="ts">
import '@tile-ui/styles/css/globals.css';

import { Button, Card, CardContent, CardHeader, CardTitle, useMediaQuery } from '@tile-ui/vue';

const isDesktop = useMediaQuery('(min-width: 1024px)');
</script>

<template>
	<Card>
		<CardHeader>
			<CardTitle>{{ isDesktop ? 'Desktop' : 'Mobile' }}</CardTitle>
		</CardHeader>
		<CardContent>
			<Button>Tile UI</Button>
		</CardContent>
	</Card>
</template>
```

## Development

```bash
pnpm --filter @tile-ui/vue build
pnpm --filter @tile-ui/vue type:check
pnpm --filter @tile-ui/vue lint
```
