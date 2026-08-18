import { TAttachment, TAttachmentMedia, TAttachmentFileIcon, TAttachmentContent, TAttachmentTitle, TAttachmentDescription, TAttachmentActions, TButton } from '@tile-ui/vue';

export default function AttachmentDemo() {
	return (
		<TAttachment>
			<TAttachmentMedia>
				<TAttachmentFileIcon kind="pdf" />
			</TAttachmentMedia>
			<TAttachmentContent>
				<TAttachmentTitle>report.pdf</TAttachmentTitle>
				<TAttachmentDescription>2.4 MB</TAttachmentDescription>
			</TAttachmentContent>
			<TAttachmentActions>
				<TButton size="sm" variant="outline">
					Download
				</TButton>
			</TAttachmentActions>
		</TAttachment>
	);
}
