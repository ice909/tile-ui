import { Show, createSignal } from 'solid-js';

import {
	createClickOutside,
	createCopyToClipboard,
	createIsMobile,
	createKeyPress,
	createLocalStorage,
	createMediaQuery,
	createMousePosition,
	createOnlineStatus,
	createScrollPosition,
	createSessionStorage,
	createWindowSize,
} from '@tile-ui/solid/primitives';

function PrimitiveOwner(props: { generation: number; onKeyPress: () => void; onOutsidePress: () => void }) {
	const [localCount, setLocalCount] = createLocalStorage('tile-solid-primitives-local', 0);
	const [sessionCount, setSessionCount] = createSessionStorage('tile-solid-primitives-session', 0);
	const windowSize = createWindowSize();
	const wideViewport = createMediaQuery('(min-width: 900px)');
	const isMobile = createIsMobile();
	const online = createOnlineStatus();
	const scroll = createScrollPosition();
	const mouse = createMousePosition();
	const clipboard = createCopyToClipboard({ timeout: 1600 });
	let outsideTarget: HTMLElement | undefined;

	createKeyPress('p', props.onKeyPress);
	createClickOutside(() => outsideTarget, props.onOutsidePress);

	return (
		<div class="primitive-dashboard" data-generation={props.generation}>
			<div class="primitive-dashboard__status">
				<span>Owner #{props.generation}</span>
				<span>{online() ? 'online' : 'offline'}</span>
				<span>{isMobile() ? 'mobile' : wideViewport() ? 'wide' : 'compact'}</span>
			</div>

			<div class="primitive-dashboard__grid">
				<section>
					<p>Storage</p>
					<strong>{localCount()} local</strong>
					<span>{sessionCount()} session</span>
					<div>
						<button type="button" onClick={() => setLocalCount((value) => value + 1)}>
							Local +1
						</button>
						<button type="button" onClick={() => setSessionCount((value) => value + 1)}>
							Session +1
						</button>
					</div>
				</section>

				<section>
					<p>Viewport</p>
					<strong>
						{windowSize().width} × {windowSize().height}
					</strong>
					<span>
						scroll {Math.round(scroll().x)}, {Math.round(scroll().y)}
					</span>
					<span>
						mouse {Math.round(mouse().x)}, {Math.round(mouse().y)}
					</span>
				</section>

				<section ref={(element) => (outsideTarget = element)} class="primitive-dashboard__outside">
					<p>Events</p>
					<strong>Press P</strong>
					<span>Click outside this card to exercise cleanup-safe document listeners.</span>
				</section>

				<section>
					<p>Clipboard</p>
					<strong>{clipboard.copied() ? 'Copied' : clipboard.error() ? 'Clipboard unavailable' : 'Ready'}</strong>
					<button type="button" onClick={() => void clipboard.copy('Tile UI Solid primitives')}>
						Copy label
					</button>
					<span class="sr-only" role="status" aria-live="polite" aria-atomic="true">
						{clipboard.copied() ? 'Primitive label copied to clipboard.' : clipboard.error() ? 'Unable to copy the primitive label.' : ''}
					</span>
				</section>
			</div>
		</div>
	);
}

export default function PrimitivesDemo() {
	const [mounted, setMounted] = createSignal(true);
	const [generation, setGeneration] = createSignal(1);
	const [keyPresses, setKeyPresses] = createSignal(0);
	const [outsidePresses, setOutsidePresses] = createSignal(0);
	const [eventFeedback, setEventFeedback] = createSignal('');

	function toggleOwner() {
		setMounted((value) => {
			if (!value) setGeneration((current) => current + 1);
			return !value;
		});
	}

	function handleKeyPress() {
		const count = keyPresses() + 1;
		setKeyPresses(count);
		setEventFeedback(`P key observed ${count} ${count === 1 ? 'time' : 'times'}.`);
	}

	function handleOutsidePress() {
		const count = outsidePresses() + 1;
		setOutsidePresses(count);
		setEventFeedback(`Outside press observed ${count} ${count === 1 ? 'time' : 'times'}.`);
	}

	return (
		<div class="primitive-demo">
			<div class="primitive-demo__controls">
				<button type="button" onClick={toggleOwner}>
					{mounted() ? 'Dispose owner' : 'Remount owner'}
				</button>
				<span aria-hidden="true">{keyPresses()} P key events</span>
				<span aria-hidden="true">{outsidePresses()} outside presses</span>
				<span class="sr-only" role="status" aria-live="polite" aria-atomic="true">
					{eventFeedback()}
				</span>
			</div>
			<Show when={mounted()} fallback={<p class="primitive-demo__disposed">Owner disposed. Press P or move the pointer, then remount to observe fresh subscriptions.</p>}>
				<PrimitiveOwner generation={generation()} onKeyPress={handleKeyPress} onOutsidePress={handleOutsidePress} />
			</Show>
		</div>
	);
}
