import { ChartContainer } from '@tile-ui/solid';

const data = [
	{ month: 'Jan', revenue: 42, refunds: -8, forecast: 38 },
	{ month: 'Feb', revenue: 58, refunds: -12, forecast: 52 },
	{ month: 'Mar', revenue: 51, refunds: -6, forecast: 60 },
	{ month: 'Apr', revenue: 76, refunds: -15, forecast: 69 },
	{ month: 'May', revenue: 68, refunds: -9, forecast: 74 },
];

const config = {
	revenue: { label: 'Revenue', theme: { light: '#0f766e', dark: '#5eead4' } },
	refunds: { label: 'Refunds', theme: { light: '#c2410c', dark: '#fdba74' } },
	forecast: { label: 'Forecast', theme: { light: '#1d4ed8', dark: '#93c5fd' } },
};

export default function ChartDemo() {
	return (
		<div class="component-preview__stack">
			<ChartContainer
				title="Monthly revenue, refunds, and forecast"
				config={config}
				data={data}
				xKey="month"
				series={[
					{ key: 'revenue', type: 'bar' },
					{ key: 'refunds', type: 'bar' },
					{ key: 'forecast', type: 'area' },
				]}
				initialDimension={{ width: 640, height: 320 }}
				tabIndex={0}
			/>
			<ChartContainer
				title="Monthly forecast line"
				config={config}
				data={data}
				xKey="month"
				series={[
					{ key: 'revenue', type: 'line' },
					{ key: 'forecast', type: 'line' },
				]}
				initialDimension={{ width: 640, height: 280 }}
				tabIndex={0}
			/>
		</div>
	);
}
