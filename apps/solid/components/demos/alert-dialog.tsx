import { createSignal } from 'solid-js';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '@tile-ui/solid';

export default function AlertDialogDemo() {
	const [result, setResult] = createSignal('No decision yet');
	return (
		<div class="component-preview__stack" data-demo-alert-dialog>
			<AlertDialog onOpenChange={(open) => !open && setResult((value) => (value === 'No decision yet' ? 'Dismissed outside or with Escape' : value))}>
				<AlertDialogTrigger class="component-preview__action">Delete workspace</AlertDialogTrigger>
				<AlertDialogContent onPointerDownOutside={(event) => event.preventDefault()}>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete the Solid workspace?</AlertDialogTitle>
						<AlertDialogDescription>Pointer interaction outside is blocked; Tab stays inside until you choose an action.</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel onClick={() => setResult('Cancelled')}>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={() => setResult('Deleted')}>Delete</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
			<p data-demo-state>{result()}</p>
		</div>
	);
}
