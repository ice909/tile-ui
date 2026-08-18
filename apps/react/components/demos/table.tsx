import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@tile-ui/react';

export default function TableDemo() {
	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Name</TableHead>
					<TableHead>Role</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				<TableRow>
					<TableCell>Tile UI</TableCell>
					<TableCell>Design system</TableCell>
				</TableRow>
				<TableRow>
					<TableCell>shadcn</TableCell>
					<TableCell>Registry</TableCell>
				</TableRow>
			</TableBody>
		</Table>
	);
}
