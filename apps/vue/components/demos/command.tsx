import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@tile-ui/vue';

export default function CommandDemo() {
	return (
		<Command>
			<CommandInput placeholder="Type a command..." />
			<CommandList>
				<CommandEmpty>No results found.</CommandEmpty>
				<CommandGroup heading="Suggestions">
					<CommandItem value="calendar">Calendar</CommandItem>
					<CommandItem value="search">Search</CommandItem>
					<CommandItem value="settings">Settings</CommandItem>
				</CommandGroup>
			</CommandList>
		</Command>
	);
}
