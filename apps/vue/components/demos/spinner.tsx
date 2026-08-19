import { Spinner } from '@tile-ui/vue';

export default function SpinnerDemo() {
	return (
		<div class="button-group">
			<Spinner size="sm" />
			<Spinner />
			<Spinner size="lg" />
		</div>
	);
}
