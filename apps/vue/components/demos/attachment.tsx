import { Attachment, AttachmentMedia, AttachmentFileIcon, AttachmentContent, AttachmentTitle, AttachmentDescription, AttachmentActions, Button } from '@tile-ui/vue';

export default function AttachmentDemo() {
	return (
		<Attachment>
			<AttachmentMedia>
				<AttachmentFileIcon kind="pdf" />
			</AttachmentMedia>
			<AttachmentContent>
				<AttachmentTitle>report.pdf</AttachmentTitle>
				<AttachmentDescription>2.4 MB</AttachmentDescription>
			</AttachmentContent>
			<AttachmentActions>
				<Button size="sm" variant="outline">
					Download
				</Button>
			</AttachmentActions>
		</Attachment>
	);
}
