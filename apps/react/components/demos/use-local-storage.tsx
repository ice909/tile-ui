import { Button } from '@tile-ui/react';
import { useLocalStorage } from '@tile-ui/react/hooks';

export default function UseLocalStorageDemo() {
	const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'light');

	return (
		<div className="component-preview__stack">
			<div className="button-group">
				<Button variant={theme === 'light' ? 'default' : 'outline'} onClick={() => setTheme('light')}>
					Light
				</Button>
				<Button variant={theme === 'dark' ? 'default' : 'outline'} onClick={() => setTheme('dark')}>
					Dark
				</Button>
			</div>
			<p className="component-preview__text">
				Current theme preference: <strong>{theme}</strong>
			</p>
		</div>
	);
}
