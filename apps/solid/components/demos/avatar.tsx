import { Show, createSignal, onMount } from 'solid-js';
import { Avatar, AvatarFallback, AvatarImage, Button } from '@tile-ui/solid';

const validAvatar =
	'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64"%3E%3Crect width="64" height="64" fill="%23f59e0b"/%3E%3Ctext x="32" y="40" text-anchor="middle" font-size="24"%3ES%3C/text%3E%3C/svg%3E';

export default function AvatarDemo() {
	const [src, setSrc] = createSignal(validAvatar);
	const [mounted, setMounted] = createSignal(false);
	const [state, setState] = createSignal('Fallback visible');
	onMount(() => setMounted(true));
	return (
		<div class="component-preview__stack">
			<Avatar size="lg">
				<Show when={mounted()}>
					<AvatarImage src={src()} alt="Solid avatar" onLoad={() => setState('Image loaded')} onError={() => setState('Fallback visible')} />
				</Show>
				<AvatarFallback>TU</AvatarFallback>
			</Avatar>
			<div class="button-group">
				<Button size="sm" variant="outline" onClick={() => setSrc(validAvatar)}>
					Load image
				</Button>
				<Button size="sm" variant="outline" onClick={() => setSrc('data:image/png;base64,broken')}>
					Break image
				</Button>
			</div>
			<p aria-live="polite">{state()}</p>
		</div>
	);
}
