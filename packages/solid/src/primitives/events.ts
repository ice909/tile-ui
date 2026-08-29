import { createEffect, createSignal, onCleanup, onMount, type Accessor } from 'solid-js';

export interface CopyToClipboardOptions {
	timeout?: number;
}

export interface CopyToClipboardResult {
	copy: (text: string) => Promise<boolean>;
	copied: Accessor<boolean>;
	error: Accessor<Error | null>;
}

export type ElementAccessor<T extends Element = HTMLElement> = Accessor<T | null | undefined>;
export type KeyValue = string | Accessor<string>;

function normalizeError(error: unknown): Error {
	return error instanceof Error ? error : new Error('Failed to copy');
}

/** 创建仅使用安全 Clipboard API 的复制状态。 */
export function createCopyToClipboard(options: CopyToClipboardOptions = {}): CopyToClipboardResult {
	const timeout = options.timeout ?? 2000;
	const [copied, setCopied] = createSignal(false);
	const [error, setError] = createSignal<Error | null>(null);
	let timer: ReturnType<typeof setTimeout> | undefined;
	let generation = 0;
	let disposed = false;

	onCleanup(() => {
		disposed = true;
		generation += 1;
		if (timer !== undefined) {
			clearTimeout(timer);
			timer = undefined;
		}
	});

	async function copy(text: string): Promise<boolean> {
		const operation = ++generation;
		if (timer !== undefined) {
			clearTimeout(timer);
			timer = undefined;
		}

		if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
			if (!disposed && operation === generation) {
				setCopied(false);
				setError(new Error('Clipboard API not available'));
			}
			return false;
		}

		try {
			await navigator.clipboard.writeText(text);
			if (disposed || operation !== generation) return true;
			setCopied(true);
			setError(null);
			if (timeout !== 0) {
				timer = setTimeout(() => {
					if (disposed || operation !== generation) return;
					timer = undefined;
					setCopied(false);
					setError(null);
				}, timeout);
			}
			return true;
		} catch (cause) {
			if (!disposed && operation === generation) {
				setCopied(false);
				setError(normalizeError(cause));
			}
			return false;
		}
	}

	return { copy, copied, error };
}

/** 在元素所属 document 中监听统一的指针按下事件。 */
export function createClickOutside<T extends Element = HTMLElement>(element: ElementAccessor<T>, callback: (event: PointerEvent) => void): void {
	onMount(() => {
		let activeDocument: Document | undefined;
		const handlePointer = (event: PointerEvent) => {
			const current = element();
			if (!current) return;
			const path = event.composedPath?.();
			const inside = path ? path.includes(current) : event.target !== null && current.contains(event.target as Node);
			if (!inside) callback(event);
		};
		const unbind = () => {
			activeDocument?.removeEventListener('pointerdown', handlePointer);
		};

		createEffect(() => {
			const nextDocument = element()?.ownerDocument;
			if (nextDocument === activeDocument) return;
			unbind();
			activeDocument = nextDocument;
			activeDocument?.addEventListener('pointerdown', handlePointer);
		});

		onCleanup(unbind);
	});
}

/** 监听当前全局 window 的 keydown，并精确匹配响应式 event.key。 */
export function createKeyPress(key: KeyValue, callback: (event: KeyboardEvent) => void): void {
	onMount(() => {
		if (typeof window === 'undefined') return;
		const handleKeyDown = (event: KeyboardEvent) => {
			const currentKey = typeof key === 'function' ? key() : key;
			if (event.key === currentKey) callback(event);
		};
		window.addEventListener('keydown', handleKeyDown);
		onCleanup(() => window.removeEventListener('keydown', handleKeyDown));
	});
}
