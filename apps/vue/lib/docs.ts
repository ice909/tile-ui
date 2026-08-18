export type DocsTreeNode = {
	type: string;
	name: string;
	url?: string;
	children?: DocsTreeNode[];
};

export type DocTocItem = {
	title: string;
	url: string;
	depth: number;
};

export type DocsPageSummary = {
	url: string;
	title: string;
};

export type PreviewCodePayload = {
	preview: string;
	full: string;
	raw: string;
};

export type DocPayload = {
	doc: {
		url: string;
		title: string;
		description: string;
		html: string;
		toc: DocTocItem[];
		previewCode: PreviewCodePayload | null;
	};
	neighbours: {
		previous: DocsPageSummary | null;
		next: DocsPageSummary | null;
	};
	tree: DocsTreeNode;
};
