import { useState } from 'react';
import { Textarea } from '@tile-ui/react';

export default function TextareaDemo() {
	const [value, setValue] = useState('');

	return (
		<div className="component-preview__stack">
			<Textarea
				label="Summary"
				helperText="Keep it short and specific for reviewers."
				value={value}
				onChange={(event) => setValue(event.target.value)}
				placeholder="Describe the release in one paragraph"
			/>
			<Textarea label="Validation example" error="Please provide at least 20 characters before submitting." defaultValue="Too short" />
		</div>
	);
}
