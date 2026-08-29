import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@tile-ui/solid';

export default function PaginationDemo() {
	return (
		<Pagination aria-label="Component pages">
			<PaginationContent>
				<PaginationItem>
					<PaginationPrevious href="?page=1" />
				</PaginationItem>
				<PaginationItem>
					<PaginationLink href="?page=1">1</PaginationLink>
				</PaginationItem>
				<PaginationItem>
					<PaginationLink href="?page=2" isActive>
						2
					</PaginationLink>
				</PaginationItem>
				<PaginationItem>
					<PaginationEllipsis />
				</PaginationItem>
				<PaginationItem>
					<PaginationLink href="?page=9">9</PaginationLink>
				</PaginationItem>
				<PaginationItem>
					<PaginationNext href="?page=3" />
				</PaginationItem>
			</PaginationContent>
		</Pagination>
	);
}
