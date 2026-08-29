import { createSignal } from 'solid-js';
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from '@tile-ui/solid';

export default function DropdownMenuDemo() {
	const [grid, setGrid] = createSignal(true);
	const [role, setRole] = createSignal('editor');
	const [action, setAction] = createSignal('Ready');
	return (
		<div class="component-preview__stack" data-demo-dropdown-menu>
			<DropdownMenu>
				<DropdownMenuTrigger class="component-preview__action">Workspace menu</DropdownMenuTrigger>
				<DropdownMenuContent>
					<DropdownMenuLabel>View</DropdownMenuLabel>
					<DropdownMenuCheckboxItem checked={grid()} onCheckedChange={setGrid}>
						Show grid
					</DropdownMenuCheckboxItem>
					<DropdownMenuSeparator />
					<DropdownMenuRadioGroup value={role()} onValueChange={setRole}>
						<DropdownMenuRadioItem value="editor">Editor</DropdownMenuRadioItem>
						<DropdownMenuRadioItem value="reviewer">Reviewer</DropdownMenuRadioItem>
					</DropdownMenuRadioGroup>
					<DropdownMenuSub>
						<DropdownMenuSubTrigger>Share</DropdownMenuSubTrigger>
						<DropdownMenuSubContent>
							<DropdownMenuItem onSelect={() => setAction('Link copied')}>Copy link</DropdownMenuItem>
							<DropdownMenuItem onSelect={() => setAction('Invite opened')}>Invite member</DropdownMenuItem>
						</DropdownMenuSubContent>
					</DropdownMenuSub>
				</DropdownMenuContent>
			</DropdownMenu>
			<p data-demo-state>
				{action()}; grid {grid() ? 'on' : 'off'}; role {role()}.
			</p>
		</div>
	);
}
