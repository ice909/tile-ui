import { useState } from 'react';
import { DirectionProvider, Button } from '@tile-ui/react';

export default function DirectionDemo() {
	const [rtl, setRtl] = useState(false);

	return (
		<div className="component-preview__stack">
			<DirectionProvider dir={rtl ? 'rtl' : 'ltr'}>
				<div style={{ display: 'flex', gap: 8 }}>
					<span className="component-preview__text">One</span>
					<span className="component-preview__text">Two</span>
					<span className="component-preview__text">Three</span>
				</div>
			</DirectionProvider>
			<div className="button-group">
				<Button variant="outline" onClick={() => setRtl((v) => !v)}>
					{rtl ? 'RTL' : 'LTR'}
				</Button>
			</div>
		</div>
	);
}
