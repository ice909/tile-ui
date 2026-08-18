import { Spinner } from '@tile-ui/react';

export default function SpinnerDemo() {
	return (
		<div className="button-group">
			<Spinner size="sm" />
			<Spinner />
			<Spinner size="lg" />
		</div>
	);
}
