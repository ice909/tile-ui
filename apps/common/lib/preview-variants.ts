export type PreviewVariant<Component> = {
	id: string;
	title: string;
	Component: Component;
};

export function variantKey(event: { key: string; preventDefault(): void }, index: number, count: number) {
	const last = count - 1;
	const next =
		event.key === 'Home' ? 0 : event.key === 'End' ? last : event.key === 'ArrowRight' ? (index + 1) % count : event.key === 'ArrowLeft' ? (index + last) % count : null;
	if (next !== null) event.preventDefault();
	return next;
}
