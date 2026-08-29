import { createEffect, createSignal, onCleanup, onMount, type Accessor } from 'solid-js';

export interface WindowSize {
	width: number;
	height: number;
}

export interface Point {
	x: number;
	y: number;
}

export type ReactiveValue<T> = T | Accessor<T>;

function access<T>(value: ReactiveValue<T>): T {
	return typeof value === 'function' ? (value as Accessor<T>)() : value;
}

/** 创建窗口尺寸 accessor；SSR 初值固定为 0 × 0。 */
export function createWindowSize(): Accessor<WindowSize> {
	const [size, setSize] = createSignal<WindowSize>({ width: 0, height: 0 });

	onMount(() => {
		const update = () => setSize({ width: window.innerWidth, height: window.innerHeight });
		window.addEventListener('resize', update);
		update();
		onCleanup(() => window.removeEventListener('resize', update));
	});

	return size;
}

/** 创建支持响应式查询字符串的媒体查询 accessor。 */
export function createMediaQuery(query: ReactiveValue<string>): Accessor<boolean> {
	const [matches, setMatches] = createSignal(false);

	onMount(() => {
		createEffect(() => {
			const media = window.matchMedia(access(query));
			const update = (event: MediaQueryListEvent) => setMatches(event.matches);
			setMatches(media.matches);
			media.addEventListener('change', update);
			onCleanup(() => media.removeEventListener('change', update));
		});
	});

	return matches;
}

/** 创建最大宽度 768px 的移动端媒体查询 accessor。 */
export function createIsMobile(): Accessor<boolean> {
	return createMediaQuery('(max-width: 768px)');
}

/** 创建在线状态 accessor；SSR 初值固定为 true。 */
export function createOnlineStatus(): Accessor<boolean> {
	const [online, setOnline] = createSignal(true);

	onMount(() => {
		const handleOnline = () => setOnline(true);
		const handleOffline = () => setOnline(false);
		setOnline(navigator.onLine);
		window.addEventListener('online', handleOnline);
		window.addEventListener('offline', handleOffline);
		onCleanup(() => {
			window.removeEventListener('online', handleOnline);
			window.removeEventListener('offline', handleOffline);
		});
	});

	return online;
}

/** 创建窗口滚动位置 accessor；SSR 初值固定为原点。 */
export function createScrollPosition(): Accessor<Point> {
	const [position, setPosition] = createSignal<Point>({ x: 0, y: 0 });

	onMount(() => {
		const update = () => setPosition({ x: window.scrollX, y: window.scrollY });
		window.addEventListener('scroll', update, { passive: true });
		update();
		onCleanup(() => window.removeEventListener('scroll', update));
	});

	return position;
}

/** 创建鼠标客户区坐标 accessor；SSR 初值固定为原点。 */
export function createMousePosition(): Accessor<Point> {
	const [position, setPosition] = createSignal<Point>({ x: 0, y: 0 });

	onMount(() => {
		const update = (event: MouseEvent) => setPosition({ x: event.clientX, y: event.clientY });
		window.addEventListener('mousemove', update);
		onCleanup(() => window.removeEventListener('mousemove', update));
	});

	return position;
}
