import React from 'react';
import { useSyncExternalStore } from 'react';
import { SONNER_DEFAULT_DURATION, buildSonnerToastApi, createSonnerStore, getSonnerPositionStyleKeys, resolveSonnerTheme, sonnerStyleKeys } from '@tile-ui/core';
import type { SonnerPosition, SonnerStore, SonnerTheme, SonnerToast, SonnerToastApi, SonnerToasterBaseProps, SonnerType } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/sonner.module.scss';

const emptyToasts: SonnerToast[] = Object.freeze([]) as unknown as SonnerToast[];
const toasterOwners = new Map<symbol, number | undefined>();
const ownerListeners = new Set<() => void>();
let browserStore: SonnerStore | undefined;
let activeOwner: symbol | undefined;

function getBrowserStore(): SonnerStore | undefined {
	if (typeof window === 'undefined') return undefined;
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

function applyToasterPolicy() {
	const owner = Array.from(toasterOwners.entries()).at(-1);
	activeOwner = owner?.[0];
	getBrowserStore()?.setDefaultDuration(owner?.[1] ?? SONNER_DEFAULT_DURATION);
	for (const listener of ownerListeners) listener();
}

export const toast: SonnerToastApi = buildSonnerToastApi(storeFacade);

export interface UseToastReturn {
	toasts: SonnerToast[];
	toast: SonnerToastApi;
	dismiss: (id?: string) => void;
	dismissAll: () => void;
}

function useToast(): UseToastReturn {
	const toasts = useSyncExternalStore(storeFacade.subscribe, storeFacade.getToasts, () => emptyToasts);
	return {
		toasts,
		toast,
		dismiss: (id) => toast.dismiss(id),
		dismissAll: () => toast.dismissAll(),
	};
}

function SuccessIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true">
			<circle cx="12" cy="12" r="10" />
			<path d="m9 12 2 2 4-4" />
		</svg>
	);
}

function InfoIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true">
			<circle cx="12" cy="12" r="10" />
			<path d="M12 16v-4" />
			<path d="M12 8h.01" />
		</svg>
	);
}

function WarningIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true">
			<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
			<path d="M12 9v4" />
			<path d="M12 17h.01" />
		</svg>
	);
}

function ErrorIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true">
			<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z" />
		</svg>
	);
}

function LoadingIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true">
			<path d="M21 12a9 9 0 1 1-6.219-8.56" />
		</svg>
	);
}

function CloseIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true">
			<path d="M18 6 6 18" />
			<path d="m6 6 12 12" />
		</svg>
	);
}

function ToastIcon({ type }: { type: SonnerType }) {
	switch (type) {
		case 'success':
			return <SuccessIcon />;
		case 'info':
			return <InfoIcon />;
		case 'warning':
			return <WarningIcon />;
		case 'error':
			return <ErrorIcon />;
		case 'loading':
			return <LoadingIcon />;
		default:
			return null;
	}
}

function toastRole(type: SonnerType): 'alert' | 'status' {
	return type === 'error' || type === 'warning' ? 'alert' : 'status';
}

function useResolvedTheme(theme: SonnerTheme | undefined): 'light' | 'dark' | undefined {
	const [systemTheme, setSystemTheme] = React.useState<'light' | 'dark'>('light');

	React.useEffect(() => {
		if (theme !== 'system') {
			return;
		}
		const media = window.matchMedia('(prefers-color-scheme: dark)');
		const update = () => setSystemTheme(media.matches ? 'dark' : 'light');
		update();
		media.addEventListener('change', update);
		return () => media.removeEventListener('change', update);
	}, [theme]);

	return resolveSonnerTheme(theme, systemTheme === 'dark');
}

export interface ToasterProps extends SonnerToasterBaseProps {
	className?: string;
}

function Toaster({ position = 'bottom-right', duration, theme, richColors = false, closeButton = true, className = '' }: ToasterProps) {
	const owner = React.useRef(Symbol('sonner-toaster-owner')).current;
	const toasts = useSyncExternalStore(storeFacade.subscribe, storeFacade.getToasts, () => emptyToasts);
	const currentOwner = useSyncExternalStore(
		(listener) => {
			ownerListeners.add(listener);
			return () => ownerListeners.delete(listener);
		},
		() => activeOwner,
		() => undefined,
	);
	const resolvedTheme = useResolvedTheme(theme);

	React.useEffect(() => {
		toasterOwners.set(owner, duration);
		applyToasterPolicy();
		return () => {
			toasterOwners.delete(owner);
			applyToasterPolicy();
		};
	}, [duration, owner]);

	React.useEffect(() => {
		if (!toasterOwners.has(owner)) return;
		toasterOwners.set(owner, duration);
		applyToasterPolicy();
	}, [duration, owner]);

	const groups = new Map<string, SonnerToast[]>();
	for (const item of currentOwner === owner ? toasts : emptyToasts) {
		const key = item.position ?? position;
		const list = groups.get(key);
		if (list) {
			list.push(item);
		} else {
			groups.set(key, [item]);
		}
	}

	return (
		<>
			{Array.from(groups.entries()).map(([groupPosition, list]) => {
				const styleKeys = getSonnerPositionStyleKeys(groupPosition as SonnerPosition);
				return (
					<div
						key={groupPosition}
						data-slot="toaster"
						data-theme={resolvedTheme}
						data-rich-colors={richColors ? 'true' : undefined}
						className={[styles[styleKeys.base], styles[styleKeys.position], resolvedTheme, className].filter(Boolean).join(' ')}>
						{list.map((item) => (
							<div
								key={item.id}
								role={toastRole(item.type)}
								aria-live={toastRole(item.type) === 'alert' ? 'assertive' : 'polite'}
								aria-atomic="true"
								data-slot="toast"
								data-type={item.type}
								data-dismissing={item.dismissing}
								data-rich-colors={item.richColors === undefined ? undefined : item.richColors ? 'true' : 'false'}
								className={styles[sonnerStyleKeys.toast]}>
								{item.type !== 'default' && (
									<div className={styles[sonnerStyleKeys.icon]}>
										<ToastIcon type={item.type} />
									</div>
								)}
								<div className={styles[sonnerStyleKeys.content]}>
									{item.title !== undefined && <div className={styles[sonnerStyleKeys.title]}>{item.title}</div>}
									{item.description !== undefined && <div className={styles[sonnerStyleKeys.description]}>{item.description}</div>}
								</div>
								{closeButton && item.dismissible !== false && (
									<button type="button" aria-label="关闭" className={styles[sonnerStyleKeys.close]} onClick={() => toast.dismiss(item.id)}>
										<CloseIcon />
									</button>
								)}
							</div>
						))}
					</div>
				);
			})}
		</>
	);
}

export { Toaster, useToast };
export default Toaster;
