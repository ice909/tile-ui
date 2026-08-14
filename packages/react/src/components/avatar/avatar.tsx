import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { avatarStyleKeys, shouldShowAvatarFallback } from '@tile-ui/core';
import type { AvatarImageStatus } from '@tile-ui/core';
import type { AvatarBaseProps, AvatarImageBaseProps } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/avatar.module.scss';

interface AvatarContextValue {
	status: AvatarImageStatus;
	setStatus: (status: AvatarImageStatus) => void;
	hasImage: boolean;
	setHasImage: (has: boolean) => void;
}

const AvatarContext = createContext<AvatarContextValue | null>(null);

function useAvatarContext(): AvatarContextValue {
	const context = useContext(AvatarContext);
	if (!context) {
		throw new Error('Avatar sub-components must be used within <Avatar>.');
	}
	return context;
}

export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement>, AvatarBaseProps {}

const Avatar = React.forwardRef<HTMLSpanElement, AvatarProps>(({ className = '', size = 'default', children, ...props }, ref) => {
	const [status, setStatus] = useState<AvatarImageStatus>('loading');
	const [hasImage, setHasImage] = useState(false);

	return (
		<AvatarContext.Provider value={{ status, setStatus, hasImage, setHasImage }}>
			<span ref={ref} data-size={size} className={`${styles[avatarStyleKeys.root]} ${className}`} {...props}>
				{children}
			</span>
		</AvatarContext.Provider>
	);
});
Avatar.displayName = 'Avatar';

export interface AvatarImageProps extends React.ImgHTMLAttributes<HTMLImageElement>, AvatarImageBaseProps {}

const AvatarImage = React.forwardRef<HTMLImageElement, AvatarImageProps>(({ className = '', onLoad, onError, ...props }, ref) => {
	const context = useAvatarContext();
	const imgRef = useRef<HTMLImageElement | null>(null);

	useEffect(() => {
		context.setHasImage(true);

		const img = imgRef.current;
		if (img && img.complete) {
			context.setStatus(img.naturalWidth > 0 ? 'loaded' : 'error');
		}
	}, [context]);

	function setRef(element: HTMLImageElement | null) {
		imgRef.current = element;

		if (typeof ref === 'function') {
			ref(element);
		} else if (ref) {
			ref.current = element;
		}
	}

	function handleLoad(event: React.SyntheticEvent<HTMLImageElement>) {
		context.setStatus('loaded');
		onLoad?.(event);
	}

	function handleError(event: React.SyntheticEvent<HTMLImageElement>) {
		context.setStatus('error');
		onError?.(event);
	}

	return <img ref={setRef} className={`${styles[avatarStyleKeys.image]} ${className}`} onLoad={handleLoad} onError={handleError} {...props} />;
});
AvatarImage.displayName = 'AvatarImage';

export interface AvatarFallbackProps extends React.HTMLAttributes<HTMLSpanElement> {}

const AvatarFallback = React.forwardRef<HTMLSpanElement, AvatarFallbackProps>(({ className = '', children, ...props }, ref) => {
	const context = useAvatarContext();

	if (!shouldShowAvatarFallback(context.status, context.hasImage)) {
		return null;
	}

	return (
		<span ref={ref} className={`${styles[avatarStyleKeys.fallback]} ${className}`} {...props}>
			{children}
		</span>
	);
});
AvatarFallback.displayName = 'AvatarFallback';

export interface AvatarBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {}

const AvatarBadge = React.forwardRef<HTMLSpanElement, AvatarBadgeProps>(({ className = '', children, ...props }, ref) => {
	return (
		<span ref={ref} className={`${styles[avatarStyleKeys.badge]} ${className}`} {...props}>
			{children}
		</span>
	);
});
AvatarBadge.displayName = 'AvatarBadge';

export interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {}

const AvatarGroup = React.forwardRef<HTMLDivElement, AvatarGroupProps>(({ className = '', children, ...props }, ref) => {
	return (
		<div ref={ref} className={`${styles[avatarStyleKeys.group]} ${className}`} {...props}>
			{children}
		</div>
	);
});
AvatarGroup.displayName = 'AvatarGroup';

export interface AvatarGroupCountProps extends React.HTMLAttributes<HTMLDivElement> {}

const AvatarGroupCount = React.forwardRef<HTMLDivElement, AvatarGroupCountProps>(({ className = '', children, ...props }, ref) => {
	return (
		<div ref={ref} className={`${styles[avatarStyleKeys.groupCount]} ${className}`} {...props}>
			{children}
		</div>
	);
});
AvatarGroupCount.displayName = 'AvatarGroupCount';

export { Avatar, AvatarImage, AvatarFallback, AvatarBadge, AvatarGroup, AvatarGroupCount };
export default Avatar;
