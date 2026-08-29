import { createSignal } from 'solid-js';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut } from '@tile-ui/solid';

export default function CommandDemo() {
	const [selected, setSelected] = createSignal('Nothing selected');
	return (
		<div class="component-preview__stack" data-demo-command>
			<Command loop>
				<CommandInput placeholder="Filter actions" aria-label="Filter actions" />
				<CommandList>
					<CommandEmpty>No action matches.</CommandEmpty>
					<CommandGroup heading="Navigation">
						<CommandItem value="open-docs" keywords={['documentation']} onSelect={() => setSelected('Opened docs')}>
							Open docs<CommandShortcut>Enter</CommandShortcut>
						</CommandItem>
						<CommandItem value="show-registry" keywords={['manifest']} onSelect={() => setSelected('Opened registry')}>
							Show registry
						</CommandItem>
					</CommandGroup>
					<CommandSeparator />
					<CommandGroup heading="Workspace">
						<CommandItem value="delete-workspace" onSelect={() => setSelected('Delete requested')}>
							Delete workspace
						</CommandItem>
					</CommandGroup>
				</CommandList>
			</Command>
			<button type="button" data-after-command>
				Tab exits the command
			</button>
			<p data-demo-state>{selected()}</p>
		</div>
	);
}
