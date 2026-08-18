import { TTable, TTableHeader, TTableRow, TTableHead, TTableBody, TTableCell } from '@tile-ui/vue';

export default function TableDemo() {
	return (
		<TTable>
			<TTableHeader>
				<TTableRow>
					<TTableHead>Name</TTableHead>
					<TTableHead>Role</TTableHead>
				</TTableRow>
			</TTableHeader>
			<TTableBody>
				<TTableRow>
					<TTableCell>Tile UI</TTableCell>
					<TTableCell>Design system</TTableCell>
				</TTableRow>
			</TTableBody>
		</TTable>
	);
}
