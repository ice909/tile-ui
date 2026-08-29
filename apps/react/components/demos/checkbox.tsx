import { useState } from 'react';
import { Checkbox } from '@tile-ui/react';

export default function CheckboxDemo() {
	const [checked, setChecked] = useState(true);

	return (
		<div className="button-group">
			<Checkbox checked={checked} onCheckedChange={(next) => setChecked(next === true)} aria-label="Accept terms" />
			<Checkbox checked="indeterminate" aria-label="Indeterminate checkbox" />
			<Checkbox disabled aria-label="Disabled checkbox" />
		</div>
	);
}
