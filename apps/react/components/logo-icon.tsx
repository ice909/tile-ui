export function LogoIcon({ className = 'docs-app-brand__logo' }: { className?: string }) {
	return (
		<svg className={className} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
			<rect width="64" height="64" rx="14" fill="#18181b" />
			<rect x="14" y="14" width="16" height="16" rx="4" fill="#fafafa" />
			<rect x="34" y="14" width="16" height="16" rx="4" fill="#a1a1aa" />
			<rect x="14" y="34" width="16" height="16" rx="4" fill="#a1a1aa" />
			<rect x="34" y="34" width="16" height="16" rx="4" fill="#fafafa" />
		</svg>
	);
}
