import type { ReactNode, SVGProps } from 'react';

function createIcon(children: ReactNode) {
	return function Icon(props: SVGProps<SVGSVGElement>) {
		return (
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
				aria-hidden="true"
				{...props}>
				{children}
			</svg>
		);
	};
}

export const IconCopy = createIcon(
	<>
		<rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
		<path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
	</>,
);

export const IconCheck = createIcon(<path d="M20 6 9 17l-5-5" />);

export const IconFile = createIcon(
	<>
		<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
		<path d="M14 2v4a2 2 0 0 0 2 2h4" />
	</>,
);

export const IconTerminal = createIcon(
	<>
		<polyline points="4 17 10 11 4 5" />
		<line x1="12" x2="20" y1="19" y2="19" />
	</>,
);

export const IconBraces = createIcon(
	<>
		<path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1" />
		<path d="M16 21h1a2 2 0 0 0 2-2v-5c0-1.1.9-2 2-2a2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1" />
	</>,
);

export const IconCode = createIcon(
	<>
		<polyline points="16 18 22 12 16 6" />
		<polyline points="8 6 2 12 8 18" />
	</>,
);

export const IconHash = createIcon(
	<>
		<line x1="4" x2="20" y1="9" y2="9" />
		<line x1="4" x2="20" y1="15" y2="15" />
		<line x1="10" x2="8" y1="3" y2="21" />
		<line x1="16" x2="14" y1="3" y2="21" />
	</>,
);

const LANGUAGE_ICONS: Record<string, typeof IconFile> = {
	json: IconBraces,
	css: IconHash,
	scss: IconHash,
	js: IconCode,
	jsx: IconCode,
	ts: IconCode,
	tsx: IconCode,
	typescript: IconCode,
	javascript: IconCode,
	bash: IconTerminal,
	sh: IconTerminal,
	shell: IconTerminal,
	zsh: IconTerminal,
	console: IconTerminal,
};

export function getLanguageIcon(language?: string) {
	if (!language) {
		return null;
	}

	const Icon = LANGUAGE_ICONS[language] ?? IconFile;
	return <Icon />;
}
