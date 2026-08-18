import { TCommand, TCommandInput, TCommandList, TCommandEmpty, TCommandGroup, TCommandItem } from '@tile-ui/vue';

export default function CommandDemo() {
	return (
		<TCommand>
			<TCommandInput />
			<TCommandList>
				<TCommandEmpty>No results found.</TCommandEmpty>
				<TCommandGroup heading="Suggestions">
					<TCommandItem value="calendar">Calendar</TCommandItem>
					<TCommandItem value="search">Search</TCommandItem>
				</TCommandGroup>
			</TCommandList>
		</TCommand>
	);
}
