import { generateId } from '../../utils/helpers';
import { capitalize } from '../../utils/helpers';
import type { SonnerAddInput, SonnerPosition, SonnerToast, SonnerType } from './sonner.types';

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
	update(id: string, patch: Partial<SonnerToast>): void;
	dismiss(id: string): void;
	remove(id: string): void;
	dismissAll(): void;
}

/**
 * 创建提示条队列存储
 */
export function createSonnerStore(): SonnerStore {
	let toasts: SonnerToast[] = [];
	const listeners = new Set<() => void>();
	const timers = new Map<string, ReturnType<typeof setTimeout>>();

	function notify() {
		for (const listener of listeners) {
			listener();
		}
	}

	function remove(id: string) {
		toasts = toasts.filter((toast) => toast.id !== id);
		const timer = timers.get(id);
		if (timer) {
			clearTimeout(timer);
			timers.delete(id);
		}
		notify();
	}

	function dismiss(id: string) {
		toasts = toasts.map((toast) => (toast.id === id ? { ...toast, dismissing: true } : toast));
		notify();
		setTimeout(() => remove(id), SONNER_DISMISS_DURATION);
	}

	function schedule(id: string, duration: number) {
		const existing = timers.get(id);
		if (existing) {
			clearTimeout(existing);
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
		const existing = toasts.find((toast) => toast.id === id);
		if (existing) {
			toasts = toasts.map((toast) => (toast.id === id ? { ...toast, ...input, dismissing: false } : toast));
		} else {
			const toast: SonnerToast = {
				id,
				type: 'default',
				duration: SONNER_DEFAULT_DURATION,
				dismissible: true,
				...input,
			};
			toasts = [...toasts, toast];
		}
		notify();
		schedule(id, input.duration ?? SONNER_DEFAULT_DURATION);
		return id;
	}

	function update(id: string, patch: Partial<SonnerToast>) {
		toasts = toasts.map((toast) => (toast.id === id ? { ...toast, ...patch } : toast));
		notify();
	}

	function dismissAll() {
		for (const toast of toasts) {
			dismiss(toast.id);
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
