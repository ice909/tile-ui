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

async function copyToClipboard(value: string) {
	if (navigator.clipboard?.writeText) {
		try {
			await navigator.clipboard.writeText(value);
			return;
		} catch {
			// 回退到 legacy 方案。
		}
	}

	legacyCopyToClipboard(value);
}

export default defineNuxtPlugin(() => {
	document.addEventListener('click', (event) => {
		const button = (event.target as HTMLElement | null)?.closest?.('[data-slot="copy-button"]');
		if (!button) {
			return;
		}

		const figure = button.closest('[data-rehype-pretty-code-figure]');
		const code = figure?.querySelector('pre code');
		const value = (code?.textContent ?? '').replace(/\n$/, '');
		if (!value) {
			return;
		}

		void copyToClipboard(value);
		button.setAttribute('data-copied', 'true');

		window.setTimeout(() => {
			button.removeAttribute('data-copied');
		}, 2000);
	});
});
