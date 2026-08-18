import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount } from '@tile-ui/react';

export default function AvatarDemo() {
	return (
		<div className="button-group">
			<Avatar size="sm">
				<AvatarFallback>TU</AvatarFallback>
			</Avatar>
			<Avatar>
				<AvatarFallback>TU</AvatarFallback>
			</Avatar>
			<Avatar size="lg">
				<AvatarFallback>TU</AvatarFallback>
			</Avatar>
			<AvatarGroup>
				<Avatar>
					<AvatarFallback>A</AvatarFallback>
				</Avatar>
				<Avatar>
					<AvatarFallback>B</AvatarFallback>
				</Avatar>
				<AvatarGroupCount>+3</AvatarGroupCount>
			</AvatarGroup>
		</div>
	);
}
