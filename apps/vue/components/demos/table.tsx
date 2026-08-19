import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@tile-ui/vue';

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
			</TableBody>
		</Table>
	);
}
