import { Button, ButtonGroup, ButtonGroupSeparator, ButtonGroupText } from '@tile-ui/solid';

export default function ButtonGroupDemo() {
	return (
		<form class="component-preview__stack" onSubmit={(event) => event.preventDefault()}>
			<ButtonGroup>
				<Button type="submit">Save</Button>
				<ButtonGroupSeparator />
				<Button type="reset" variant="outline">
					Reset
				</Button>
				<ButtonGroupText>Keyboard-ready native actions</ButtonGroupText>
			</ButtonGroup>
		</form>
	);
}
