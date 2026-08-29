import { ChartContainer } from '../../src/components/chart/chart';

const config = {
	revenue: { label: 'Revenue', theme: { light: '#0f766e', dark: '#5eead4' } },
	unsafe: { label: 'Unsafe', color: '</style><script>globalThis.chartAttack=true</script>' },
};
const data = [
	{ month: 'Jan', revenue: 12, unsafe: -4 },
	{ month: 'Feb', revenue: 18, unsafe: 6 },
];

export function Batch5ChartHydrationFixture() {
	return (
		<ChartContainer
			data-id="batch5-chart-root"
			title="Revenue trend"
			config={config}
			data={data}
			xKey="month"
			series={[
				{ key: 'revenue', type: 'area' },
				{ key: 'unsafe', type: 'area', color: '#334155' },
			]}
			initialDimension={{ width: 480, height: 240 }}
		/>
	);
}
