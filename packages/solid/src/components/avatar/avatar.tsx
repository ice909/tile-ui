import {
	Show,
	createContext,
	createRenderEffect,
	createSignal,
	onCleanup,
	onMount,
	splitProps,
	useContext,
	type Accessor,
	type JSX,
	type ParentProps,
	type Setter,
} from 'solid-js';
import { avatarStyleKeys, shouldShowAvatarFallback } from '@tile-ui/core';
import type { AvatarBaseProps, AvatarImageBaseProps, AvatarImageStatus } from '@tile-ui/core';
import { invokeEventHandler } from '../../utils/events';
import styles from '@tile-ui/styles/scss/components/avatar.module.scss';

interface AvatarContextValue {
	status: Accessor<AvatarImageStatus>;
	setStatus: Setter<AvatarImageStatus>;
	hasImage: Accessor<boolean>;
	setHasImage: Setter<boolean>;
	root: Accessor<HTMLSpanElement | undefined>;
}
const AvatarContext = createContext<AvatarContextValue>();
function useAvatar() {
	const value = useContext(AvatarContext);
	if (!value) throw new Error('Avatar 子组件必须位于 <Avatar> 内部。');
	return value;
}

export interface AvatarProps extends JSX.HTMLAttributes<HTMLSpanElement>, AvatarBaseProps {}
export function Avatar(props: ParentProps<AvatarProps>) {
	const [local, rest] = splitProps(props, ['class', 'children', 'size']);
	const [status, setStatus] = createSignal<AvatarImageStatus>('loading');
	const [hasImage, setHasImage] = createSignal(false);
	let root: HTMLSpanElement | undefined = undefined;
	return (
		<AvatarContext.Provider value={{ status, setStatus, hasImage, setHasImage, root: () => root }}>
			<span
				{...rest}
				ref={root!}
				data-slot="avatar"
				data-size={local.size ?? 'default'}
				data-image-status={status()}
				class={`${styles[avatarStyleKeys.root]} ${local.class ?? ''}`}>
				{local.children}
			</span>
		</AvatarContext.Provider>
	);
}

export interface AvatarImageProps extends JSX.ImgHTMLAttributes<HTMLImageElement>, AvatarImageBaseProps {}
export function AvatarImage(props: AvatarImageProps) {
	const context = useAvatar();
	const [local, rest] = splitProps(props, ['class', 'onLoad', 'onError', 'ref', 'src']);
	let sourceGeneration = 0;
	let activeImage: HTMLImageElement | undefined;

	function renderImage(source: string | undefined) {
		const generation = ++sourceGeneration;
		let image: HTMLImageElement | undefined = undefined;
		let consumerRefAssigned = false;
		context.setHasImage(true);
		context.setStatus('loading');

		const isCurrent = (element: HTMLImageElement) => generation === sourceGeneration && activeImage === element && local.src === source;
		const reconcile = () => {
			const currentImage = image as HTMLImageElement | undefined;
			if (currentImage && isCurrent(currentImage) && currentImage.complete) context.setStatus(currentImage.naturalWidth > 0 ? 'loaded' : 'error');
		};
		const assignImage = (element: HTMLImageElement) => {
			image = element;
			activeImage = element;
			context.setHasImage(true);
			reconcile();
			if (typeof local.ref === 'function') {
				consumerRefAssigned = true;
				local.ref(element);
			}
		};

		createRenderEffect(reconcile);
		onMount(() => {
			if (!image) image = context.root()?.querySelector('img') ?? undefined;
			if (!image) return;
			activeImage = image;
			context.setHasImage(true);
			reconcile();
			if (!consumerRefAssigned && typeof local.ref === 'function') local.ref(image);
		});
		onCleanup(() => {
			if (generation === sourceGeneration) {
				activeImage = undefined;
				context.setHasImage(false);
			}
		});

		return (
			<img
				{...rest}
				src={source}
				ref={assignImage}
				class={`${styles[avatarStyleKeys.image]} ${local.class ?? ''}`}
				onLoad={(event) => {
					if (isCurrent(event.currentTarget) && event.currentTarget === image) context.setStatus('loaded');
					invokeEventHandler(local.onLoad, event);
				}}
				onError={(event) => {
					if (isCurrent(event.currentTarget) && event.currentTarget === image) context.setStatus('error');
					invokeEventHandler(local.onError, event);
				}}
			/>
		);
	}

	return (
		<Show when={local.src} keyed>
			{(source) => renderImage(source)}
		</Show>
	);
}

export interface AvatarFallbackProps extends JSX.HTMLAttributes<HTMLSpanElement> {}
export function AvatarFallback(props: ParentProps<AvatarFallbackProps>) {
	const context = useAvatar();
	const [local, rest] = splitProps(props, ['class', 'children', 'hidden']);
	const internallyHidden = () => !shouldShowAvatarFallback(context.status(), context.hasImage());
	return (
		<span {...rest} hidden={internallyHidden() || local.hidden === true} class={`${styles[avatarStyleKeys.fallback]} ${local.class ?? ''}`}>
			{local.children}
		</span>
	);
}
export interface AvatarBadgeProps extends JSX.HTMLAttributes<HTMLSpanElement> {}
export function AvatarBadge(props: ParentProps<AvatarBadgeProps>) {
	const [local, rest] = splitProps(props, ['class', 'children']);
	return (
		<span {...rest} class={`${styles[avatarStyleKeys.badge]} ${local.class ?? ''}`}>
			{local.children}
		</span>
	);
}
export interface AvatarGroupProps extends JSX.HTMLAttributes<HTMLDivElement> {}
export function AvatarGroup(props: ParentProps<AvatarGroupProps>) {
	const [local, rest] = splitProps(props, ['class', 'children']);
	return (
		<div {...rest} class={`${styles[avatarStyleKeys.group]} ${local.class ?? ''}`}>
			{local.children}
		</div>
	);
}
export interface AvatarGroupCountProps extends JSX.HTMLAttributes<HTMLDivElement> {}
export function AvatarGroupCount(props: ParentProps<AvatarGroupCountProps>) {
	const [local, rest] = splitProps(props, ['class', 'children']);
	return (
		<div {...rest} class={`${styles[avatarStyleKeys.groupCount]} ${local.class ?? ''}`}>
			{local.children}
		</div>
	);
}
export default Avatar;
