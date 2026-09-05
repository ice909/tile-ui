import { createSignal } from 'solid-js';
import { Liveline, LivelineTransition } from '../../src/components/liveline';

const points = [{ time: 1, value: 42 }];

export function LivelineHydrationFixture() {
	const [value, setValue] = createSignal(42);
	return (
		<div data-id="liveline-fixture">
			<Liveline data={points} value={value()} showValue windows={[{ label: '30s', secs: 30 }]} aria-label="Hydrated live chart" />
			<LivelineTransition active="line">{(key) => <div>{key === 'line' ? 'Line' : 'Candle'}</div>}</LivelineTransition>
			<button data-id="liveline-update" onClick={() => setValue(43)}>
				Update
			</button>
		</div>
	);
}
