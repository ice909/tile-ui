import { splitProps, type JSX } from 'solid-js';
import { skeletonStyleKeys } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/skeleton.module.scss';
export interface SkeletonProps extends JSX.HTMLAttributes<HTMLDivElement> {}
export function Skeleton(props: SkeletonProps) {
	const [local, rest] = splitProps(props, ['class']);
	return <div {...rest} aria-hidden={rest['aria-hidden'] ?? 'true'} class={`${styles[skeletonStyleKeys.base]} ${local.class ?? ''}`} />;
}
export default Skeleton;
