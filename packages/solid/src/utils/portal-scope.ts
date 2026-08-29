import { createContext, useContext, type Accessor, type Context } from 'solid-js';

export interface PortalScope {
	parent?: PortalScope;
	container: Accessor<Node | undefined>;
	addBranch: (node: Node) => () => void;
	getBranches: () => Node[];
}

interface InternalPortalScope extends PortalScope {
	branchCounts: Map<Node, number>;
	changeBranchCount: (node: Node, delta: number) => void;
}

export const PortalScopeContext: Context<PortalScope | undefined> = createContext<PortalScope>();

/** 创建继承 Portal 容器、向祖先传播后代分支所有权的作用域。 */
export function createPortalScope(container: Accessor<Node | undefined> = () => undefined, parent?: PortalScope): PortalScope {
	const branchCounts = new Map<Node, number>();
	const internalParent = parent as InternalPortalScope | undefined;
	const scope: InternalPortalScope = {
		parent,
		container,
		branchCounts,
		changeBranchCount(node, delta) {
			const next = (branchCounts.get(node) ?? 0) + delta;
			if (next > 0) branchCounts.set(node, next);
			else branchCounts.delete(node);
			internalParent?.changeBranchCount(node, delta);
		},
		addBranch(node) {
			scope.changeBranchCount(node, 1);
			let active = true;
			return () => {
				if (!active) return;
				active = false;
				scope.changeBranchCount(node, -1);
			};
		},
		getBranches() {
			return [...branchCounts.keys()];
		},
	};
	return scope;
}

/** 读取最近的 Portal 作用域；缺少 Provider 时返回 undefined。 */
export function usePortalScope(): PortalScope | undefined {
	return useContext(PortalScopeContext);
}

/** 优先使用显式容器，否则沿作用域向上继承第一个可用容器。 */
export function resolvePortalContainer(scope?: PortalScope, explicit?: Node): Node | undefined {
	if (explicit) return explicit;
	for (let current = scope; current; current = current.parent) {
		const container = current.container();
		if (container) return container;
	}
	return undefined;
}
