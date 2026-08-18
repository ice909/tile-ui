import { TButton, TCard, TCardContent, TCardDescription, TCardFooter, TCardHeader, TCardTitle, TInput, TLabel } from '@tile-ui/vue';

export default function ProfileSettingsDemo() {
	return (
		<TCard>
			<TCardHeader>
				<TCardTitle>Profile settings</TCardTitle>
				<TCardDescription>Update the details your teammates and collaborators see first.</TCardDescription>
			</TCardHeader>
			<TCardContent>
				<div class="component-preview__stack">
					<TInput label="Display name" defaultValue="Tile UI Team" />
					<TInput label="Email" defaultValue="team@tile-ui.dev" />
					<div class="form-group">
						<TLabel>Role</TLabel>
						<input class="component-preview__native-field" value="Design Systems Engineer" />
					</div>
				</div>
			</TCardContent>
			<TCardFooter>
				<TButton variant="outline">Cancel</TButton>
				<TButton>Save changes</TButton>
			</TCardFooter>
		</TCard>
	);
}
