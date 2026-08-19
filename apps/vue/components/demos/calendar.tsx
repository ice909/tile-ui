import { Calendar, toast } from '@tile-ui/vue';

export default function CalendarDemo() {
	return (
		<Calendar
			mode="single"
			onSelect={(selection) => {
				toast.info(`Selected ${selection instanceof Date ? selection.toDateString() : 'date'}`);
			}}
		/>
	);
}
