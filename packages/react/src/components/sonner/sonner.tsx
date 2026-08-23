import React from 'react';
import { useSyncExternalStore } from 'react';
import { buildSonnerToastApi, createSonnerStore, getSonnerPositionStyleKeys, resolveSonnerTheme, sonnerStyleKeys } from '@tile-ui/core';
import type { SonnerPosition, SonnerTheme, SonnerToast, SonnerToasterBaseProps, SonnerType } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/sonner.module.scss';

const sonnerStore = createSonnerStore();

export const toast = buildSonnerToastApi(sonnerStore);

export interface UseToastReturn {
	toasts: SonnerToast[];
	toast: typeof toast;
	dismiss: (id?: string) => void;
	dismissAll: () => void;
}

function useToast(): UseToastReturn {
	const toasts = useSyncExternalStore(sonnerStore.subscribe, sonnerStore.getToasts, sonnerStore.getToasts);
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
	const toasts = useSyncExternalStore(sonnerStore.subscribe, sonnerStore.getToasts, sonnerStore.getToasts);
	const resolvedTheme = useResolvedTheme(theme);

	React.useEffect(() => {
		if (duration !== undefined) {
			sonnerStore.setDefaultDuration(duration);
		}
	}, [duration]);

	const groups = new Map<string, SonnerToast[]>();
	for (const item of toasts) {
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
							<div key={item.id} data-slot="toast" data-type={item.type} data-dismissing={item.dismissing} className={styles[sonnerStyleKeys.toast]}>
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
									<button type="button" aria-label="关闭" className={styles[sonnerStyleKeys.close]} onClick={() => sonnerStore.dismiss(item.id)}>
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
