import { docs } from '@/.source';
import { loader } from 'fumadocs-core/source';

export const source = loader({
	baseUrl: '/docs',
	source: docs.toFumadocsSource(),
});

// 与 Vue 文档站保持一致：目录内页面按标题字母序排列，
// 避免按文件路径排序时 `alert-dialog` 排在 `alert` 之前。
type TreeNode = {
	name?: unknown;
	children?: TreeNode[];
};

function getNodeName(node: TreeNode) {
	return typeof node.name === 'string' ? node.name : '';
}

function sortChildrenByTitle(nodes: TreeNode[]): TreeNode[] {
	return nodes
		.map((node) => (node.children?.length ? { ...node, children: sortChildrenByTitle(node.children) } : node))
		.sort((a, b) => getNodeName(a).localeCompare(getNodeName(b)));
}

const tree = source.pageTree as unknown as TreeNode;
if (tree.children) {
	tree.children = tree.children.map((node) => (node.children?.length ? { ...node, children: sortChildrenByTitle(node.children) } : node));
}
