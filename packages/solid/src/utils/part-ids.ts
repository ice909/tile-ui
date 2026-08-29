import { createSignal, type Accessor } from 'solid-js';

export type CompositePart = 'trigger' | 'content' | 'title' | 'description';

export interface CompositeIdRegistry {
	id: (part: CompositePart) => Accessor<string | undefined>;
	register: (part: CompositePart, id?: string) => () => void;
}

/** 创建稳定的 trigger/content ID，并按挂载顺序注册 title/description ID。 */
export function createCompositeIdRegistry(baseId: string): CompositeIdRegistry {
	const registrations = new Map<CompositePart, string[]>([
		['trigger', [`${baseId}-trigger`]],
		['content', [`${baseId}-content`]],
	]);
	const signals = new Map<CompositePart, ReturnType<typeof createSignal<string | undefined>>>();
	const getSignal = (part: CompositePart) => {
		let signal = signals.get(part);
		if (!signal) {
			signal = createSignal(registrations.get(part)?.at(-1));
			signals.set(part, signal);
		}
		return signal;
	};
	return {
		id(part) {
			return getSignal(part)[0];
		},
		register(part, id = `${baseId}-${part}`) {
			const values = registrations.get(part) ?? [];
			values.push(id);
			registrations.set(part, values);
			getSignal(part)[1](id);
			let active = true;
			return () => {
				if (!active) return;
				active = false;
				const index = values.lastIndexOf(id);
				if (index !== -1) values.splice(index, 1);
				getSignal(part)[1](values.at(-1));
			};
		},
	};
}
