import { Toaster, toast, useToast } from '../../src/components/sonner/sonner';

function Deep(props: { depth: number }) {
	return props.depth === 0 ? (
		<Toaster data-id="sonner-root" theme="system" richColors />
	) : (
		<section data-depth={props.depth}>
			<Deep depth={props.depth - 1} />
		</section>
	);
}

export function Batch5SonnerHydrationFixture() {
	const state = useToast();
	return (
		<main data-id="sonner-app">
			<output data-id="sonner-count">{state.toasts().length}</output>
			<Deep depth={24} />
			<button data-id="sonner-create" onClick={() => toast.success('Hydrated toast', { duration: 0 })}>
				Create
			</button>
		</main>
	);
}
