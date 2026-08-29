import { generateId } from '../../utils/helpers';
import { capitalize } from '../../utils/helpers';
import type { SonnerAddInput, SonnerPosition, SonnerTheme, SonnerToast, SonnerToastUpdate, SonnerType } from './sonner.types';

/**
 * Sonner 组件样式类名键
 */
export const sonnerStyleKeys = {
	root: 'root',
	toast: 'toast',
	icon: 'icon',
	content: 'content',
	title: 'title',
	description: 'description',
	close: 'close',
	actions: 'actions',
	action: 'action',
} as const;

/**
 * 默认自动消失时长 (ms)
 */
export const SONNER_DEFAULT_DURATION = 4000;

/**
 * 退出动画时长 (ms)
 */
export const SONNER_DISMISS_DURATION = 200;

/** 将 system 主题解析为当前系统主题，未指定时继续继承宿主主题 */
export function resolveSonnerTheme(theme: SonnerTheme | undefined, prefersDark: boolean): 'light' | 'dark' | undefined {
	return theme === 'system' ? (prefersDark ? 'dark' : 'light') : theme;
}

function toPascal(value: string): string {
	return value.split('-').map(capitalize).join('');
}

/**
 * 获取 Toaster 位置样式类名键
 */
export function getSonnerPositionStyleKeys(position: SonnerPosition = 'bottom-right') {
	return {
		base: sonnerStyleKeys.root,
		position: `position${toPascal(position)}`,
	};
}

/**
 * 框架无关的提示条队列存储 (含自动消失定时器)
 */
export interface SonnerStore {
	getToasts(): SonnerToast[];
	subscribe(listener: () => void): () => void;
	add(input: SonnerAddInput): string;
	update(id: string, patch: SonnerToastUpdate): void;
	dismiss(id: string): void;
	remove(id: string): void;
	dismissAll(): void;
	setDefaultDuration(duration: number): void;
}

/**
 * 创建提示条队列存储
 */
export function createSonnerStore(): SonnerStore {
	let toasts: SonnerToast[] = [];
	let defaultDuration = SONNER_DEFAULT_DURATION;
	const listeners = new Set<() => void>();
	const timers = new Map<string, ReturnType<typeof setTimeout>>();
	const dismissTimers = new Map<string, ReturnType<typeof setTimeout>>();

	function notify() {
		for (const listener of listeners) {
			listener();
		}
	}

	function remove(id: string) {
		if (!toasts.some((toast) => toast.id === id)) return;
		toasts = toasts.filter((toast) => toast.id !== id);
		const timer = timers.get(id);
		if (timer) {
			clearTimeout(timer);
			timers.delete(id);
		}
		const dismissTimer = dismissTimers.get(id);
		if (dismissTimer) {
			clearTimeout(dismissTimer);
			dismissTimers.delete(id);
		}
		notify();
	}

	function dismiss(id: string) {
		const current = toasts.find((toast) => toast.id === id);
		if (!current || current.dismissing) return;
		const timer = timers.get(id);
		if (timer) {
			clearTimeout(timer);
			timers.delete(id);
		}
		toasts = toasts.map((toast) => (toast.id === id ? { ...toast, dismissing: true } : toast));
		notify();
		dismissTimers.set(
			id,
			setTimeout(() => {
				dismissTimers.delete(id);
				remove(id);
			}, SONNER_DISMISS_DURATION),
		);
	}

	function schedule(id: string, duration: number) {
		const existing = timers.get(id);
		if (existing) {
			clearTimeout(existing);
			timers.delete(id);
		}
		if (duration <= 0) {
			return;
		}
		timers.set(
			id,
			setTimeout(() => dismiss(id), duration),
		);
	}

	function add(input: SonnerAddInput): string {
		const id = input.id ?? generateId('toast');
		const duration = input.duration ?? defaultDuration;
		const existing = toasts.find((toast) => toast.id === id);
		if (existing) {
			const dismissTimer = dismissTimers.get(id);
			if (dismissTimer) {
				clearTimeout(dismissTimer);
				dismissTimers.delete(id);
			}
			toasts = toasts.map((toast) => (toast.id === id ? { ...toast, ...input, duration, dismissing: false } : toast));
		} else {
			const toast: SonnerToast = {
				id,
				type: 'default',
				duration,
				dismissible: true,
				...input,
			};
			toasts = [...toasts, toast];
		}
		notify();
		schedule(id, duration);
		return id;
	}

	function update(id: string, patch: SonnerToastUpdate) {
		const current = toasts.find((toast) => toast.id === id);
		if (!current) return;
		const { id: _ignoredId, dismissing: _ignoredDismissing, ...safePatch } = patch as SonnerToastUpdate & { id?: string; dismissing?: boolean };
		toasts = toasts.map((toast) => (toast.id === id ? { ...toast, ...safePatch } : toast));
		notify();
		if (safePatch.duration !== undefined && !current.dismissing) schedule(id, safePatch.duration);
	}

	function dismissAll() {
		const ids = toasts.filter((toast) => !toast.dismissing).map((toast) => toast.id);
		if (ids.length === 0) return;
		const idSet = new Set(ids);
		for (const id of ids) {
			const timer = timers.get(id);
			if (timer) clearTimeout(timer);
			timers.delete(id);
		}
		toasts = toasts.map((toast) => (idSet.has(toast.id) ? { ...toast, dismissing: true } : toast));
		notify();
		for (const id of ids) {
			dismissTimers.set(
				id,
				setTimeout(() => {
					dismissTimers.delete(id);
					remove(id);
				}, SONNER_DISMISS_DURATION),
			);
		}
	}

	return {
		getToasts: () => toasts,
		subscribe: (listener) => {
			listeners.add(listener);
			return () => {
				listeners.delete(listener);
			};
		},
		add,
		update,
		dismiss,
		remove,
		dismissAll,
		setDefaultDuration: (duration: number) => {
			defaultDuration = duration;
		},
	};
}

/** toast 函数的调用签名 */
export interface SonnerToastApi {
	(input: string | SonnerAddInput, options?: Omit<SonnerAddInput, 'title'>): string;
	success: (input: string | SonnerAddInput, options?: Omit<SonnerAddInput, 'title'>) => string;
	info: (input: string | SonnerAddInput, options?: Omit<SonnerAddInput, 'title'>) => string;
	warning: (input: string | SonnerAddInput, options?: Omit<SonnerAddInput, 'title'>) => string;
	error: (input: string | SonnerAddInput, options?: Omit<SonnerAddInput, 'title'>) => string;
	loading: (input: string | SonnerAddInput, options?: Omit<SonnerAddInput, 'title'>) => string;
	dismiss: (id?: string) => void;
	dismissAll: () => void;
}

function resolveInput(input: string | SonnerAddInput, options?: Omit<SonnerAddInput, 'title'>): SonnerAddInput {
	if (typeof input === 'string') {
		return { title: input, ...options };
	}
	return input;
}

/**
 * 基于存储构建 toast 编程式 API (框架无关)
 */
export function buildSonnerToastApi(store: SonnerStore): SonnerToastApi {
	function create(type: SonnerType) {
		return (input: string | SonnerAddInput, options?: Omit<SonnerAddInput, 'title'>) => store.add({ ...resolveInput(input, options), type });
	}

	const api = ((input: string | SonnerAddInput, options?: Omit<SonnerAddInput, 'title'>) => store.add(resolveInput(input, options))) as SonnerToastApi;
	api.success = create('success');
	api.info = create('info');
	api.warning = create('warning');
	api.error = create('error');
	api.loading = create('loading');
	api.dismiss = (id?: string) => {
		if (id) {
			store.dismiss(id);
		} else {
			store.dismissAll();
		}
	};
	api.dismissAll = () => store.dismissAll();
	return api;
}
