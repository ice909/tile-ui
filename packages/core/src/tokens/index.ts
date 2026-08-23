/**
 * 运行时设计令牌。
 * 键名可直接用于 shadcn registry 的 cssVars，变量名则用于运行时写入。
 */

export type ThemeName = 'light' | 'dark';
export type TokenCategory = 'color' | 'radius' | 'shadow' | 'typography';

export const tileExtensionCssVars = {
	'tile-success': '#22c55e',
	'tile-success-foreground': '#fafafa',
	'tile-warning': '#f59e0b',
	'tile-warning-foreground': '#fafafa',
	'tile-info': '#3b82f6',
	'tile-info-foreground': '#fafafa',
	'tile-overlay': 'rgb(0 0 0 / 0.5)',
	'tile-shadow-color': '0 0 0',
	'tile-radius-full': '9999px',
	'tile-text-xs': '0.75rem',
	'tile-text-sm': '0.875rem',
	'tile-text-base': '1rem',
	'tile-text-lg': '1.125rem',
	'tile-text-xl': '1.25rem',
	'tile-text-2xl': '1.5rem',
	'tile-text-3xl': '1.875rem',
	'tile-font-light': '300',
	'tile-font-normal': '400',
	'tile-font-medium': '500',
	'tile-font-semibold': '600',
	'tile-font-bold': '700',
	'tile-leading-none': '1',
	'tile-leading-tight': '1.25',
	'tile-leading-normal': '1.5',
	'tile-leading-relaxed': '1.625',
} as const;

export const tileDerivedTokenFallbacks = {
	'tile-primary-hover': 'color-mix(in srgb, var(--primary) 90%, var(--background))',
	'tile-primary-active': 'color-mix(in srgb, var(--primary) 80%, var(--background))',
	'tile-secondary-hover': 'color-mix(in srgb, var(--secondary) 90%, var(--background))',
	'tile-destructive-hover': 'color-mix(in srgb, var(--destructive) 90%, var(--background))',
	'tile-destructive-muted-foreground': 'color-mix(in srgb, var(--destructive) 85%, var(--card-foreground))',
	'tile-field-disabled': 'var(--muted)',
	'tile-field-subtle': 'color-mix(in srgb, var(--input) 50%, var(--background))',
	'tile-field-hover': 'color-mix(in srgb, var(--background) 98%, var(--foreground))',
	'tile-shadow-sm': '0 1px 2px 0 rgb(var(--tile-shadow-color) / 0.05)',
	'tile-shadow': '0 1px 3px 0 rgb(var(--tile-shadow-color) / 0.1), 0 1px 2px -1px rgb(var(--tile-shadow-color) / 0.1)',
	'tile-shadow-md': '0 4px 6px -1px rgb(var(--tile-shadow-color) / 0.1), 0 2px 4px -2px rgb(var(--tile-shadow-color) / 0.1)',
	'tile-shadow-lg': '0 10px 15px -3px rgb(var(--tile-shadow-color) / 0.1), 0 4px 6px -4px rgb(var(--tile-shadow-color) / 0.1)',
	'tile-radius-xs': 'max(0px, calc(var(--radius) - 0.375rem))',
	'tile-radius-sm': 'max(0px, calc(var(--radius) - 0.25rem))',
	'tile-radius-md': 'calc(var(--radius) + 0.25rem)',
	'tile-radius-lg': 'calc(var(--radius) + 0.5rem)',
	'tile-font-sans': "var(--font-sans, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif)",
	'tile-font-mono': "var(--font-mono, ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace)",
} as const;

export type TileExtensionDefaultTokenName = keyof typeof tileExtensionCssVars;
export type TileDerivedTokenName = keyof typeof tileDerivedTokenFallbacks;
export type TileExtensionTokenName = TileExtensionDefaultTokenName | TileDerivedTokenName;

export const lightThemeCssVars = {
	background: '#ffffff',
	foreground: '#18181b',
	card: '#ffffff',
	'card-foreground': '#18181b',
	popover: '#ffffff',
	'popover-foreground': '#18181b',
	primary: '#18181b',
	'primary-foreground': '#fafafa',
	secondary: '#f4f4f5',
	'secondary-foreground': '#18181b',
	muted: '#f4f4f5',
	'muted-foreground': '#71717a',
	accent: '#f4f4f5',
	'accent-foreground': '#18181b',
	destructive: '#ef4444',
	'destructive-foreground': '#fafafa',
	border: '#e4e4e7',
	input: '#e4e4e7',
	ring: '#18181b',
	'chart-1': '#e76e50',
	'chart-2': '#2a9d90',
	'chart-3': '#274754',
	'chart-4': '#e8c468',
	'chart-5': '#f4a462',
	sidebar: 'var(--card)',
	'sidebar-foreground': 'var(--card-foreground)',
	'sidebar-primary': 'var(--primary)',
	'sidebar-primary-foreground': 'var(--primary-foreground)',
	'sidebar-accent': 'var(--accent)',
	'sidebar-accent-foreground': 'var(--accent-foreground)',
	'sidebar-border': 'var(--border)',
	'sidebar-ring': 'var(--ring)',
	radius: '0.5rem',
	...tileExtensionCssVars,
} as const;

export type ThemeTokenName = keyof typeof lightThemeCssVars;
export type ThemeCssVars = Record<ThemeTokenName, string>;
export type RuntimeTokenName = ThemeTokenName | TileDerivedTokenName;
export type ThemeOverrides = Partial<ThemeCssVars> & Partial<Record<TileDerivedTokenName, string>>;

export const darkThemeOverrides = {
	background: '#09090b',
	foreground: '#fafafa',
	card: '#09090b',
	'card-foreground': '#fafafa',
	popover: '#09090b',
	'popover-foreground': '#fafafa',
	primary: '#fafafa',
	'primary-foreground': '#18181b',
	secondary: '#27272a',
	'secondary-foreground': '#fafafa',
	muted: '#27272a',
	'muted-foreground': '#a1a1aa',
	accent: '#27272a',
	'accent-foreground': '#fafafa',
	destructive: '#7f1d1d',
	'destructive-foreground': '#fafafa',
	border: '#27272a',
	input: '#27272a',
	ring: '#d4d4d8',
	'chart-1': '#2662d9',
	'chart-2': '#2eb88a',
	'chart-3': '#e88c30',
	'chart-4': '#af57db',
	'chart-5': '#e23670',
} as const satisfies Partial<ThemeCssVars>;

export const darkThemeCssVars: ThemeCssVars = {
	...lightThemeCssVars,
	...darkThemeOverrides,
};

export const themeCssVars: Record<ThemeName, ThemeCssVars> = {
	light: lightThemeCssVars,
	dark: darkThemeCssVars,
};

function getTokenCategory(name: RuntimeTokenName): TokenCategory {
	if (name === 'radius' || name.startsWith('tile-radius-')) return 'radius';
	if (name.startsWith('tile-shadow')) return 'shadow';
	if (name.startsWith('tile-font-') || name.startsWith('tile-text-') || name.startsWith('tile-leading-')) return 'typography';
	return 'color';
}

const themeTokenMetadata = (Object.keys(lightThemeCssVars) as ThemeTokenName[]).map(
	(name) =>
		[
			name,
			{
				variable: `--${name}` as const,
				category: getTokenCategory(name),
				light: lightThemeCssVars[name],
				dark: darkThemeCssVars[name],
			},
		] as const,
);

const derivedTokenMetadata = (Object.keys(tileDerivedTokenFallbacks) as TileDerivedTokenName[]).map(
	(name) =>
		[
			name,
			{
				variable: `--${name}` as const,
				category: getTokenCategory(name),
				fallback: tileDerivedTokenFallbacks[name],
			},
		] as const,
);

export const runtimeTokenMetadata = Object.fromEntries([...themeTokenMetadata, ...derivedTokenMetadata]) as Record<
	RuntimeTokenName,
	{ variable: `--${RuntimeTokenName}`; category: TokenCategory; light: string; dark: string } | { variable: `--${RuntimeTokenName}`; category: TokenCategory; fallback: string }
>;

/** 可直接用于 CSS 值的运行时变量引用。 */
export const runtimeTokenRefs = Object.fromEntries([
	...(Object.keys(lightThemeCssVars) as ThemeTokenName[]).map((name) => [name, `var(--${name})`]),
	...(Object.keys(tileDerivedTokenFallbacks) as TileDerivedTokenName[]).map((name) => [name, `var(--${name}, ${tileDerivedTokenFallbacks[name]})`]),
]) as Record<RuntimeTokenName, string>;

/** 将主题令牌转换为可传给 style.setProperty 的变量记录。 */
export function createThemeVariables(theme: ThemeName, overrides: ThemeOverrides = {}): Record<`--${RuntimeTokenName}`, string> {
	const values = { ...themeCssVars[theme], ...overrides };
	return Object.fromEntries(Object.entries(values).map(([name, value]) => [`--${name}`, value])) as Record<`--${RuntimeTokenName}`, string>;
}

/** 将主题令牌写入任意兼容 CSSStyleDeclaration 的目标。 */
export function applyThemeVariables(target: { style: { setProperty: (name: string, value: string) => void } }, theme: ThemeName, overrides?: ThemeOverrides) {
	for (const [name, value] of Object.entries(createThemeVariables(theme, overrides))) {
		target.style.setProperty(name, value);
	}
}

// 保留既有 JS token API，并与默认亮色主题对齐。
export const colors = {
	primary: lightThemeCssVars.primary,
	primaryForeground: lightThemeCssVars['primary-foreground'],
	secondary: lightThemeCssVars.secondary,
	secondaryForeground: lightThemeCssVars['secondary-foreground'],
	accent: lightThemeCssVars.accent,
	accentForeground: lightThemeCssVars['accent-foreground'],
	destructive: lightThemeCssVars.destructive,
	destructiveForeground: lightThemeCssVars['destructive-foreground'],
	success: lightThemeCssVars['tile-success'],
	successForeground: lightThemeCssVars['tile-success-foreground'],
	warning: lightThemeCssVars['tile-warning'],
	warningForeground: lightThemeCssVars['tile-warning-foreground'],
	info: lightThemeCssVars['tile-info'],
	infoForeground: lightThemeCssVars['tile-info-foreground'],
	background: lightThemeCssVars.background,
	foreground: lightThemeCssVars.foreground,
	border: lightThemeCssVars.border,
	input: lightThemeCssVars.input,
	ring: lightThemeCssVars.ring,
} as const;

export const shadows = {
	sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
	default: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
	md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
	lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
} as const;

export const radii = {
	sm: '0.25rem',
	default: '0.5rem',
	md: '0.75rem',
	lg: '1rem',
	full: '9999px',
} as const;

export const fonts = {
	sans: tileDerivedTokenFallbacks['tile-font-sans'],
	mono: tileDerivedTokenFallbacks['tile-font-mono'],
} as const;

export const fontSizes = {
	xs: lightThemeCssVars['tile-text-xs'],
	sm: lightThemeCssVars['tile-text-sm'],
	base: lightThemeCssVars['tile-text-base'],
	lg: lightThemeCssVars['tile-text-lg'],
	xl: lightThemeCssVars['tile-text-xl'],
	'2xl': lightThemeCssVars['tile-text-2xl'],
	'3xl': lightThemeCssVars['tile-text-3xl'],
} as const;

export const fontWeights = { light: 300, normal: 400, medium: 500, semibold: 600, bold: 700 } as const;
export const lineHeights = { none: 1, tight: 1.25, normal: 1.5, relaxed: 1.625 } as const;
export const spacing = { 1: '0.25rem', 2: '0.5rem', 3: '0.75rem', 4: '1rem', 5: '1.25rem', 6: '1.5rem', 8: '2rem', 10: '2.5rem', 12: '3rem' } as const;
export const transitions = {
	fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
	normal: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
	slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
} as const;
export const zIndex = { dropdown: 1000, modal: 1050, popover: 1060, tooltip: 1070 } as const;
export const breakpoints = { sm: '640px', md: '768px', lg: '1024px', xl: '1280px', '2xl': '1536px' } as const;
