import { Spinner } from '@tile-ui/solid';
export default function SpinnerDemo() {
	return (
		<div class="button-group">
			<Spinner size="sm" aria-label="Loading small preview" />
			<Spinner />
			<Spinner size="lg" aria-label="Loading large preview" />
		</div>
	);
}
