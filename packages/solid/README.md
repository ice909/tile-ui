# @tile-ui/solid

Tile UI 的 SolidJS 包，包含 61 个组件、Solid 原生运行时 primitives，并复用 `@tile-ui/core` 逻辑和 `@tile-ui/styles` SCSS 设计系统。

## 安装

```bash
corepack pnpm add @tile-ui/solid @tile-ui/styles solid-js
```

```tsx
import { Button, Toggle } from '@tile-ui/solid';

export function Example() {
	return (
		<>
			<Button variant="outline">保存</Button>
			<Toggle defaultPressed>加粗</Toggle>
		</>
	);
}
```

## Primitives

运行时能力统一使用 Solid 风格的 `create*` 命名，并从规范子路径导入；这些 API 不从包根入口重新导出。

```tsx
import { createIsMobile, createLocalStorage, createWindowSize } from '@tile-ui/solid/primitives';

const [theme, setTheme] = createLocalStorage('theme', 'light');
const isMobile = createIsMobile();
const windowSize = createWindowSize();
```

所有 primitive 都绑定当前 Solid owner，在挂载时读取浏览器状态和注册监听，并在 owner 清理时移除监听。服务端不读取或订阅浏览器全局，确定性默认值为：窗口、滚动与鼠标坐标均为 `0`，媒体查询为 `false`，在线状态为 `true`；存储使用传入的值或惰性默认值。异步剪贴板操作在 owner 清理后不会更新信号或创建计时器，并且只有最后一次复制操作可以提交当前状态。

## 运行时契约

- 包构建为 ESM。Solid 的预编译输出通过条件导出区分浏览器渲染和 Node SSR。
- `browser` 条件加载可 hydration 的 DOM 输出，`node` 条件加载 SSR 输出；消费端构建工具必须支持 package exports conditions。
- `@tile-ui/solid/primitives` 同样提供独立的 `browser` / `node` 条件入口和声明文件。
- 样式通过 `@tile-ui/styles` SCSS 模块导入，消费端需要配置 Sass/CSS Modules。
- 61 个组件从 `@tile-ui/solid` 导入；11 个运行时 primitive 仅从 `@tile-ui/solid/primitives` 导入。
