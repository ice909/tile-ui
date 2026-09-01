import { Show, createSignal, type JSX } from 'solid-js';
import { render } from 'solid-js/web';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Badge } from '../src/components/badge/badge';
import { Button } from '../src/components/button/button';
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../src/components/card/card';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogOverlay, DialogTitle, DialogTrigger } from '../src/components/dialog/dialog';
import { Input } from '../src/components/input/input';
import { Separator } from '../src/components/separator/separator';
import { Toggle } from '../src/components/toggle/toggle';
import { Alert, AlertDescription, AlertTitle } from '../src/components/alert/alert';
import { AspectRatio } from '../src/components/aspect-ratio/aspect-ratio';
import { AttachmentActions, AttachmentCard, AttachmentFileIcon } from '../src/components/attachment/attachment';
import { Avatar, AvatarFallback, AvatarImage } from '../src/components/avatar/avatar';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '../src/components/breadcrumb/breadcrumb';
import { Bubble, BubbleContent, BubbleReactions } from '../src/components/bubble/bubble';
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from '../src/components/empty/empty';
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '../src/components/item/item';
import { Kbd, KbdGroup } from '../src/components/kbd/kbd';
import { Label } from '../src/components/label/label';
import { Marker, MarkerContent, MarkerIcon } from '../src/components/marker/marker';
import { Skeleton } from '../src/components/skeleton/skeleton';
import { Spinner } from '../src/components/spinner/spinner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../src/components/table/table';

const disposers: Array<() => void> = [];

function mount(node: () => JSX.Element) {
	const container = document.createElement('div');
	document.body.appendChild(container);
	const dispose = render(node, container);
	disposers.push(dispose);
	return container;
}

afterEach(() => {
	for (const dispose of disposers.splice(0)) dispose();
	document.body.innerHTML = '';
	document.body.style.overflow = '';
	vi.restoreAllMocks();
});

describe('基础组件契约', () => {
	it('Batch 1 presentational families preserve native semantics, props, class, and children', () => {
		const container = mount(() => (
			<>
				<Alert class="user">
					<AlertTitle>Title</AlertTitle>
					<AlertDescription>Description</AlertDescription>
				</Alert>
				<AspectRatio ratio={2} data-id="ratio">
					ratio
				</AspectRatio>
				<Breadcrumb>
					<BreadcrumbList>
						<BreadcrumbItem>
							<BreadcrumbLink href="/docs">Docs</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbPage>Solid</BreadcrumbPage>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>
				<Bubble align="end">
					<BubbleContent>Message</BubbleContent>
					<BubbleReactions>1</BubbleReactions>
				</Bubble>
				<Empty>
					<EmptyMedia variant="icon">+</EmptyMedia>
					<EmptyTitle>Empty</EmptyTitle>
					<EmptyDescription>None</EmptyDescription>
				</Empty>
				<Item variant="outline">
					<ItemMedia>S</ItemMedia>
					<ItemContent>
						<ItemTitle>Item</ItemTitle>
						<ItemDescription>Details</ItemDescription>
					</ItemContent>
				</Item>
				<KbdGroup>
					<Kbd>Ctrl</Kbd>
					<Kbd>K</Kbd>
				</KbdGroup>
				<Label for="native">Native</Label>
				<Marker variant="separator">
					<MarkerIcon />
					<MarkerContent>Marker</MarkerContent>
				</Marker>
				<Skeleton data-id="skeleton" />
				<Spinner size="lg" />
				<Table containerClass="table-container">
					<TableHeader>
						<TableRow>
							<TableHead>Name</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						<TableRow data-state="selected">
							<TableCell>Solid</TableCell>
						</TableRow>
					</TableBody>
				</Table>
			</>
		));
		expect(container.querySelector('[role="alert"]')?.className).toContain('user');
		expect((container.querySelector('[data-id="ratio"]') as HTMLElement).style.getPropertyValue('--tile-aspect-ratio-padding')).toBe('50%');
		expect(container.querySelector('nav')?.getAttribute('aria-label')).toBe('breadcrumb');
		expect(container.querySelector('[data-align="end"]')?.textContent).toBe('Message1');
		expect(container.querySelector('label')?.htmlFor).toBe('native');
		expect(container.querySelector('[data-id="skeleton"]')?.getAttribute('aria-hidden')).toBe('true');
		expect(container.querySelector('[role="status"]')?.getAttribute('data-size')).toBe('lg');
		expect(container.querySelector('.table-container table')?.textContent).toBe('NameSolid');
	});

	it('AspectRatio preserves string, object, and reactive styles with constrained widths', () => {
		let setWidth!: (value: string) => void;
		const container = mount(() => {
			const [width, updateWidth] = createSignal('20rem');
			setWidth = updateWidth;
			return (
				<>
					<AspectRatio ratio={16 / 9} style={`width:${width()};max-width:30rem`} data-id="string-ratio" />
					<AspectRatio ratio={4 / 3} style={{ width: width(), 'max-width': '24rem' }} data-id="object-ratio" />
				</>
			);
		});
		const stringRatio = container.querySelector('[data-id="string-ratio"]') as HTMLElement;
		const objectRatio = container.querySelector('[data-id="object-ratio"]') as HTMLElement;
		expect(stringRatio.style.width).toBe('20rem');
		expect(stringRatio.style.maxWidth).toBe('30rem');
		expect(stringRatio.style.getPropertyValue('--tile-aspect-ratio-padding')).toBe('56.25%');
		expect(objectRatio.style.getPropertyValue('--tile-aspect-ratio-padding')).toBe('75%');
		setWidth('12rem');
		expect(stringRatio.style.width).toBe('12rem');
		expect(objectRatio.style.width).toBe('12rem');
	});

	it('Avatar reconciles an initially complete cached image synchronously', () => {
		vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(true);
		vi.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockReturnValue(64);
		const container = mount(() => (
			<Avatar>
				<AvatarImage src="data:image/svg+xml,cached" alt="Cached" />
				<AvatarFallback>TU</AvatarFallback>
			</Avatar>
		));
		expect(container.querySelector('img')).toBeTruthy();
		expect((container.querySelector('[data-slot="avatar"] span') as HTMLSpanElement).hidden).toBe(true);
	});

	it('Avatar shows fallback for an initially complete broken image', () => {
		vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(true);
		vi.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockReturnValue(0);
		const container = mount(() => (
			<Avatar>
				<AvatarImage src="data:image/png;base64,broken" alt="Broken" />
				<AvatarFallback>TU</AvatarFallback>
			</Avatar>
		));
		expect((container.querySelector('[data-slot="avatar"] span') as HTMLSpanElement).hidden).toBe(false);
	});

	it('Avatar resets on reactive src, ignores stale old-node state, and invokes function/tuple handlers', () => {
		let setSrc!: (value: string) => void;
		const calls: string[] = [];
		const tuple = (label: string, event: Event) => calls.push(`${label}:${event.type}`);
		const container = mount(() => {
			const [src, updateSrc] = createSignal('/first.png');
			setSrc = updateSrc;
			return (
				<Avatar>
					<AvatarImage src={src()} alt="Tile" onLoad={[tuple, 'load']} onError={(event) => calls.push(event.type)} />
					<AvatarFallback>TU</AvatarFallback>
				</Avatar>
			);
		});
		const image = container.querySelector('img') as HTMLImageElement;
		const fallback = container.querySelector('[data-slot="avatar"] span') as HTMLSpanElement;
		expect(fallback.hidden).toBe(false);
		image.dispatchEvent(new Event('load'));
		expect(fallback.hidden).toBe(true);
		expect(calls).toEqual(['load:load']);
		setSrc('/second.png');
		const nextImage = container.querySelector('img') as HTMLImageElement;
		expect(nextImage).not.toBe(image);
		expect(nextImage.getAttribute('src')).toBe('/second.png');
		expect(fallback.hidden).toBe(false);
		image.dispatchEvent(new Event('load'));
		expect(fallback.hidden).toBe(false);
		nextImage.dispatchEvent(new Event('error'));
		expect(fallback.hidden).toBe(false);
		expect(calls).toEqual(['load:load', 'load:load', 'error']);
	});

	it('Avatar generation guard handles A to B to A and cleanup without stale state writes', () => {
		let setSrc!: (value: string) => void;
		let setVisible!: (value: boolean) => void;
		const container = mount(() => {
			const [src, updateSrc] = createSignal('/a.png');
			const [visible, updateVisible] = createSignal(true);
			setSrc = updateSrc;
			setVisible = updateVisible;
			return (
				<Show when={visible()}>
					<Avatar>
						<AvatarImage src={src()} alt="Generation" />
						<AvatarFallback hidden={false}>TU</AvatarFallback>
					</Avatar>
				</Show>
			);
		});
		const firstA = container.querySelector('img') as HTMLImageElement;
		setSrc('/b.png');
		const imageB = container.querySelector('img') as HTMLImageElement;
		setSrc('/a.png');
		const secondA = container.querySelector('img') as HTMLImageElement;
		const fallback = container.querySelector('[data-slot="avatar"] span') as HTMLSpanElement;
		expect(secondA).not.toBe(firstA);
		expect(secondA).not.toBe(imageB);
		imageB.dispatchEvent(new Event('load'));
		expect(fallback.hidden).toBe(false);
		firstA.dispatchEvent(new Event('load'));
		expect(fallback.hidden).toBe(false);
		secondA.dispatchEvent(new Event('load'));
		expect(fallback.hidden).toBe(true);
		setVisible(false);
		expect(container.querySelector('[data-slot="avatar"]')).toBeNull();
		secondA.dispatchEvent(new Event('error'));
		expect(container.querySelector('[data-slot="avatar"]')).toBeNull();
	});

	it('Avatar forwards consumer refs from the actual image assignment and updates them on keyed replacement', () => {
		let setSrc!: (value: string) => void;
		let setVisible!: (value: boolean) => void;
		const refs: HTMLImageElement[] = [];
		let renderComplete = false;
		const timing: boolean[] = [];
		const container = mount(() => {
			const [src, updateSrc] = createSignal('/ref-a.png');
			const [visible, updateVisible] = createSignal(true);
			setSrc = updateSrc;
			setVisible = updateVisible;
			return (
				<Show when={visible()}>
					<Avatar>
						<AvatarImage
							src={src()}
							alt="Ref timing"
							ref={(element) => {
								refs.push(element);
								timing.push(renderComplete);
							}}
						/>
						<AvatarFallback>TU</AvatarFallback>
					</Avatar>
				</Show>
			);
		});
		renderComplete = true;
		const first = container.querySelector('img') as HTMLImageElement;
		expect(refs).toEqual([first]);
		expect(timing).toEqual([false]);
		setSrc('/ref-b.png');
		const second = container.querySelector('img') as HTMLImageElement;
		expect(second).not.toBe(first);
		expect(refs).toEqual([first, second]);
		expect(timing).toEqual([false, true]);
		setVisible(false);
		expect(container.querySelector('img')).toBeNull();
		expect(refs).toEqual([first, second]);
	});

	it('AttachmentCard isolates actions from preview and preserves cancellable function/tuple handlers', () => {
		const calls: string[] = [];
		const tuple = (label: string, event: MouseEvent) => {
			calls.push(label);
			event.preventDefault();
		};
		const container = mount(() => (
			<AttachmentCard
				name="a-very-long-solid-registry-report.pdf"
				size={2048}
				onPreview={(event) => calls.push(`preview:${event.defaultPrevented}`)}
				onDownload={[tuple, 'download']}
				onRemove={(event) => {
					calls.push('remove');
					event.preventDefault();
				}}
			/>
		));
		expect(container.textContent).toContain('2 KB');
		(container.querySelector('[aria-label="下载"]') as HTMLButtonElement).click();
		(container.querySelector('[aria-label="删除"]') as HTMLButtonElement).click();
		expect(calls).toEqual(['download', 'remove']);
		(container.firstElementChild as HTMLElement).click();
		expect(calls).toEqual(['download', 'remove', 'preview:false']);
	});

	it('Attachment actions invoke their own tuple handler before stopping card propagation', () => {
		const calls: string[] = [];
		const handler = (label: string) => calls.push(label);
		const container = mount(() => (
			<AttachmentCard
				name="report.pdf"
				onPreview={() => calls.push('preview')}
				action={
					<AttachmentActions onClick={[handler, 'actions']}>
						<button type="button">Custom</button>
					</AttachmentActions>
				}
			/>
		));
		(container.querySelector('button') as HTMLButtonElement).click();
		expect(calls).toEqual(['actions']);
	});

	it('AttachmentFileIcon covers every declared file kind with distinct family markup', () => {
		const kinds = ['image', 'video', 'audio', 'pdf', 'document', 'spreadsheet', 'presentation', 'archive', 'code', 'generic'] as const;
		const container = mount(() => (
			<>
				{kinds.map((kind) => (
					<span data-kind={kind}>
						<AttachmentFileIcon kind={kind} />
					</span>
				))}
			</>
		));
		for (const kind of kinds) expect(container.querySelector(`[data-kind="${kind}"] svg`)).toBeTruthy();
		expect(container.querySelector('[data-kind="pdf"] svg')?.innerHTML).not.toBe(container.querySelector('[data-kind="spreadsheet"] svg')?.innerHTML);
		expect(container.querySelector('[data-kind="presentation"] svg')?.innerHTML).not.toBe(container.querySelector('[data-kind="archive"] svg')?.innerHTML);
	});

	it('Table forwards table ref/attrs and merges wrapper attrs, events, and both classes', () => {
		const wrapperClick = vi.fn();
		let tableRef: HTMLTableElement | undefined;
		const container = mount(() => (
			<Table
				ref={(element) => {
					tableRef = element;
				}}
				class="table-user"
				aria-label="Packages"
				containerClass="outer-a"
				containerProps={{ class: 'outer-b', id: 'table-wrapper', onClick: wrapperClick }}>
				<TableBody>
					<TableRow>
						<TableCell>Solid</TableCell>
					</TableRow>
				</TableBody>
			</Table>
		));
		const wrapper = container.firstElementChild as HTMLDivElement;
		const table = wrapper.querySelector('table') as HTMLTableElement;
		expect(wrapper.className).toContain('outer-a');
		expect(wrapper.className).toContain('outer-b');
		expect(wrapper.id).toBe('table-wrapper');
		expect(table.className).toContain('table-user');
		expect(table.getAttribute('aria-label')).toBe('Packages');
		expect(tableRef).toBe(table);
		wrapper.click();
		expect(wrapperClick).toHaveBeenCalledOnce();
	});
	it('Button 合并 class、事件、children，并以 loading 覆盖 disabled', () => {
		const onClick = vi.fn();
		const container = mount(() => (
			<Button class="custom" variant="outline" loading onClick={onClick}>
				保存
			</Button>
		));
		const button = container.querySelector('button') as HTMLButtonElement;
		expect(button.className).toContain('variantOutline');
		expect(button.className).toContain('custom');
		expect(button.textContent).toContain('保存');
		expect(button.querySelector('svg')).toBeTruthy();
		expect(button.disabled).toBe(true);
		expect(button.type).toBe('button');
	});

	it('Badge 与 Card 保留用户属性、class 和 children', () => {
		const container = mount(() => (
			<>
				<Badge class="badge-user" data-id="badge" variant="secondary">
					标签
				</Badge>
				<Card as="article" class="card-user">
					<CardHeader>
						<CardTitle>标题</CardTitle>
						<CardDescription>描述</CardDescription>
						<CardAction>操作</CardAction>
					</CardHeader>
					<CardContent>正文</CardContent>
					<CardFooter>底部</CardFooter>
				</Card>
			</>
		));
		expect(container.querySelector('[data-id="badge"]')?.className).toContain('badge-user');
		expect(container.querySelector('article')?.className).toContain('card-user');
		expect(container.querySelector('article')?.textContent).toBe('标题描述操作正文底部');
	});

	it('Separator 默认横向，非装饰模式始终输出 aria-orientation', () => {
		const container = mount(() => (
			<>
				<Separator data-id="decorative">ignored</Separator>
				<Separator data-id="semantic" decorative={false} />
			</>
		));
		const decorative = container.querySelector('[data-id="decorative"]') as HTMLElement;
		const semantic = container.querySelector('[data-id="semantic"]') as HTMLElement;
		expect(decorative.getAttribute('role')).toBe('none');
		expect(decorative.getAttribute('aria-orientation')).toBeNull();
		expect(decorative.textContent).toBe('ignored');
		expect(semantic.getAttribute('role')).toBe('separator');
		expect(semantic.getAttribute('aria-orientation')).toBe('horizontal');
		expect(semantic.className).toContain('orientationHorizontal');
	});
});

describe('Input 状态与 ARIA', () => {
	it('使用稳定生成 ID 并关联 label、error 和 helperText', () => {
		const container = mount(() => (
			<>
				<Input label="名称" error="必填" />
				<Input label="备注" helperText="可选" />
			</>
		));
		const inputs = container.querySelectorAll('input');
		expect(inputs[0].id).not.toBe(inputs[1].id);
		expect(container.querySelector(`label[for="${inputs[0].id}"]`)).toBeTruthy();
		expect(inputs[0].getAttribute('aria-invalid')).toBe('true');
		expect(inputs[0].getAttribute('aria-describedby')).toBe(`${inputs[0].id}-error`);
		expect(inputs[1].getAttribute('aria-describedby')).toBe(`${inputs[1].id}-helper`);
	});

	it('非受控输入更新值并依次调用用户事件和值回调', () => {
		const calls: string[] = [];
		const container = mount(() => <Input defaultValue="abc" onInput={() => calls.push('input')} onChangeValue={(value) => calls.push(value)} />);
		const input = container.querySelector('input') as HTMLInputElement;
		input.value = 'xyz';
		input.dispatchEvent(new InputEvent('input', { bubbles: true }));
		expect(input.value).toBe('xyz');
		expect(calls).toEqual(['input', 'xyz']);
	});

	it('原生 value 为受控值并由外部状态决定回写', () => {
		let setValue!: (value: string) => void;
		const onChangeValue = vi.fn();
		const container = mount(() => {
			const [value, update] = createSignal('a');
			setValue = update;
			return <Input value={value()} onChangeValue={onChangeValue} />;
		});
		const input = container.querySelector('input') as HTMLInputElement;
		input.value = 'b';
		input.dispatchEvent(new InputEvent('input', { bubbles: true }));
		expect(onChangeValue).toHaveBeenCalledWith('b');
		expect(input.value).toBe('a');
		setValue('c');
		expect(input.value).toBe('c');
	});

	it('转发 required，并支持 Solid onInput tuple 处理器', () => {
		const calls: string[] = [];
		const handler = (prefix: string, event: InputEvent & { currentTarget: HTMLInputElement }) => {
			calls.push(`${prefix}:${event.currentTarget.value}`);
		};
		const container = mount(() => <Input required defaultValue="初始" onInput={[handler, 'tuple']} onChangeValue={(value) => calls.push(`value:${value}`)} />);
		const input = container.querySelector('input') as HTMLInputElement;
		expect(input.required).toBe(true);
		expect(input.value).toBe('初始');
		input.value = '更新';
		input.dispatchEvent(new InputEvent('input', { bubbles: true }));
		expect(calls).toEqual(['tuple:更新', 'value:更新']);
	});

	it('非受控 defaultValue 支持 form.reset，后续 prop 变化不覆盖用户输入', () => {
		let setDefaultValue!: (value: string) => void;
		const container = mount(() => {
			const [defaultValue, updateDefaultValue] = createSignal('初始');
			setDefaultValue = updateDefaultValue;
			return (
				<form>
					<Input name="field" defaultValue={defaultValue()} />
				</form>
			);
		});
		const form = container.querySelector('form') as HTMLFormElement;
		const input = container.querySelector('input') as HTMLInputElement;
		expect(input.value).toBe('初始');
		expect(input.defaultValue).toBe('初始');

		input.value = '用户编辑';
		setDefaultValue('后续属性');
		expect(input.value).toBe('用户编辑');
		expect(input.defaultValue).toBe('初始');

		form.reset();
		expect(input.value).toBe('初始');
	});
});

describe('Toggle 状态契约', () => {
	it('渲染 children 和默认 data 属性，并在非受控模式切换', () => {
		const onPressedChange = vi.fn();
		const container = mount(() => <Toggle onPressedChange={onPressedChange}>切换</Toggle>);
		const button = container.querySelector('button') as HTMLButtonElement;
		expect(button.textContent).toBe('切换');
		expect(button.dataset.state).toBe('off');
		expect(button.dataset.variant).toBe('default');
		expect(button.dataset.size).toBe('default');
		button.click();
		expect(button.dataset.state).toBe('on');
		expect(onPressedChange).toHaveBeenCalledWith(true);
	});

	it('受控模式只通知变更，不擅自更新状态', () => {
		const onPressedChange = vi.fn();
		const container = mount(() => (
			<Toggle pressed onPressedChange={onPressedChange}>
				受控
			</Toggle>
		));
		const button = container.querySelector('button') as HTMLButtonElement;
		button.click();
		expect(button.dataset.state).toBe('on');
		expect(onPressedChange).toHaveBeenCalledWith(false);
	});

	it('用户事件 preventDefault 时不切换', () => {
		const onPressedChange = vi.fn();
		const container = mount(() => (
			<Toggle onClick={(event) => event.preventDefault()} onPressedChange={onPressedChange}>
				取消
			</Toggle>
		));
		const button = container.querySelector('button') as HTMLButtonElement;
		button.click();
		expect(button.dataset.state).toBe('off');
		expect(onPressedChange).not.toHaveBeenCalled();
	});

	it('支持 Solid onClick tuple，并保留 preventDefault 语义', () => {
		const onPressedChange = vi.fn();
		const handler = (prevent: boolean, event: MouseEvent) => {
			if (prevent) event.preventDefault();
		};
		const container = mount(() => (
			<Toggle onClick={[handler, true]} onPressedChange={onPressedChange}>
				tuple
			</Toggle>
		));
		(container.querySelector('button') as HTMLButtonElement).click();
		expect(onPressedChange).not.toHaveBeenCalled();
	});
});

describe('Dialog 行为契约', () => {
	it('非受控打开、Portal 容器、class 合并、ARIA 与关闭语义完整', async () => {
		const portal = document.createElement('div');
		document.body.appendChild(portal);
		const onOpenChange = vi.fn();
		const container = mount(() => (
			<Dialog onOpenChange={onOpenChange}>
				<DialogTrigger class="trigger">打开</DialogTrigger>
				<DialogContent container={portal} class="content-user" overlayClass="overlay-user">
					<DialogTitle id="dialog-title">标题</DialogTitle>
					<DialogDescription id="dialog-description">描述</DialogDescription>
					<DialogClose>完成</DialogClose>
				</DialogContent>
			</Dialog>
		));
		const trigger = container.querySelector('button') as HTMLButtonElement;
		expect(trigger.getAttribute('aria-expanded')).toBe('false');
		trigger.focus();
		trigger.click();
		await Promise.resolve();

		const dialog = portal.querySelector('[role="dialog"]') as HTMLElement;
		const overlay = portal.querySelector('[data-state="open"]:not([role])') as HTMLElement;
		expect(dialog.className).toContain('content-user');
		expect(overlay.className).toContain('overlay-user');
		expect(dialog.getAttribute('aria-labelledby')).toBe('dialog-title');
		expect(dialog.getAttribute('aria-describedby')).toBe('dialog-description');
		expect(document.body.style.overflow).toBe('hidden');
		expect(document.activeElement).toBe(dialog);

		(dialog.querySelector('button:not([aria-label])') as HTMLButtonElement).click();
		expect(portal.querySelector('[role="dialog"]')).toBeNull();
		expect(document.body.style.overflow).toBe('');
		expect(document.activeElement).toBe(trigger);
		expect(onOpenChange.mock.calls.map(([value]) => value)).toEqual([true, false]);
	});

	it('缺少标题和描述时不产生悬空 ARIA 引用，aria-label 可覆盖标题', async () => {
		mount(() => (
			<Dialog defaultOpen>
				<DialogContent aria-label="确认" showCloseButton={false}>
					正文
				</DialogContent>
			</Dialog>
		));
		await Promise.resolve();
		const dialog = document.body.querySelector('[role="dialog"]') as HTMLElement;
		expect(dialog.getAttribute('aria-label')).toBe('确认');
		expect(dialog.getAttribute('aria-labelledby')).toBeNull();
		expect(dialog.getAttribute('aria-describedby')).toBeNull();
	});

	it('自定义 content id 与 trigger aria-controls 保持一致', () => {
		const container = mount(() => (
			<Dialog defaultOpen>
				<DialogTrigger>打开</DialogTrigger>
				<DialogContent id="custom-dialog" showCloseButton={false} />
			</Dialog>
		));
		expect(container.querySelector('button')?.getAttribute('aria-controls')).toBe('custom-dialog');
		expect(document.getElementById('custom-dialog')).toBeTruthy();
	});

	it('trigger、overlay 和 close 尊重 preventDefault，overlay 子元素点击不关闭', () => {
		const container = mount(() => (
			<Dialog>
				<DialogTrigger onClick={(event) => event.preventDefault()}>阻止打开</DialogTrigger>
				<DialogContent />
			</Dialog>
		));
		(container.querySelector('button') as HTMLButtonElement).click();
		expect(document.body.querySelector('[role="dialog"]')).toBeNull();

		mount(() => (
			<Dialog defaultOpen>
				<DialogOverlay onClick={(event) => event.preventDefault()}>
					<span>内部</span>
				</DialogOverlay>
				<DialogClose onClick={(event) => event.preventDefault()}>阻止关闭</DialogClose>
			</Dialog>
		));
		const overlay = document.body.querySelector('[data-state="open"]') as HTMLElement;
		(overlay.querySelector('span') as HTMLElement).click();
		expect(document.body.textContent).toContain('阻止关闭');
		overlay.click();
		expect(document.body.textContent).toContain('阻止关闭');
		(document.body.querySelector('button') as HTMLButtonElement).click();
		expect(document.body.textContent).toContain('阻止关闭');
	});

	it('受控状态由外部决定，并支持 Escape 关闭请求', () => {
		let setOpen!: (value: boolean) => void;
		const onOpenChange = vi.fn();
		mount(() => {
			const [open, update] = createSignal(true);
			setOpen = update;
			return (
				<Dialog open={open()} onOpenChange={onOpenChange}>
					<DialogContent showCloseButton={false}>正文</DialogContent>
				</Dialog>
			);
		});
		document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
		expect(onOpenChange).toHaveBeenCalledWith(false);
		expect(document.body.querySelector('[role="dialog"]')).toBeTruthy();
		setOpen(false);
		expect(document.body.querySelector('[role="dialog"]')).toBeNull();
	});

	it('Dialog 事件支持 tuple，Footer 可渲染关闭按钮', () => {
		const calls: string[] = [];
		const handler = (label: string, event: MouseEvent) => {
			calls.push(label);
			event.preventDefault();
		};
		const container = mount(() => (
			<Dialog>
				<DialogTrigger onClick={[handler, 'trigger']}>打开</DialogTrigger>
				<DialogContent>
					<DialogFooter showCloseButton />
				</DialogContent>
			</Dialog>
		));
		(container.querySelector('button') as HTMLButtonElement).click();
		expect(calls).toEqual(['trigger']);
		expect(document.body.querySelector('[role="dialog"]')).toBeNull();

		mount(() => (
			<Dialog defaultOpen>
				<DialogContent showCloseButton={false}>
					<DialogFooter showCloseButton />
				</DialogContent>
			</Dialog>
		));
		const close = document.body.querySelector('[role="dialog"] button') as HTMLButtonElement;
		expect(close.textContent).toBe('Close');
		close.click();
		expect(document.body.querySelector('[role="dialog"]')).toBeNull();
	});

	it('多个 Dialog 仅栈顶响应 Escape，滚动锁在最后关闭后恢复', async () => {
		const firstChange = vi.fn();
		const secondChange = vi.fn();
		mount(() => (
			<>
				<Dialog defaultOpen onOpenChange={firstChange}>
					<DialogContent showCloseButton={false}>第一层</DialogContent>
				</Dialog>
				<Dialog defaultOpen onOpenChange={secondChange}>
					<DialogContent showCloseButton={false}>第二层</DialogContent>
				</Dialog>
			</>
		));
		await Promise.resolve();
		const dialogs = document.body.querySelectorAll<HTMLElement>('[role="dialog"]');
		expect(dialogs).toHaveLength(2);
		expect(document.activeElement).toBe(dialogs[1]);
		expect(document.body.style.overflow).toBe('hidden');

		document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
		expect(secondChange).toHaveBeenCalledWith(false);
		expect(firstChange).not.toHaveBeenCalled();
		expect(document.body.querySelectorAll('[role="dialog"]')).toHaveLength(1);
		expect(document.body.style.overflow).toBe('hidden');
		expect(document.activeElement).toBe(dialogs[0]);

		document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
		expect(firstChange).toHaveBeenCalledWith(false);
		expect(document.body.querySelectorAll('[role="dialog"]')).toHaveLength(0);
		expect(document.body.style.overflow).toBe('');
	});

	it('下层 Dialog 先关闭时将外部恢复目标转移给上层', async () => {
		let closeLower!: () => void;
		let closeUpper!: () => void;
		const external = document.createElement('button');
		external.textContent = 'external';
		document.body.appendChild(external);
		external.focus();

		mount(() => {
			const [lowerOpen, setLowerOpen] = createSignal(false);
			const [upperOpen, setUpperOpen] = createSignal(false);
			closeLower = () => setLowerOpen(false);
			closeUpper = () => setUpperOpen(false);
			setLowerOpen(true);
			queueMicrotask(() => setUpperOpen(true));
			return (
				<>
					<Dialog open={lowerOpen()}>
						<DialogContent showCloseButton={false}>下层</DialogContent>
					</Dialog>
					<Dialog open={upperOpen()}>
						<DialogContent showCloseButton={false}>上层</DialogContent>
					</Dialog>
				</>
			);
		});
		await Promise.resolve();
		await Promise.resolve();
		expect(document.body.querySelectorAll('[role="dialog"]')).toHaveLength(2);

		closeLower();
		expect(document.body.querySelectorAll('[role="dialog"]')).toHaveLength(1);
		closeUpper();
		expect(document.body.querySelectorAll('[role="dialog"]')).toHaveLength(0);
		expect(document.activeElement).toBe(external);
	});

	it('焦点陷阱忽略 disabled tabindex 及自身或祖先隐藏的控件', async () => {
		mount(() => (
			<Dialog defaultOpen>
				<DialogContent showCloseButton={false}>
					<button hidden>hidden</button>
					<div inert>
						<button>inert</button>
					</div>
					<button style={{ display: 'none' }}>none</button>
					<button disabled tabIndex={0}>
						disabled
					</button>
					<fieldset disabled>
						<button tabIndex={0}>fieldset disabled</button>
					</fieldset>
					<div style={{ display: 'none' }}>
						<button tabIndex={0}>ancestor display</button>
					</div>
					<div style={{ visibility: 'hidden' }}>
						<button tabIndex={0}>ancestor visibility</button>
					</div>
					<button data-id="visible">visible</button>
				</DialogContent>
			</Dialog>
		));
		await Promise.resolve();
		const dialog = document.body.querySelector('[role="dialog"]') as HTMLElement;
		dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
		expect(document.activeElement).toBe(dialog.querySelector('[data-id="visible"]'));
	});
});
