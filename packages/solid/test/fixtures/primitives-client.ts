import { createRoot } from 'solid-js';
import { createLocalStorage, createWindowSize } from '@tile-ui/solid/primitives';

export function exercisePrimitives() {
	let dispose!: () => void;
	let size!: ReturnType<typeof createWindowSize>;
	let stored!: () => number;
	createRoot((ownerDispose) => {
		dispose = ownerDispose;
		size = createWindowSize();
		const [value, setValue] = createLocalStorage('artifact-counter', 1);
		stored = value;
		setValue((previous) => previous + 1);
	});
	return { dispose, size, stored };
}
