import { TCalendar, toast } from '@tile-ui/vue';

export default function CalendarDemo() {
	return (
		<TCalendar
			mode="single"
			onSelect={(selection) => {
				toast.info(`Selected ${selection instanceof Date ? selection.toDateString() : 'date'}`);
			}}
		/>
	);
}
