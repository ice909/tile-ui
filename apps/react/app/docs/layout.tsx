import { ReactDocsSidebar } from '@/components/react-docs-sidebar';
import { source } from '../../lib/source';

export default function DocsLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="docs-layout">
			<ReactDocsSidebar tree={source.pageTree} />
			<main className="docs-layout__content">{children}</main>
		</div>
	);
}
