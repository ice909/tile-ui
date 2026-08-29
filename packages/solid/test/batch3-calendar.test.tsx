import { execFileSync } from 'node:child_process';
import { createSignal, type JSX } from 'solid-js';
import { render } from 'solid-js/web';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CalendarRange, CalendarSelection } from '@tile-ui/core';
import { Calendar, CalendarDayButton } from '../src/components/calendar/calendar';

const disposers: Array<() => void> = [];

function mount(node: () => JSX.Element) {
	const container = document.createElement('div');
	document.body.appendChild(container);
	disposers.push(render(node, container));
	return container;
}

function day(container: HTMLElement, value: string) {
	return container.querySelector<HTMLButtonElement>(`[data-day="${value}"]`) as HTMLButtonElement;
}

function keydown(element: HTMLElement, key: string) {
	element.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
}

function selectionKeys(selection: CalendarSelection): string[] {
	if (!selection) return [];
	if (selection instanceof Date) return [localDateKey(selection)];
	if (Array.isArray(selection)) return selection.map(localDateKey);
	return [selection.from, selection.to].flatMap((value) => (value ? [localDateKey(value)] : []));
}

function localDateKey(date: Date): string {
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

afterEach(() => {
	for (const dispose of disposers.splice(0)) dispose();
	document.body.innerHTML = '';
	vi.restoreAllMocks();
});

describe('Solid Calendar Batch 3 lane', () => {
	it('exports deterministic day state, date keys, labels, and custom children', () => {
		const container = mount(() => (
			<CalendarDayButton
				date={new Date(2024, 1, 29)}
				locale="en-US"
				modifiers={{ selected: true, rangeStart: true, rangeEnd: false, rangeMiddle: false, outside: true, disabled: true, today: true }}>
				Leap
			</CalendarDayButton>
		));
		const button = container.querySelector('button') as HTMLButtonElement;
		expect(button.textContent).toBe('Leap');
		expect(button.dataset.day).toBe('2024-02-29');
		expect(button.getAttribute('aria-label')).toBe('Thursday, February 29, 2024');
		expect(button.getAttribute('aria-current')).toBe('date');
		expect(button.hasAttribute('aria-selected')).toBe(false);
		expect(button.getAttribute('data-selected')).toBe('true');
		expect(button.disabled).toBe(true);
		expect([button.dataset.rangeStart, button.dataset.outside, button.dataset.disabled, button.dataset.today]).toEqual(['true', 'true', 'true', 'true']);
	});

	it('renders a locale-forwarded six-week grid with row, gridcell, outside, disabled, and one-tab-stop semantics', () => {
		const container = mount(() => <Calendar defaultMonth={new Date(2024, 1, 12)} locale="de-DE" disabled={(date) => date.getDay() === 0} />);
		const grid = container.querySelector('[role="grid"]') as HTMLElement;
		const rows = grid.querySelectorAll('[role="row"]');
		const cells = grid.querySelectorAll('[role="gridcell"]');
		const buttons = grid.querySelectorAll<HTMLButtonElement>('[data-slot="calendar-day-button"]');
		expect(grid.getAttribute('aria-label')).toBe('Februar 2024');
		expect(Array.from(grid.querySelectorAll('[role="columnheader"]'), (header) => header.textContent)).toEqual(['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']);
		expect(rows).toHaveLength(7);
		expect(cells).toHaveLength(42);
		expect(buttons).toHaveLength(42);
		expect(Array.from(buttons).filter((button) => button.tabIndex === 0)).toHaveLength(1);
		expect(day(container, '2024-01-28').dataset.outside).toBe('true');
		expect(day(container, '2024-02-04').disabled).toBe(true);
		expect(day(container, '2024-02-29').getAttribute('aria-label')).toContain('Donnerstag');
		expect(day(container, '2024-02-29').hasAttribute('aria-selected')).toBe(false);
		expect(cells[3].getAttribute('aria-selected')).toBe('false');
	});

	it('hides outside days with gridcell placeholders and navigates across leap-year month boundaries', () => {
		const container = mount(() => <Calendar defaultMonth={new Date(2024, 1, 1)} showOutsideDays={false} />);
		expect(container.querySelectorAll('[role="gridcell"]')).toHaveLength(42);
		expect(container.querySelectorAll('[data-slot="calendar-day-button"]')).toHaveLength(29);
		expect(container.querySelector('[data-day="2024-01-31"]')).toBeNull();
		(container.querySelector('[aria-label="Next month"]') as HTMLButtonElement).click();
		expect(container.querySelector('[role="grid"]')?.getAttribute('aria-label')).toBe('March 2024');
		expect(container.querySelectorAll('[data-slot="calendar-day-button"]')).toHaveLength(31);
		(container.querySelector('[aria-label="Previous month"]') as HTMLButtonElement).click();
		expect(container.querySelector('[role="grid"]')?.getAttribute('aria-label')).toBe('February 2024');
	});

	it('supports uncontrolled single, multiple, and range selection including restart and date boundaries', () => {
		const singleChanges: string[][] = [];
		const single = mount(() => <Calendar defaultMonth={new Date(2023, 11, 1)} onSelect={(next) => singleChanges.push(selectionKeys(next))} />);
		day(single, '2024-01-01').click();
		expect(single.querySelector('[role="grid"]')?.getAttribute('aria-label')).toBe('January 2024');
		expect(day(single, '2024-01-01').dataset.selected).toBe('true');
		expect(single.querySelector<HTMLElement>('[data-day="2024-01-01"]')?.closest('[role="gridcell"]')?.getAttribute('aria-selected')).toBe('true');
		expect(singleChanges).toEqual([['2024-01-01']]);

		const multipleChanges: string[][] = [];
		const multiple = mount(() => <Calendar mode="multiple" defaultMonth={new Date(2024, 1, 1)} onSelect={(next) => multipleChanges.push(selectionKeys(next))} />);
		day(multiple, '2024-02-28').click();
		day(multiple, '2024-02-29').click();
		day(multiple, '2024-02-28').click();
		expect(multipleChanges).toEqual([['2024-02-28'], ['2024-02-28', '2024-02-29'], ['2024-02-29']]);

		const ranges: CalendarRange[] = [];
		const range = mount(() => <Calendar mode="range" defaultMonth={new Date(2024, 1, 1)} onSelect={(next) => ranges.push(next as CalendarRange)} />);
		day(range, '2024-02-20').click();
		day(range, '2024-02-18').click();
		day(range, '2024-02-22').click();
		expect(ranges.map(selectionKeys)).toEqual([['2024-02-20'], ['2024-02-18'], ['2024-02-18', '2024-02-22']]);
		expect(day(range, '2024-02-18').dataset.rangeStart).toBe('true');
		expect(day(range, '2024-02-20').dataset.rangeMiddle).toBe('true');
		expect(day(range, '2024-02-22').dataset.rangeEnd).toBe('true');
		day(range, '2024-02-25').click();
		expect(selectionKeys(ranges.at(-1))).toEqual(['2024-02-25']);
	});

	it('emits controlled requests, accepts explicit clearing, and follows genuine external month changes', () => {
		let update!: (value: Date | CalendarRange | undefined) => void;
		const requests: string[][] = [];
		const container = mount(() => {
			const [selected, setSelected] = createSignal<Date | CalendarRange | undefined>(new Date(2024, 2, 5));
			update = setSelected;
			return <Calendar defaultMonth={new Date(2024, 2, 1)} selected={selected()} onSelect={(next) => requests.push(selectionKeys(next))} />;
		});
		day(container, '2024-03-08').click();
		expect(requests).toEqual([['2024-03-08']]);
		expect(day(container, '2024-03-05').dataset.selected).toBe('true');
		expect(day(container, '2024-03-08').dataset.selected).toBe('false');
		update(new Date(2024, 2, 8));
		expect(day(container, '2024-03-08').dataset.selected).toBe('true');
		update(undefined);
		expect(container.querySelectorAll('[data-selected="true"]')).toHaveLength(0);
		day(container, '2024-03-09').click();
		expect(requests.at(-1)).toEqual(['2024-03-09']);
		expect(container.querySelectorAll('[data-selected="true"]')).toHaveLength(0);
		update(new Date(2024, 2, 8));
		(container.querySelector('[aria-label="Next month"]') as HTMLButtonElement).click();
		expect(container.querySelector('[role="grid"]')?.getAttribute('aria-label')).toBe('April 2024');
		update(new Date(2024, 2, 9));
		expect(container.querySelector('[role="grid"]')?.getAttribute('aria-label')).toBe('April 2024');
		update({ from: new Date(2024, 5, 20), to: new Date(2024, 6, 2) });
		expect(container.querySelector('[role="grid"]')?.getAttribute('aria-label')).toBe('June 2024');
		expect(day(container, '2024-06-20').dataset.rangeStart).toBe('true');
		update(undefined);
		expect(container.querySelector('[role="grid"]')?.getAttribute('aria-label')).toBe('June 2024');
		expect(container.querySelectorAll('[data-selected="true"]')).toHaveLength(0);
		day(container, '2024-06-21').click();
		expect(requests.at(-1)).toEqual(['2024-06-21']);
		expect(container.querySelectorAll('[data-selected="true"]')).toHaveLength(0);
	});

	it('keeps explicitly controlled range clearing distinct from uncontrolled state', () => {
		let clear!: () => void;
		const container = mount(() => {
			const [selected, setSelected] = createSignal<CalendarRange | undefined>({ from: new Date(2024, 4, 10), to: new Date(2024, 4, 12) });
			clear = () => setSelected(undefined);
			return <Calendar mode="range" defaultMonth={new Date(2024, 4, 1)} selected={selected()} />;
		});
		expect(day(container, '2024-05-11').dataset.rangeMiddle).toBe('true');
		clear();
		expect(container.querySelectorAll('[data-selected="true"]')).toHaveLength(0);
		expect(day(container, '2024-05-11').dataset.rangeMiddle).toBe('false');
	});

	it('captures today once as a local civil date and forwards the root ref', () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date(2024, 6, 4, 23, 30));
		let root: HTMLDivElement | undefined;
		const container = mount(() => <Calendar ref={(element) => (root = element)} defaultMonth={new Date(2024, 6, 1)} />);
		expect(root).toBe(container.firstElementChild);
		expect(day(container, '2024-07-04').dataset.today).toBe('true');
		vi.setSystemTime(new Date(2024, 6, 5, 0, 30));
		expect(day(container, '2024-07-04').dataset.today).toBe('true');
		expect(day(container, '2024-07-05').dataset.today).toBe('false');
		vi.useRealTimers();
	});

	it('uses explicit today as the default initial month without selecting it', () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date(2030, 0, 1));
		const container = mount(() => <Calendar today={new Date(2024, 10, 30, 23, 59)} locale="en-US" />);
		expect(container.querySelector('[role="grid"]')?.getAttribute('aria-label')).toBe('November 2024');
		expect(day(container, '2024-11-30').dataset.today).toBe('true');
		expect(day(container, '2024-11-30').dataset.selected).toBe('false');
		vi.useRealTimers();
	});

	it('rejects disabled selection and lets tuple handlers cancel selection and keyboard navigation user-first', () => {
		const changes = vi.fn();
		const calls: string[] = [];
		const tuple = (label: string, event: MouseEvent | KeyboardEvent) => {
			calls.push(label);
			event.preventDefault();
		};
		const container = mount(() => (
			<Calendar defaultMonth={new Date(2024, 3, 1)} disabled={(date) => date.getDate() === 10} onSelect={changes} onClick={[tuple, 'click']} onKeyDown={[tuple, 'key']} />
		));
		day(container, '2024-04-10').click();
		expect(calls).toEqual([]);
		day(container, '2024-04-11').click();
		expect(calls).toEqual(['click']);
		expect(changes).not.toHaveBeenCalled();
		const april11 = day(container, '2024-04-11');
		april11.focus();
		keydown(april11, 'ArrowRight');
		expect(calls).toEqual(['click', 'key']);
		expect(document.activeElement).toBe(april11);
	});

	it('provides disabled-aware roving arrows, week bounds, and month paging with one tab stop', async () => {
		const container = mount(() => (
			<Calendar defaultMonth={new Date(2024, 1, 1)} defaultSelected={new Date(2024, 1, 29)} disabled={(date) => date.getDate() === 1 || date.getDate() === 3} />
		));
		const leapDay = day(container, '2024-02-29');
		expect(leapDay.tabIndex).toBe(0);
		leapDay.focus();
		keydown(leapDay, 'ArrowRight');
		await Promise.resolve();
		expect(document.activeElement).toBe(day(container, '2024-03-02'));
		keydown(document.activeElement as HTMLElement, 'Home');
		await Promise.resolve();
		expect(document.activeElement).toBe(day(container, '2024-02-25'));
		keydown(document.activeElement as HTMLElement, 'End');
		await Promise.resolve();
		expect(document.activeElement).toBe(day(container, '2024-03-02'));
		keydown(document.activeElement as HTMLElement, 'PageDown');
		await Promise.resolve();
		expect(container.querySelector('[role="grid"]')?.getAttribute('aria-label')).toBe('April 2024');
		expect(document.activeElement).toBe(day(container, '2024-04-02'));
		expect(Array.from(container.querySelectorAll<HTMLButtonElement>('[data-slot="calendar-day-button"]')).filter((button) => button.tabIndex === 0)).toHaveLength(1);
	});

	it('SSR fixture is deterministic and hydrates without replacing calendar nodes', () => {
		expect(() => execFileSync(process.execPath, ['test/fixtures/batch3-calendar-ssr.mjs'], { cwd: process.cwd(), stdio: 'pipe', maxBuffer: 20 * 1024 * 1024 })).not.toThrow();
		for (const TZ of ['UTC', 'America/Los_Angeles']) {
			expect(() =>
				execFileSync(process.execPath, ['test/fixtures/batch3-calendar-default-ssr.mjs'], {
					cwd: process.cwd(),
					env: { ...process.env, TZ },
					stdio: 'pipe',
					maxBuffer: 20 * 1024 * 1024,
				}),
			).not.toThrow();
		}
	}, 20_000);
});
