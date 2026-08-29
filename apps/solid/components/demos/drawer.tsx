import { createSignal } from 'solid-js';
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from '@tile-ui/solid';

export default function DrawerDemo() {
	const [modal, setModal] = createSignal(true);
	return (
		<div class="component-preview__stack" data-demo-drawer>
			<label>
				<input type="checkbox" checked={modal()} onChange={(event) => setModal(event.currentTarget.checked)} /> Modal behavior
			</label>
			<Drawer direction="bottom" modal={modal()}>
				<DrawerTrigger class="component-preview__action">Open activity drawer</DrawerTrigger>
				<DrawerContent>
					<DrawerHeader>
						<DrawerTitle>Build activity</DrawerTitle>
						<DrawerDescription>{modal() ? 'Focus is contained and the page is inert.' : 'Non-modal mode allows page interaction.'}</DrawerDescription>
					</DrawerHeader>
					<a href="/docs/registry">Inspect registry policy</a>
					<DrawerFooter>
						<DrawerClose>Close drawer</DrawerClose>
					</DrawerFooter>
				</DrawerContent>
			</Drawer>
		</div>
	);
}
