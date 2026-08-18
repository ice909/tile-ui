import { useState } from 'react';
import { Input } from '@tile-ui/react';

export default function InputDemo() {
	const [value, setValue] = useState('');

	return (
		<div className="component-preview__stack">
			<Input
				label="Project name"
				helperText="Used in your dashboard and generated URLs."
				value={value}
				onChange={(event) => setValue(event.target.value)}
				placeholder="Tile UI Docs"
			/>
			<Input label="Read-only example" helperText="Use this for immutable values or generated fields." defaultValue="tile-ui" readOnly />
			<Input label="Validation example" error="A project name is required before publishing." defaultValue="" />
		</div>
	);
}
