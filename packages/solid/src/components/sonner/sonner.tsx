import { For, Show, createEffect, createSignal, onCleanup, onMount, splitProps, type Accessor, type JSX } from 'solid-js';
import { Portal, isServer } from 'solid-js/web';
import {
	SONNER_DEFAULT_DURATION,
	buildSonnerToastApi,
	createSonnerStore,
	getSonnerPositionStyleKeys,
	resolveSonnerTheme,
	sonnerStyleKeys,
	type SonnerPosition,
	type SonnerStore,
	type SonnerTheme,
	type SonnerToast,
	type SonnerToastApi,
	type SonnerToasterBaseProps,
	type SonnerType,
} from '@tile-ui/core';
import { createExternalStoreAccessor } from '../../utils';
import styles from '@tile-ui/styles/scss/components/sonner.module.scss';

const positions: SonnerPosition[] = ['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'];
const emptyToasts: SonnerToast[] = Object.freeze([]) as unknown as SonnerToast[];
const toasterOwners = new Map<symbol, number | undefined>();
const [activeToasterOwner, setActiveToasterOwner] = createSignal<symbol>();
let browserStore: SonnerStore | undefined;

function getBrowserStore(): SonnerStore | undefined {
	if (isServer) return undefined;
	return (browserStore ??= createSonnerStore());
}

const storeFacade: SonnerStore = {
	getToasts: () => getBrowserStore()?.getToasts() ?? emptyToasts,
	subscribe: (listener) => getBrowserStore()?.subscribe(listener) ?? (() => undefined),
	add: (input) => getBrowserStore()?.add(input) ?? '',
	update: (id, patch) => getBrowserStore()?.update(id, patch),
	dismiss: (id) => getBrowserStore()?.dismiss(id),
	remove: (id) => getBrowserStore()?.remove(id),
	dismissAll: () => getBrowserStore()?.dismissAll(),
	setDefaultDuration: (duration) => getBrowserStore()?.setDefaultDuration(duration),
};

export const toast: SonnerToastApi = buildSonnerToastApi(storeFacade);

export interface UseToastReturn {
	toasts: Accessor<SonnerToast[]>;
	toast: SonnerToastApi;
	dismiss: (id?: string) => void;
	dismissAll: () => void;
}

export function useToast(): UseToastReturn {
	const toasts = createExternalStoreAccessor(
		() => {
			const store = getBrowserStore()!;
			return { getSnapshot: store.getToasts, subscribe: store.subscribe };
		},
		{ serverSnapshot: emptyToasts },
	);
	return {
		toasts,
		toast,
		dismiss: (id) => toast.dismiss(id),
		dismissAll: () => toast.dismissAll(),
	};
}

function applyDefaultDuration() {
	const owners = Array.from(toasterOwners.entries());
	setActiveToasterOwner(owners.at(-1)?.[0]);
	getBrowserStore()?.setDefaultDuration(owners.at(-1)?.[1] ?? SONNER_DEFAULT_DURATION);
}

function svg(children: JSX.Element) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true">
			{children}
		</svg>
	);
}

function ToastIcon(props: { type: SonnerType }) {
	switch (props.type) {
		case 'success':
			return svg(
				<>
					<circle cx="12" cy="12" r="10" />
					<path d="m9 12 2 2 4-4" />
				</>,
			);
		case 'info':
			return svg(
				<>
					<circle cx="12" cy="12" r="10" />
					<path d="M12 16v-4" />
					<path d="M12 8h.01" />
				</>,
			);
		case 'warning':
			return svg(
				<>
					<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
					<path d="M12 9v4" />
					<path d="M12 17h.01" />
				</>,
			);
		case 'error':
			return svg(<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z" />);
		case 'loading':
			return svg(<path d="M21 12a9 9 0 1 1-6.219-8.56" />);
		default:
			return null;
	}
}

function CloseIcon() {
	return svg(
		<>
			<path d="M18 6 6 18" />
			<path d="m6 6 12 12" />
		</>,
	);
}

function toastRole(type: SonnerType): 'alert' | 'status' {
	return type === 'error' || type === 'warning' ? 'alert' : 'status';
}

export interface ToasterProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'children'>, SonnerToasterBaseProps {}

/** SolidJS Toaster：服务端保持为空，浏览器挂载后订阅单例队列并渲染固定位置容器。 */
export function Toaster(props: ToasterProps) {
	const [local, rest] = splitProps(props, ['class', 'position', 'duration', 'theme', 'richColors', 'closeButton']);
	const toasts = useToast().toasts;
	const [prefersDark, setPrefersDark] = createSignal(false);
	const durationOwner = Symbol('sonner-toaster-duration');

	onMount(() => {
		toasterOwners.set(durationOwner, local.duration);
		applyDefaultDuration();
		createEffect(() => {
			toasterOwners.set(durationOwner, local.duration);
			applyDefaultDuration();
		});
		onCleanup(() => {
			toasterOwners.delete(durationOwner);
			applyDefaultDuration();
		});
	});

	createEffect(() => {
		if (local.theme !== 'system' || isServer || typeof window.matchMedia !== 'function') return;
		const media = window.matchMedia('(prefers-color-scheme: dark)');
		const update = () => setPrefersDark(media.matches);
		update();
		media.addEventListener('change', update);
		onCleanup(() => media.removeEventListener('change', update));
	});

	const resolvedTheme = () => resolveSonnerTheme(local.theme as SonnerTheme | undefined, prefersDark());
	const positionToasts = (position: SonnerPosition) => toasts().filter((item) => (item.position ?? local.position ?? 'bottom-right') === position);
	const lanes = (
		<For each={positions}>
			{(position) => {
				const styleKeys = getSonnerPositionStyleKeys(position);
				const list = () => positionToasts(position);
				return (
					<div
						data-slot="toaster"
						data-position={position}
						data-theme={resolvedTheme()}
						data-rich-colors={local.richColors ? 'true' : undefined}
						hidden={list().length === 0}
						class={`${styles[styleKeys.base]} ${styles[styleKeys.position]} ${resolvedTheme() ?? ''}`}>
						<For each={list()}>
							{(item) => (
								<div
									role={toastRole(item.type)}
									aria-live={toastRole(item.type) === 'alert' ? 'assertive' : 'polite'}
									aria-atomic="true"
									data-slot="toast"
									data-type={item.type}
									data-dismissing={item.dismissing ? 'true' : undefined}
									data-rich-colors={item.richColors === undefined ? undefined : item.richColors ? 'true' : 'false'}
									class={styles[sonnerStyleKeys.toast]}>
									<Show when={item.type !== 'default'}>
										<div class={styles[sonnerStyleKeys.icon]}>
											<ToastIcon type={item.type} />
										</div>
									</Show>
									<div class={styles[sonnerStyleKeys.content]}>
										<Show when={item.title !== undefined}>
											<div class={styles[sonnerStyleKeys.title]}>{item.title}</div>
										</Show>
										<Show when={item.description !== undefined}>
											<div class={styles[sonnerStyleKeys.description]}>{item.description}</div>
										</Show>
									</div>
									<Show when={(local.closeButton ?? true) && item.dismissible !== false}>
										<button type="button" aria-label="关闭" class={styles[sonnerStyleKeys.close]} onClick={() => toast.dismiss(item.id)}>
											<CloseIcon />
										</button>
									</Show>
								</div>
							)}
						</For>
					</div>
				);
			}}
		</For>
	);

	return (
		<div {...rest} data-slot="toaster-root" data-theme={resolvedTheme()} class={local.class}>
			{isServer || activeToasterOwner() !== durationOwner ? null : <Portal>{lanes}</Portal>}
		</div>
	);
}

export default Toaster;
