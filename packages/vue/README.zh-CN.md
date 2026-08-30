# @tile-ui/vue

[English](./README.md) | [简体中文](./README.zh-CN.md)

基于 `@tile-ui/core` 和 `@tile-ui/styles` 构建的 Vue 组件与组合式函数。

## 安装

```bash
pnpm add @tile-ui/vue @tile-ui/core @tile-ui/styles
```

## 导出内容

- 组件：`Button`、`Input`、`Textarea`、`Label`、`Card`
- Card 子组件：`CardHeader`、`CardTitle`、`CardDescription`、`CardContent`、`CardFooter`
- 组合式函数：`useLocalStorage`、`useSessionStorage`、`useWindowSize`、`useMediaQuery`、`useIsMobile`、`useOnlineStatus`、`useScrollPosition`、`useCopyToClipboard`、`useClickOutside`、`useKeyPress`、`useMousePosition`
- 组合式函数子路径导出：`@tile-ui/vue/composables`

## 使用方式

```vue
<script setup lang="ts">
import '@tile-ui/styles/css/globals.css';

import { Button, Card, CardContent, CardHeader, CardTitle, useMediaQuery } from '@tile-ui/vue';

const isDesktop = useMediaQuery('(min-width: 1024px)');
</script>

<template>
	<Card>
		<CardHeader>
			<CardTitle>{{ isDesktop ? '桌面端' : '移动端' }}</CardTitle>
		</CardHeader>
		<CardContent>
			<Button>Tile UI</Button>
		</CardContent>
	</Card>
</template>
```

## 开发

```bash
pnpm --filter @tile-ui/vue build
pnpm --filter @tile-ui/vue type:check
pnpm --filter @tile-ui/vue lint
```
