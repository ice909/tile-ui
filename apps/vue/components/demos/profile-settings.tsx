import { Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Input, Label } from '@tile-ui/vue';

export default function ProfileSettingsDemo() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Profile settings</CardTitle>
				<CardDescription>Update the details your teammates and collaborators see first.</CardDescription>
			</CardHeader>
			<CardContent>
				<div class="component-preview__stack">
					<Input label="Display name" defaultValue="Tile UI Team" />
					<Input label="Email" defaultValue="team@tile-ui.dev" />
					<div class="form-group">
						<Label>Role</Label>
						<input class="component-preview__native-field" value="Design Systems Engineer" />
					</div>
				</div>
			</CardContent>
			<CardFooter>
				<Button variant="outline">Cancel</Button>
				<Button>Save changes</Button>
			</CardFooter>
		</Card>
	);
}
