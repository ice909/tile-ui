# @tile-ui/core

[English](./README.md) | [简体中文](./README.zh-CN.md)

Tile UI 各子包共享的框架无关逻辑、类型、工具函数和设计令牌。

## 安装

```bash
pnpm add @tile-ui/core
```

## 导出内容

- Button、Input、Textarea、Label 和 Card 的组件逻辑与类型
- 来自 `@tile-ui/core/utils` 的工具函数
- 通过 `tokens` 提供的设计令牌

## 使用方式

```ts
import { cn, getButtonStyleKeys, type ButtonVariant, tokens } from '@tile-ui/core';

const styleKeys = getButtonStyleKeys({ variant: 'default' as ButtonVariant });
const className = cn('tile-button', ...styleKeys);
const primaryColor = tokens.colors.primary;
```

## 包入口

- `@tile-ui/core`
- `@tile-ui/core/utils`
- `@tile-ui/core/tokens`

## 开发

```bash
pnpm --filter @tile-ui/core build
pnpm --filter @tile-ui/core type:check
pnpm --filter @tile-ui/core lint
```
