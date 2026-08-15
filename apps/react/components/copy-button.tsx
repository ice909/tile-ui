'use client';

import { useEffect, useState } from 'react';

import { IconCheck, IconCopy } from '@/components/code-icons';

function legacyCopyToClipboard(value: string) {
	const textArea = document.createElement('textarea');
	textArea.value = value;
	textArea.setAttribute('readonly', '');
	textArea.style.position = 'fixed';
	textArea.style.opacity = '0';
	textArea.style.pointerEvents = 'none';

	document.body.appendChild(textArea);
	textArea.focus();
	textArea.select();
	textArea.setSelectionRange(0, value.length);

	let hasCopied = false;
	try {
		hasCopied = document.execCommand('copy');
	} catch {
		hasCopied = false;
	}

	document.body.removeChild(textArea);
	return hasCopied;
}

export async function copyToClipboard(value: string) {
	if (typeof window === 'undefined') {
		return false;
	}

	if (!value) {
		return false;
	}

	if (navigator.clipboard?.writeText) {
		try {
			await navigator.clipboard.writeText(value);
			return true;
		} catch {
			return legacyCopyToClipboard(value);
		}
	}

	return legacyCopyToClipboard(value);
}

export function CopyButton({ value, className }: { value: string; className?: string }) {
	const [hasCopied, setHasCopied] = useState(false);

	useEffect(() => {
		if (!hasCopied) {
			return;
		}

		const timer = setTimeout(() => setHasCopied(false), 2000);
		return () => clearTimeout(timer);
	}, [hasCopied]);

	return (
		<button
			type="button"
			data-slot="copy-button"
			data-copied={hasCopied}
			className={className}
			aria-label="Copy code"
			onClick={async () => {
				const ok = await copyToClipboard(value);
				if (ok) {
					setHasCopied(true);
				}
			}}>
			<span className="icon-copy">
				<IconCopy />
			</span>
			<span className="icon-check">
				<IconCheck />
			</span>
		</button>
	);
}
