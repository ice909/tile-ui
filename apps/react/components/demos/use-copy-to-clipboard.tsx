import { Button } from '@tile-ui/react';
import { useCopyToClipboard } from '@tile-ui/react/hooks';

export default function UseCopyToClipboardDemo() {
	const [copy, { copied }] = useCopyToClipboard();

	return (
		<div className="component-preview__stack">
			<div className="card-link">
				<p className="component-preview__text">Registry URL: https://react.tileui.zmorg.cn/r/button.json</p>
				<div className="button-group">
					<Button onClick={() => void copy('https://react.tileui.zmorg.cn/r/button.json')}>{copied ? 'Copied' : 'Copy URL'}</Button>
				</div>
			</div>
		</div>
	);
}
