import { createSignal } from 'solid-js';
import { Combobox } from '../../src/components/combobox/combobox';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '../../src/components/command/command';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '../../src/components/select/select';

const items = [
	{ value: 'alpha', label: 'Alpha', keywords: ['first'] },
	{ value: 'beta', label: 'Beta', keywords: ['second'] },
];
const maliciousLabel = '<img src=x onerror=alert(1)> & "quoted"';

export function Batch4SelectionHydrationFixture() {
	const [selectOpen, setSelectOpen] = createSignal(false);
	const [comboboxValue, setComboboxValue] = createSignal('alpha');
	return (
		<div data-id="batch4-selection-root">
			<Select defaultValue="malicious" selectedText={maliciousLabel} triggerId="fixture-malicious-trigger" contentId="fixture-malicious-list">
				<SelectTrigger>
					<SelectValue placeholder="Missing" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="malicious">{maliciousLabel}</SelectItem>
				</SelectContent>
			</Select>
			<Select defaultOpen contentId="fixture-groups-list">
				<SelectTrigger>Groups</SelectTrigger>
				<SelectContent>
					<SelectGroup id="fixture-labelled-group" labelId="fixture-label">
						<SelectLabel id="fixture-label">Named</SelectLabel>
						<SelectItem value="named">Named item</SelectItem>
					</SelectGroup>
					<SelectGroup id="fixture-unlabelled-group">
						<SelectItem value="plain">Plain item</SelectItem>
					</SelectGroup>
				</SelectContent>
			</Select>
			<Select open={selectOpen()} onOpenChange={setSelectOpen} defaultValue="alpha" selectedText="Alpha" triggerId="fixture-select-trigger" contentId="fixture-select-list">
				<SelectTrigger>
					<SelectValue placeholder="Choose" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="alpha">Alpha</SelectItem>
					<SelectItem value="beta">Beta</SelectItem>
				</SelectContent>
			</Select>
			<Combobox items={items} value={comboboxValue()} onValueChange={setComboboxValue} triggerId="fixture-combobox-trigger" contentId="fixture-combobox-list" />
			<Command defaultSearch="alpha" listId="fixture-command-list">
				<CommandInput />
				<CommandList>
					<CommandEmpty>Nothing</CommandEmpty>
					<CommandGroup id="fixture-visible-group" heading="Visible" headingId="fixture-visible-heading">
						<CommandItem value="alpha-code">Alpha Label</CommandItem>
					</CommandGroup>
					<CommandGroup id="fixture-hidden-group" heading="Hidden">
						<CommandItem value="beta-code">Beta Label</CommandItem>
					</CommandGroup>
					<CommandSeparator />
				</CommandList>
			</Command>
			<button type="button" data-id="open-select" onClick={() => setSelectOpen(true)}>
				Open
			</button>
		</div>
	);
}
