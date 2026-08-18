import { defineComponent } from 'vue';
import { useMediaQuery } from '@tile-ui/vue';

export default defineComponent({
	name: 'UseMediaQueryDemo',
	setup() {
		const isCompact = useMediaQuery('(max-width: 640px)');
		return () => (
			<div class="component-preview__stack">
				<div class="card-link">
					<p class="component-preview__text">
						{isCompact.value
							? 'Compact mode simulates a mobile layout with tighter spacing and fewer secondary controls.'
							: 'Expanded mode simulates a desktop layout with more room for metadata and supporting actions.'}
					</p>
				</div>
			</div>
		);
	},
});
