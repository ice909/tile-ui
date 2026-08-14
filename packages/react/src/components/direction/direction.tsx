import React, { createContext, useContext } from 'react';
import { normalizeDirection } from '@tile-ui/core';
import type { DirectionBaseProps, DirectionValue } from '@tile-ui/core';

interface DirectionContextValue {
	dir: DirectionValue;
}

const DirectionContext = createContext<DirectionContextValue>({ dir: 'ltr' });

export interface DirectionProviderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'dir'>, DirectionBaseProps {
	/** 阅读方向 (dir 的别名，用于兼容上游 API) */
	direction?: DirectionValue;
}

const DirectionProvider = React.forwardRef<HTMLDivElement, DirectionProviderProps>(({ dir, direction, children, ...props }, ref) => {
	const value: DirectionValue = normalizeDirection(direction ?? dir);

	return (
		<DirectionContext.Provider value={{ dir: value }}>
			<div ref={ref} dir={value} {...props}>
				{children}
			</div>
		</DirectionContext.Provider>
	);
});
DirectionProvider.displayName = 'DirectionProvider';

/**
 * 读取当前阅读方向
 */
function useDirection(): DirectionValue {
	return useContext(DirectionContext).dir;
}

export { DirectionProvider, useDirection };
export default DirectionProvider;
