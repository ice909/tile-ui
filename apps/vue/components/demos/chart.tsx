import { ChartContainer } from '@tile-ui/vue';

export default function ChartDemo() {
	return (
		<ChartContainer
			config={{ desktop: { label: 'Desktop', color: '#3b82f6' }, mobile: { label: 'Mobile', color: '#22c55e' } }}
			data={[
				{ x: 'Jan', desktop: 100, mobile: 80 },
				{ x: 'Feb', desktop: 140, mobile: 90 },
				{ x: 'Mar', desktop: 120, mobile: 130 },
				{ x: 'Apr', desktop: 180, mobile: 150 },
			]}
			xKey="x"
			type="line"
			showLegend
		/>
	);
}
