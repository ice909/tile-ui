import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@tile-ui/solid';
export default function TableDemo() {
	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Package</TableHead>
					<TableHead>Components</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				<TableRow>
					<TableCell>@tile-ui/solid</TableCell>
					<TableCell>61</TableCell>
				</TableRow>
				<TableRow>
					<TableCell>SSR</TableCell>
					<TableCell>Ready</TableCell>
				</TableRow>
			</TableBody>
		</Table>
	);
}
