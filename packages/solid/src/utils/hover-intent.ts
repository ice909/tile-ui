export type HoverIntentOwner = 'trigger' | 'content';

export interface HoverIntentOptions {
	open: () => boolean;
	openDelay?: number;
	closeDelay?: number;
	reopenOnHoverAfterExternalClose?: boolean;
	onOpenChange: (open: boolean) => void;
	setTimeout?: typeof globalThis.setTimeout;
	clearTimeout?: typeof globalThis.clearTimeout;
}

export interface HoverIntentController {
	enter: (owner: HoverIntentOwner) => void;
	leave: (owner: HoverIntentOwner) => void;
	sync: () => void;
	cancel: () => void;
	destroy: () => void;
}

/** 管理 trigger/content 悬停意图，并与受控或外部 open 状态同步。 */
export function createHoverIntent(options: HoverIntentOptions): HoverIntentController {
	const owners = new Set<HoverIntentOwner>();
	const schedule = options.setTimeout ?? globalThis.setTimeout;
	const cancelTimer = options.clearTimeout ?? globalThis.clearTimeout;
	let timer: ReturnType<typeof setTimeout> | undefined;
	let destroyed = false;
	let observedOpen = options.open();
	const cancel = () => {
		if (timer !== undefined) cancelTimer(timer);
		timer = undefined;
	};
	const queue = (nextOpen: boolean, delay: number) => {
		cancel();
		if (nextOpen === options.open()) return;
		timer = schedule(() => {
			timer = undefined;
			if (!destroyed && nextOpen !== options.open() && (nextOpen ? owners.size > 0 : owners.size === 0)) options.onOpenChange(nextOpen);
		}, delay);
	};
	const sync = () => {
		if (destroyed) return;
		const nextOpen = options.open();
		if (nextOpen === observedOpen) return;
		observedOpen = nextOpen;
		cancel();
		if (!nextOpen && owners.size > 0 && options.reopenOnHoverAfterExternalClose !== false) queue(true, options.openDelay ?? 0);
	};
	return {
		enter(owner) {
			if (destroyed) return;
			sync();
			const wasEmpty = owners.size === 0;
			owners.add(owner);
			if (wasEmpty) queue(true, options.openDelay ?? 0);
			else cancel();
		},
		leave(owner) {
			if (destroyed) return;
			sync();
			owners.delete(owner);
			if (owners.size === 0) queue(false, options.closeDelay ?? 0);
		},
		sync,
		cancel,
		destroy() {
			destroyed = true;
			owners.clear();
			cancel();
		},
	};
}
