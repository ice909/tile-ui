import { Calendar } from '../../src/components/calendar/calendar';

export function Batch3CalendarHydrationFixture() {
	return (
		<Calendar
			data-id="batch3-calendar-root"
			mode="range"
			locale="fr-FR"
			defaultMonth={new Date(2024, 1, 15)}
			today={new Date(2024, 1, 29)}
			defaultSelected={{ from: new Date(2024, 1, 28), to: new Date(2024, 2, 2) }}
			disabled={(date) => date.getDate() === 4}
		/>
	);
}
