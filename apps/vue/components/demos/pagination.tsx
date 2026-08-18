import { TPagination, TPaginationContent, TPaginationItem, TPaginationPrevious, TPaginationLink, TPaginationNext } from '@tile-ui/vue';

export default function PaginationDemo() {
	return (
		<TPagination>
			<TPaginationContent>
				<TPaginationItem>
					<TPaginationPrevious />
				</TPaginationItem>
				<TPaginationItem>
					<TPaginationLink href="#" isActive>
						1
					</TPaginationLink>
				</TPaginationItem>
				<TPaginationItem>
					<TPaginationLink href="#">2</TPaginationLink>
				</TPaginationItem>
				<TPaginationItem>
					<TPaginationNext />
				</TPaginationItem>
			</TPaginationContent>
		</TPagination>
	);
}
