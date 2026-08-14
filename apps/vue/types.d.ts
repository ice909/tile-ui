declare module 'markdown-it' {
	export interface MarkdownItOptions {
		html?: boolean;
		linkify?: boolean;
		typographer?: boolean;
	}

	export default class MarkdownIt {
		constructor(options?: MarkdownItOptions);
		use(plugin: (...args: any[]) => any, ...params: any[]): this;
		render(markdown: string): string;
	}
}

declare module '@tile-ui/styles/scss/components/button.module.scss' {
	const classes: { readonly [key: string]: string };
	export default classes;
}

declare module '@tile-ui/styles/scss/components/input.module.scss' {
	const classes: { readonly [key: string]: string };
	export default classes;
}

declare module '@tile-ui/styles/scss/components/textarea.module.scss' {
	const classes: { readonly [key: string]: string };
	export default classes;
}

declare module '@tile-ui/styles/scss/components/label.module.scss' {
	const classes: { readonly [key: string]: string };
	export default classes;
}

declare module '@tile-ui/styles/scss/components/card.module.scss' {
	const classes: { readonly [key: string]: string };
	export default classes;
}

declare module '@tile-ui/styles/scss/components/badge.module.scss' {
	const classes: { readonly [key: string]: string };
	export default classes;
}

declare module '@tile-ui/styles/scss/components/skeleton.module.scss' {
	const classes: { readonly [key: string]: string };
	export default classes;
}

declare module '@tile-ui/styles/scss/components/kbd.module.scss' {
	const classes: { readonly [key: string]: string };
	export default classes;
}

declare module '@tile-ui/styles/scss/components/separator.module.scss' {
	const classes: { readonly [key: string]: string };
	export default classes;
}

declare module '@tile-ui/styles/scss/components/table.module.scss' {
	const classes: { readonly [key: string]: string };
	export default classes;
}

declare module '@tile-ui/styles/scss/components/progress.module.scss' {
	const classes: { readonly [key: string]: string };
	export default classes;
}

declare module '@tile-ui/styles/scss/components/avatar.module.scss' {
	const classes: { readonly [key: string]: string };
	export default classes;
}

declare module '@tile-ui/styles/scss/components/switch.module.scss' {
	const classes: { readonly [key: string]: string };
	export default classes;
}

declare module '@tile-ui/styles/scss/components/checkbox.module.scss' {
	const classes: { readonly [key: string]: string };
	export default classes;
}

declare module '@tile-ui/styles/scss/components/collapsible.module.scss' {
	const classes: { readonly [key: string]: string };
	export default classes;
}

declare module '@tile-ui/styles/scss/components/breadcrumb.module.scss' {
	const classes: { readonly [key: string]: string };
	export default classes;
}

declare module '@tile-ui/styles/scss/components/pagination.module.scss' {
	const classes: { readonly [key: string]: string };
	export default classes;
}

declare const NuxtLink: any;
declare const NuxtPage: any;
declare function defineNuxtConfig(config: Record<string, unknown>): Record<string, unknown>;
declare function useRoute(): {
	params: Record<string, string | string[] | undefined>;
	fullPath: string;
};
declare function useAsyncData<T>(
	key: string,
	handler: () => Promise<T> | T,
	options?: { watch?: Array<() => unknown> },
): Promise<{ data: { value: T | null }; error: { value: unknown } }>;
declare function $fetch<T>(input: string): Promise<T>;
declare function createError(input: { statusCode: number; statusMessage: string }): Error;
declare function defineEventHandler<T>(handler: (event: unknown) => T): (event: unknown) => T;
declare function getRouterParam(event: unknown, name: string): string | undefined;
declare module '@tile-ui/styles/scss/components/alert.module.scss' {
	const classes: { readonly [key: string]: string };
	export default classes;
}

declare module '@tile-ui/styles/scss/components/aspect-ratio.module.scss' {
	const classes: { readonly [key: string]: string };
	export default classes;
}

declare module '@tile-ui/styles/scss/components/spinner.module.scss' {
	const classes: { readonly [key: string]: string };
	export default classes;
}

declare module '@tile-ui/styles/scss/components/empty.module.scss' {
	const classes: { readonly [key: string]: string };
	export default classes;
}

declare module '@tile-ui/styles/scss/components/marker.module.scss' {
	const classes: { readonly [key: string]: string };
	export default classes;
}

declare module '@tile-ui/styles/scss/components/item.module.scss' {
	const classes: { readonly [key: string]: string };
	export default classes;
}

declare module '@tile-ui/styles/scss/components/button-group.module.scss' {
	const classes: { readonly [key: string]: string };
	export default classes;
}

declare module '@tile-ui/styles/scss/components/input-group.module.scss' {
	const classes: { readonly [key: string]: string };
	export default classes;
}

declare module '@tile-ui/styles/scss/components/native-select.module.scss' {
	const classes: { readonly [key: string]: string };
	export default classes;
}

declare module '@tile-ui/styles/scss/components/field.module.scss' {
	const classes: { readonly [key: string]: string };
	export default classes;
}

declare module '@tile-ui/styles/scss/components/toggle.module.scss' {
	const classes: { readonly [key: string]: string };
	export default classes;
}

declare module '@tile-ui/styles/scss/components/toggle-group.module.scss' {
	const classes: { readonly [key: string]: string };
	export default classes;
}

declare module '@tile-ui/styles/scss/components/tabs.module.scss' {
	const classes: { readonly [key: string]: string };
	export default classes;
}

declare module '@tile-ui/styles/scss/components/accordion.module.scss' {
	const classes: { readonly [key: string]: string };
	export default classes;
}

declare module '@tile-ui/styles/scss/components/radio-group.module.scss' {
	const classes: { readonly [key: string]: string };
	export default classes;
}

declare module '@tile-ui/styles/scss/components/slider.module.scss' {
	const classes: { readonly [key: string]: string };
	export default classes;
}

declare module '@tile-ui/styles/scss/components/scroll-area.module.scss' {
	const classes: { readonly [key: string]: string };
	export default classes;
}

declare module '@tile-ui/styles/scss/components/tooltip.module.scss' {
	const classes: { readonly [key: string]: string };
	export default classes;
}

declare module '@tile-ui/styles/scss/components/popover.module.scss' {
	const classes: { readonly [key: string]: string };
	export default classes;
}

declare module '@tile-ui/styles/scss/components/hover-card.module.scss' {
	const classes: { readonly [key: string]: string };
	export default classes;
}

declare module '@tile-ui/styles/scss/components/dialog.module.scss' {
	const classes: { readonly [key: string]: string };
	export default classes;
}

declare module '@tile-ui/styles/scss/components/alert-dialog.module.scss' {
	const classes: { readonly [key: string]: string };
	export default classes;
}

declare module '@tile-ui/styles/scss/components/sheet.module.scss' {
	const classes: { readonly [key: string]: string };
	export default classes;
}

declare module '@tile-ui/styles/scss/components/dropdown-menu.module.scss' {
	const classes: { readonly [key: string]: string };
	export default classes;
}

declare module '@tile-ui/styles/scss/components/context-menu.module.scss' {
	const classes: { readonly [key: string]: string };
	export default classes;
}

declare module '@tile-ui/styles/scss/components/menubar.module.scss' {
	const classes: { readonly [key: string]: string };
	export default classes;
}

declare module '@tile-ui/styles/scss/components/navigation-menu.module.scss' {
	const classes: { readonly [key: string]: string };
	export default classes;
}

declare module '@tile-ui/styles/scss/components/select.module.scss' {
	const classes: { readonly [key: string]: string };
	export default classes;
}

declare module '@tile-ui/styles/scss/components/combobox.module.scss' {
	const classes: { readonly [key: string]: string };
	export default classes;
}

declare module '@tile-ui/styles/scss/components/command.module.scss' {
	const classes: { readonly [key: string]: string };
	export default classes;
}

declare module '@tile-ui/styles/scss/components/chart.module.scss' {
	const classes: { readonly [key: string]: string };
	export default classes;
}

declare module '@tile-ui/styles/scss/components/calendar.module.scss' {
	const classes: { readonly [key: string]: string };
	export default classes;
}

declare module '@tile-ui/styles/scss/components/drawer.module.scss' {
	const classes: { readonly [key: string]: string };
	export default classes;
}

declare module '@tile-ui/styles/scss/components/form.module.scss' {
	const classes: { readonly [key: string]: string };
	export default classes;
}

declare module '@tile-ui/styles/scss/components/sidebar.module.scss' {
	const classes: { readonly [key: string]: string };
	export default classes;
}

declare module '@tile-ui/styles/scss/components/carousel.module.scss' {
	const classes: { readonly [key: string]: string };
	export default classes;
}

declare module '@tile-ui/styles/scss/components/resizable.module.scss' {
	const classes: { readonly [key: string]: string };
	export default classes;
}

declare module '@tile-ui/styles/scss/components/attachment.module.scss' {
	const classes: { readonly [key: string]: string };
	export default classes;
}

declare module '@tile-ui/styles/scss/components/bubble.module.scss' {
	const classes: { readonly [key: string]: string };
	export default classes;
}

declare module '@tile-ui/styles/scss/components/direction.module.scss' {
	const classes: { readonly [key: string]: string };
	export default classes;
}

declare module '@tile-ui/styles/scss/components/message.module.scss' {
	const classes: { readonly [key: string]: string };
	export default classes;
}

declare module '@tile-ui/styles/scss/components/message-scroller.module.scss' {
	const classes: { readonly [key: string]: string };
	export default classes;
}

declare module '@tile-ui/styles/scss/components/sonner.module.scss' {
	const classes: { readonly [key: string]: string };
	export default classes;
}

declare module '@tile-ui/styles/scss/components/input-otp.module.scss' {
	const classes: { readonly [key: string]: string };
	export default classes;
}
