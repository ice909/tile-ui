import { TAvatar, TAvatarFallback, TAvatarGroup, TAvatarGroupCount } from '@tile-ui/vue';

export default function AvatarDemo() {
	return (
		<div class="button-group">
			<TAvatar size="sm">
				<TAvatarFallback>TU</TAvatarFallback>
			</TAvatar>
			<TAvatar>
				<TAvatarFallback>TU</TAvatarFallback>
			</TAvatar>
			<TAvatar size="lg">
				<TAvatarFallback>TU</TAvatarFallback>
			</TAvatar>
			<TAvatarGroup>
				<TAvatar>
					<TAvatarFallback>A</TAvatarFallback>
				</TAvatar>
				<TAvatar>
					<TAvatarFallback>B</TAvatarFallback>
				</TAvatar>
				<TAvatarGroupCount>+3</TAvatarGroupCount>
			</TAvatarGroup>
		</div>
	);
}
