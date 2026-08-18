import { useMediaQuery } from '@tile-ui/react/hooks';

export default function UseMediaQueryDemo() {
	const isCompact = useMediaQuery('(max-width: 640px)');

	return (
		<div className="component-preview__stack">
			<div className="card-link">
				<p className="component-preview__text">
					{isCompact
						? 'Compact mode simulates a mobile layout with tighter spacing and fewer secondary controls.'
						: 'Expanded mode simulates a desktop layout with more room for metadata and supporting actions.'}
				</p>
			</div>
		</div>
	);
}
