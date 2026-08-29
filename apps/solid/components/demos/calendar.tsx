import { createSignal } from 'solid-js';
import { Calendar } from '@tile-ui/solid';

const defaultMonth = new Date(2026, 7, 1);
const today = new Date(2026, 7, 28);

export default function CalendarDemo() {
	const [range, setRange] = createSignal<{ from?: Date; to?: Date }>({});
	const format = (date?: Date) => date?.toLocaleDateString('en-CA') ?? 'none';
	return (
		<div class="component-preview__stack" data-demo-range-calendar>
			<Calendar
				mode="range"
				defaultMonth={defaultMonth}
				today={today}
				selected={range()}
				onSelect={(value) => setRange(value && !(value instanceof Date) && !Array.isArray(value) ? value : {})}
			/>
			<p class="component-preview__text" data-range-state>
				Range: {format(range().from)} to {format(range().to)}
			</p>
		</div>
	);
}
