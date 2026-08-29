import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@tile-ui/react';

export default function CommandDemo() {
	return (
		<Command>
			<CommandInput placeholder="Type a command..." aria-label="Search commands" />
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
