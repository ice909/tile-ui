import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@tile-ui/vue';

export default function CommandDemo() {
	return (
		<Command>
			<CommandInput />
			<CommandList>
				<CommandEmpty>No results found.</CommandEmpty>
				<CommandGroup heading="Suggestions">
					<CommandItem value="calendar">Calendar</CommandItem>
					<CommandItem value="search">Search</CommandItem>
				</CommandGroup>
			</CommandList>
		</Command>
	);
}
