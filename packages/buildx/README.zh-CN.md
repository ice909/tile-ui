# @tile-ui/buildx

[English](./README.md) | [简体中文](./README.zh-CN.md)

Tile UI monorepo 使用的内部 registry 构建工具和测试 fixture。

## 适用范围

此包为 React、Vue 和 Solid 文档应用提供 registry 生成功能，主要供工作区内部使用。

## 导出入口

- `@tile-ui/buildx`
- `@tile-ui/buildx/registry`
- `@tile-ui/buildx/registry/presets/react`
- `@tile-ui/buildx/registry/presets/vue`
- `@tile-ui/buildx/registry/presets/solid`
- `@tile-ui/buildx/registry/types`

## Registry 流程

React、Vue 和 Solid preset 共用同一套构建流程，仅文件转换和虚拟文件组装方式不同。

- `presets/react`、`presets/vue` 和 `presets/solid` 从 `packages/core` 组装 `__virtual__/` core 与 utils 源码，确保 registry 输出不会导入 `@tile-ui/core` 或 `@tile-ui/styles`。
- 转换步骤会将这些工作区导入改写为相对路径，并将 SCSS 模块移动到组件旁（`solid-component`、`solid-barrel`、`react-barrel`、`vue-barrel`、`style` 等）。
- Solid 流程还提供 SSR 安全的 primitives（`@tile-ui/solid/primitives`）：`solid-primitive` 项目会发布三个辅助 payload（`create-local-storage`、`create-media-query`、`create-copy-to-clipboard`），并按照 manifest 中声明的 `exports` 白名单裁剪每个 primitive 文件。
- `validateManifest` 会确保项目名称唯一、每个项目至少包含一个文件，并且所有 `registryDependencies` 均可解析。

输出写入 `apps/{react|vue|solid}/public/r/*`，包括 `registry.json` 和每个项目各自的 JSON 文件。

## 开发

```bash
pnpm --filter @tile-ui/buildx test
pnpm --filter @tile-ui/buildx lint
```
