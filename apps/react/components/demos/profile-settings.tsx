import { Card, CardHeader, CardTitle, CardDescription, CardContent, Input, Label, CardFooter, Button } from '@tile-ui/react';

export default function ProfileSettingsDemo() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Profile settings</CardTitle>
				<CardDescription>Update the details your teammates and collaborators see first.</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="component-preview__stack">
					<Input label="Display name" defaultValue="Tile UI Team" />
					<Input label="Email" defaultValue="team@tile-ui.dev" />
					<div className="form-group">
						<Label htmlFor="profile-role">Role</Label>
						<input id="profile-role" className="component-preview__native-field" defaultValue="Design Systems Engineer" />
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
