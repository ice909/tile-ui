import { Show, createSignal } from 'solid-js';
import { Avatar, AvatarFallback, AvatarImage } from '@tile-ui/solid';

export function AvatarHydrationFixture() {
	const [src, setSrc] = createSignal('/avatar-a.png');
	const [visible, setVisible] = createSignal(true);
	return (
		<main>
			<Avatar>
				<AvatarImage data-id="cached-avatar" src="/cached-avatar.png" alt="Cached avatar" />
				<AvatarFallback data-id="cached-avatar-fallback">TU</AvatarFallback>
			</Avatar>
			<Avatar>
				<AvatarImage data-id="broken-avatar" src="/broken-avatar.png" alt="Broken avatar" />
				<AvatarFallback data-id="broken-avatar-fallback">BR</AvatarFallback>
			</Avatar>
			<Show when={visible()}>
				<Avatar>
					<AvatarImage data-id="reactive-avatar" src={src()} alt="Reactive avatar" />
					<AvatarFallback data-id="reactive-avatar-fallback">RX</AvatarFallback>
				</Avatar>
			</Show>
			<button data-id="avatar-b" type="button" onClick={() => setSrc('/avatar-b.png')}>
				Avatar B
			</button>
			<button data-id="avatar-a" type="button" onClick={() => setSrc('/avatar-a.png')}>
				Avatar A
			</button>
			<button data-id="avatar-unmount" type="button" onClick={() => setVisible(false)}>
				Unmount Avatar
			</button>
		</main>
	);
}
