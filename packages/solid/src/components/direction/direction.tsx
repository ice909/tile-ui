import { createContext, splitProps, useContext, type Accessor, type JSX, type ParentProps } from 'solid-js';
import { normalizeDirection } from '@tile-ui/core';
import type { DirectionBaseProps, DirectionValue } from '@tile-ui/core';

const defaultDirection: Accessor<DirectionValue> = () => 'ltr';
const DirectionContext = createContext<Accessor<DirectionValue>>(defaultDirection);

export interface DirectionProviderProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'dir'>, DirectionBaseProps {
	/** 阅读方向 (dir 的别名，用于兼容上游 API)。 */
	direction?: DirectionValue;
}

/** 提供响应式阅读方向，并将规范化后的方向写入真实 DOM 包装节点。 */
export function DirectionProvider(props: ParentProps<DirectionProviderProps>) {
	const [local, rest] = splitProps(props, ['class', 'children', 'dir', 'direction']);
	const direction = () => normalizeDirection(local.direction ?? local.dir);

	return (
		<DirectionContext.Provider value={direction}>
			<div {...rest} dir={direction()} class={local.class}>
				{local.children}
			</div>
		</DirectionContext.Provider>
	);
}

/** 读取当前响应式阅读方向；provider 外固定回退为 ltr。 */
export function useDirection(): Accessor<DirectionValue> {
	return useContext(DirectionContext);
}

export default DirectionProvider;
