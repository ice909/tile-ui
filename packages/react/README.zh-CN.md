# @tile-ui/react

[English](./README.md) | [简体中文](./README.zh-CN.md)

基于 `@tile-ui/core` 和 `@tile-ui/styles` 构建的 React 组件与 Hooks。

## 安装

```bash
pnpm add @tile-ui/react @tile-ui/core @tile-ui/styles
```

## 导出内容

- 组件：`Button`、`Input`、`Textarea`、`Label`、`Card`
- Hooks：`useLocalStorage`、`useSessionStorage`、`useWindowSize`、`useMediaQuery`、`useIsMobile`、`useOnlineStatus`、`useScrollPosition`、`useCopyToClipboard`、`useClickOutside`、`useKeyPress`、`useMousePosition`
- Hooks 子路径导出：`@tile-ui/react/hooks`

## 使用方式

```tsx
import '@tile-ui/styles/css/globals.css';

import { Button, Card, CardContent, CardHeader, CardTitle, useMediaQuery } from '@tile-ui/react';

export function ExampleCard() {
	const isDesktop = useMediaQuery('(min-width: 1024px)');

	return (
		<Card>
			<CardHeader>
				<CardTitle>{isDesktop ? '桌面端' : '移动端'}</CardTitle>
			</CardHeader>
			<CardContent>
				<Button>Tile UI</Button>
			</CardContent>
		</Card>
	);
}
```

## 开发

```bash
pnpm --filter @tile-ui/react build
pnpm --filter @tile-ui/react type:check
pnpm --filter @tile-ui/react lint
```
