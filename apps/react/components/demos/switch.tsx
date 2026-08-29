import { useState } from 'react';
import { Switch } from '@tile-ui/react';

export default function SwitchDemo() {
	const [checked, setChecked] = useState(true);

	return (
		<div className="button-group">
			<Switch checked={checked} onCheckedChange={setChecked} aria-label="Enable notifications" />
			<Switch size="sm" aria-label="Compact mode" />
		</div>
	);
}
