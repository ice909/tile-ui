import type {
	FormErrors,
	FormFieldArrayItem,
	FormFieldError,
	FormFieldIds,
	FormFieldState,
	FormFormState,
	FormRegisterOptions,
	FormRegistration,
	FormResetOptions,
	FormSetErrorOptions,
	FormSetValueOptions,
	FormSnapshot,
	FormSubmitHandler,
	FormValues,
} from './form.types';
import { generateId } from '../../utils/helpers';

/**
 * Form 组件样式类名键
 */
export const formStyleKeys = {
	item: 'item',
	label: 'label',
	control: 'control',
	description: 'description',
	message: 'message',
} as const;

/**
 * 默认表单 ID 前缀
 */
export const FORM_DEFAULT_ID = 'tile-form';

/**
 * 根据表单项根 ID 生成相关的辅助 ID
 */
export function getFormFieldIds(id: string = FORM_DEFAULT_ID): FormFieldIds {
	return {
		id,
		formItemId: `${id}-form-item`,
		formDescriptionId: `${id}-form-item-description`,
		formMessageId: `${id}-form-item-message`,
	};
}

/**
 * 按点路径读取值 (支持嵌套)
 */
export function getInValue(values: FormValues, path: string): unknown {
	if (!path) {
		return undefined;
	}

	let current: unknown = values;
	for (const segment of path.split('.')) {
		if (current === null || current === undefined) {
			return undefined;
		}
		current = (current as Record<string, unknown>)[segment];
	}
	return current;
}

/**
 * 按点路径写入值 (返回新对象)
 */
export function setInValue(values: FormValues, path: string, value: unknown): FormValues {
	const segments = path.split('.');
	const isIndex = (segment: string) => /^\d+$/.test(segment);
	const update = (current: unknown, index: number): unknown => {
		if (index === segments.length) return value;
		const segment = segments[index];
		const container = Array.isArray(current)
			? [...current]
			: current !== null && typeof current === 'object'
				? { ...(current as Record<string, unknown>) }
				: isIndex(segment)
					? []
					: {};
		const child = (container as Record<string, unknown>)[segment];
		(container as Record<string, unknown>)[segment] = update(child, index + 1);
		return container;
	};

	return update(values, 0) as FormValues;
}

/**
 * 数组字段追加元素 (纯函数，返回新值集合)
 */
export function appendToFieldArray(values: FormValues, path: string, item: unknown): FormValues {
	const current = getInValue(values, path);
	const array = Array.isArray(current) ? current : [];
	return setInValue(values, path, [...array, item]);
}

/**
 * 数组字段头部插入元素 (纯函数)
 */
export function prependToFieldArray(values: FormValues, path: string, item: unknown): FormValues {
	const current = getInValue(values, path);
	const array = Array.isArray(current) ? current : [];
	return setInValue(values, path, [item, ...array]);
}

/**
 * 数组字段移除元素 (纯函数)
 */
export function removeFromFieldArray(values: FormValues, path: string, index: number): FormValues {
	const current = getInValue(values, path);
	const array = Array.isArray(current) ? current : [];
	return setInValue(
		values,
		path,
		array.filter((_item, itemIndex) => itemIndex !== index),
	);
}

/**
 * 数组字段插入元素 (纯函数)
 */
export function insertIntoFieldArray(values: FormValues, path: string, index: number, item: unknown): FormValues {
	const current = getInValue(values, path);
	const array = Array.isArray(current) ? current : [];
	const next = [...array];
	next.splice(index, 0, item);
	return setInValue(values, path, next);
}

/**
 * 数组字段交换元素 (纯函数)
 */
export function swapFieldArrayItems(values: FormValues, path: string, from: number, to: number): FormValues {
	const current = getInValue(values, path);
	const array = Array.isArray(current) ? current : [];
	if (from === to || from < 0 || to < 0 || from >= array.length || to >= array.length) {
		return values;
	}
	const next = [...array];
	[next[from], next[to]] = [next[to], next[from]];
	return setInValue(values, path, next);
}

/**
 * 数组字段移动元素 (纯函数)
 */
export function moveInFieldArray(values: FormValues, path: string, from: number, to: number): FormValues {
	const current = getInValue(values, path);
	const array = Array.isArray(current) ? current : [];
	if (from === to || from < 0 || to < 0 || from >= array.length || to >= array.length) {
		return values;
	}
	const next = [...array];
	const [item] = next.splice(from, 1);
	next.splice(to, 0, item);
	return setInValue(values, path, next);
}

/**
 * 数组字段更新元素 (纯函数)
 */
export function updateInFieldArray(values: FormValues, path: string, index: number, item: unknown): FormValues {
	const current = getInValue(values, path);
	const array = Array.isArray(current) ? current : [];
	if (index < 0 || index >= array.length) {
		return values;
	}
	const next = [...array];
	next[index] = item;
	return setInValue(values, path, next);
}

/**
 * 数组字段整体替换 (纯函数)
 */
export function replaceFieldArray(values: FormValues, path: string, items: unknown[]): FormValues {
	return setInValue(values, path, Array.isArray(items) ? [...items] : []);
}

/**
 * 将输入归一化为提交值 (支持事件对象/原始值/数字转换)
 */
export function normalizeFormValue(value: unknown, valueAsNumber: boolean = false): unknown {
	if (value !== null && typeof value === 'object' && 'target' in value) {
		const target = (value as { target: { value: unknown } }).target;
		value = target.value;
	}
	if (valueAsNumber) {
		return typeof value === 'number' ? value : Number(value);
	}
	return value;
}

/**
 * 校验单个字段，返回错误 (支持同步与异步校验)
 */
export async function validateFormField(fieldName: string, value: unknown, allValues: FormValues, options?: FormRegisterOptions): Promise<FormFieldError | undefined> {
	if (!options) {
		return undefined;
	}

	const { required, pattern, minLength, maxLength, min, max, validate } = options;

	if (required) {
		const isEmpty = value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);
		if (isEmpty) {
			return { type: 'required', message: typeof required === 'string' ? required : undefined };
		}
	}

	if (pattern && typeof value === 'string' && !pattern.value.test(value)) {
		return { type: 'pattern', message: pattern.message };
	}

	if (typeof value === 'string') {
		if (minLength !== undefined && value.length < minLength.value) {
			return { type: 'minLength', message: minLength.message };
		}
		if (maxLength !== undefined && value.length > maxLength.value) {
			return { type: 'maxLength', message: maxLength.message };
		}
	}

	if (typeof value === 'number') {
		if (min !== undefined && value < min.value) {
			return { type: 'min', message: min.message };
		}
		if (max !== undefined && value > max.value) {
			return { type: 'max', message: max.message };
		}
	}

	if (validate) {
		if (typeof validate === 'function') {
			const result = await validate(value, allValues);
			if (typeof result === 'string' && result) {
				return { type: 'validate', message: result };
			}
			if (result === false) {
				return { type: 'validate', message: 'Validation failed' };
			}
		} else {
			for (const ruleKey of Object.keys(validate)) {
				const result = await validate[ruleKey](value, allValues);
				if (typeof result === 'string' && result) {
					return { type: ruleKey, message: result };
				}
				if (result === false) {
					return { type: ruleKey, message: 'Validation failed' };
				}
			}
		}
	}

	return undefined;
}

/**
 * 将原始数组转换为带稳定 id 的字段数组条目
 */
export function toFieldArrayItems(array: unknown[], ids: string[]): FormFieldArrayItem[] {
	return array.map((item, index) => {
		const id = ids[index];
		if (item !== null && typeof item === 'object' && !Array.isArray(item)) {
			return { ...(item as Record<string, unknown>), id };
		}
		return { id, value: item };
	});
}

/**
 * 字段路径解析器 (供 useForm 内部使用)
 */
export type FormPathResolver = (name: string) => string;

function cloneFormValue<T>(value: T): T {
	if (Array.isArray(value)) {
		return value.map((item) => cloneFormValue(item)) as T;
	}
	if (value instanceof Date) {
		return new Date(value.getTime()) as T;
	}
	if (value instanceof RegExp) {
		return new RegExp(value.source, value.flags) as T;
	}
	if (value !== null && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
		return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, cloneFormValue(item)])) as T;
	}
	return value;
}

interface FormRegistrationEntry {
	id: number;
	path: string;
	options: FormRegisterOptions;
}

/**
 * 最小化表单状态引擎 (纯逻辑 + 订阅模型，供两个框架复用)
 */
export class FormStore {
	private readonly defaultValues: FormValues;
	private values: FormValues;
	private errors: FormErrors = {};
	private touched: Record<string, boolean> = {};
	private dirty: Record<string, boolean> = {};
	private rules: Record<string, FormRegisterOptions> = {};
	private registrations = new Map<string, FormRegistrationEntry[]>();
	private depsMap: Record<string, string[]> = {};
	private arrayIds = new Map<string, string[]>();
	private isSubmitting = false;
	private isSubmitted = false;
	private submitCount = 0;
	private activeSubmissions = 0;
	private validationEpoch = 0;
	private wholeValidationGeneration = 0;
	private fieldValidationGenerations = new Map<string, number>();
	private registrationId = 0;
	private version = 0;
	private snapshotVersion = -1;
	private snapshotCache: FormSnapshot | null = null;
	private listeners = new Set<() => void>();
	private fieldListeners = new Map<string, Set<() => void>>();
	private resolver?: (values: FormValues) => FormErrors | Promise<FormErrors>;
	private resolvePath: FormPathResolver;

	constructor(defaultValues: FormValues = {}, resolver?: (values: FormValues) => FormErrors | Promise<FormErrors>, resolvePath: FormPathResolver = (name) => name) {
		this.defaultValues = cloneFormValue(defaultValues);
		this.values = cloneFormValue(this.defaultValues);
		this.resolver = resolver;
		this.resolvePath = resolvePath;
	}

	/** 订阅全局变化 */
	subscribe(listener: () => void): () => void {
		this.listeners.add(listener);
		return () => {
			this.listeners.delete(listener);
		};
	}

	/** 订阅指定字段变化 */
	subscribeField(name: string, listener: () => void): () => void {
		const path = this.resolvePath(name);
		let set = this.fieldListeners.get(path);
		if (!set) {
			set = new Set();
			this.fieldListeners.set(path, set);
		}
		set.add(listener);
		return () => {
			set?.delete(listener);
		};
	}

	/** 获取表单快照 (内部缓存，仅版本变更时重建) */
	getSnapshot(): FormSnapshot {
		if (this.version !== this.snapshotVersion) {
			this.snapshotCache = {
				values: this.values,
				errors: this.errors,
				touched: this.touched,
				dirty: this.dirty,
				isSubmitting: this.isSubmitting,
				isSubmitted: this.isSubmitted,
				submitCount: this.submitCount,
				version: this.version,
			};
			this.snapshotVersion = this.version;
		}
		return this.snapshotCache as FormSnapshot;
	}

	/** 获取 formState 派生状态 */
	getFormState(): FormFormState {
		return {
			errors: this.errors,
			touched: this.touched,
			dirty: this.dirty,
			isSubmitting: this.isSubmitting,
			isSubmitted: this.isSubmitted,
			isDirty: this.isDirty(),
			isValid: this.isValid(),
			submitCount: this.submitCount,
		};
	}

	/** 是否包含已修改字段 */
	isDirty(): boolean {
		return Object.values(this.dirty).some(Boolean);
	}

	/** 是否有错误 */
	isValid(): boolean {
		return Object.keys(this.errors).length === 0;
	}

	/** 获取全部值或指定字段值 */
	getValues(name?: string): FormValues | unknown {
		return name === undefined ? this.values : getInValue(this.values, this.resolvePath(name));
	}

	/** 获取指定字段值 */
	getValue(name: string): unknown {
		return getInValue(this.values, this.resolvePath(name));
	}

	/** 监听字段或整个表单 (返回当前值快照) */
	watch(name?: string): FormValues | unknown {
		return name === undefined ? { ...this.values } : getInValue(this.values, this.resolvePath(name));
	}

	/** 设置字段值 */
	setValue(name: string, value: unknown, options: FormSetValueOptions = {}): void {
		const path = this.resolvePath(name);
		this.invalidateValidation();
		this.values = setInValue(this.values, path, value);

		if (options.shouldDirty) {
			this.dirty[path] = true;
		}
		if (options.shouldTouch) {
			this.touched[path] = true;
		}

		const dependents = this.depsMap[path] ?? [];
		for (const dependent of dependents) {
			void this.validateField(dependent);
		}

		if (options.shouldValidate) {
			void this.validateField(path);
		}

		this.notify(path);
	}

	/** 获取字段状态 */
	getFieldState(name: string): FormFieldState {
		const path = this.resolvePath(name);
		return {
			error: this.errors[path],
			isTouched: !!this.touched[path],
			isDirty: !!this.dirty[path],
			value: getInValue(this.values, path),
		};
	}

	/** 注册字段 */
	registerField(name: string, options: FormRegisterOptions = {}): FormRegistration {
		const path = this.resolvePath(name);
		const entry = { id: ++this.registrationId, path, options: cloneFormValue(options) };
		const entries = this.registrations.get(path) ?? [];
		entries.push(entry);
		this.registrations.set(path, entries);
		this.fieldValidationGenerations.set(path, (this.fieldValidationGenerations.get(path) ?? 0) + 1);
		this.invalidateValidation();
		this.rebuildRegistrationState();
		let active = true;
		const unregister = () => {
			if (!active) return;
			active = false;
			this.removeRegistration(entry.path, entry.id);
		};

		return {
			name,
			ref: name,
			unregister,
			onChange: (value: unknown) => {
				this.setValue(entry.path, normalizeFormValue(value, entry.options.valueAsNumber));
			},
			onBlur: () => {
				this.blurField(entry.path);
			},
		};
	}

	/** 注销字段 */
	unregisterField(name: string): void {
		const path = this.resolvePath(name);
		const entries = this.registrations.get(path);
		const entry = entries?.at(-1);
		if (entry) this.removeRegistration(path, entry.id);
	}

	/** 标记字段已触碰 */
	blurField(name: string): void {
		const path = this.resolvePath(name);
		this.touched[path] = true;
		this.notify(path);
	}

	/** 校验单个字段 */
	async validateField(name: string): Promise<FormFieldError | undefined> {
		const path = this.resolvePath(name);
		const generation = (this.fieldValidationGenerations.get(path) ?? 0) + 1;
		this.fieldValidationGenerations.set(path, generation);
		this.wholeValidationGeneration += 1;
		const epoch = this.validationEpoch;
		const value = getInValue(this.values, path);
		const values = cloneFormValue(this.values);
		const error = await validateFormField(path, value, values, this.rules[path]);

		if (epoch === this.validationEpoch && generation === this.fieldValidationGenerations.get(path)) {
			if (error) {
				this.errors[path] = error;
			} else {
				delete this.errors[path];
			}
			this.notify(path);
		}
		return error;
	}

	/** 校验全部已注册字段 */
	async validateFields(): Promise<FormErrors> {
		return (await this.runWholeValidation()).errors;
	}

	private async runWholeValidation(): Promise<{ errors: FormErrors; values: FormValues; current: boolean }> {
		const generation = ++this.wholeValidationGeneration;
		const epoch = this.validationEpoch;
		for (const path of this.registrations.keys()) {
			this.fieldValidationGenerations.set(path, (this.fieldValidationGenerations.get(path) ?? 0) + 1);
		}
		const values = cloneFormValue(this.values);
		const rules = { ...this.rules };
		const paths = [...this.registrations.keys()];
		const errors: FormErrors = {};
		for (const path of paths) {
			const value = getInValue(values, path);
			const error = await validateFormField(path, value, values, rules[path]);
			if (error) {
				errors[path] = error;
			}
		}

		if (this.resolver) {
			const resolvedErrors = await this.resolver(values);
			Object.assign(errors, resolvedErrors);
		}

		const current = epoch === this.validationEpoch && generation === this.wholeValidationGeneration;
		if (current) {
			this.errors = errors;
			this.notify();
		}
		return { errors, values, current };
	}

	/** 触发校验 (缺省校验全部，返回是否通过) */
	async trigger(name?: string): Promise<boolean> {
		if (name) {
			const error = await this.validateField(name);
			return !error;
		}
		const errors = await this.validateFields();
		return Object.keys(errors).length === 0;
	}

	/** 手动设置错误 */
	setError(name: string, error: string | FormFieldError, _options?: FormSetErrorOptions): void {
		const path = this.resolvePath(name);
		this.invalidateValidation();
		this.errors[path] = typeof error === 'string' ? { type: 'manual', message: error } : error;
		this.notify(path);
	}

	/** 清除错误 (缺省清除全部) */
	clearErrors(name?: string): void {
		this.invalidateValidation();
		if (name) {
			delete this.errors[this.resolvePath(name)];
		} else {
			this.errors = {};
		}
		this.notify();
	}

	/** 重置表单 */
	reset(nextValues?: FormValues, options: FormResetOptions = {}): void {
		this.invalidateValidation();
		if (!options.keepValues) {
			this.values = cloneFormValue(nextValues ?? this.defaultValues);
			this.arrayIds.clear();
		} else if (nextValues) {
			this.values = { ...this.values, ...cloneFormValue(nextValues) };
		}
		if (!options.keepErrors) {
			this.errors = {};
		}
		if (!options.keepDirty) {
			this.dirty = {};
		}
		if (!options.keepTouched) {
			this.touched = {};
		}
		if (!options.keepIsSubmitted) {
			this.isSubmitted = false;
		}
		if (!options.keepSubmitCount) {
			this.submitCount = 0;
		}
		this.isSubmitting = this.activeSubmissions > 0;
		this.notify();
	}

	/** 创建提交处理器 */
	createSubmitHandler(onValid: FormSubmitHandler['onValid'], onInvalid?: FormSubmitHandler['onInvalid']): (event?: unknown) => Promise<void> {
		return async (event?: unknown) => {
			const preventDefault = (event as { preventDefault?: () => void } | undefined)?.preventDefault;
			if (typeof preventDefault === 'function') {
				preventDefault.call(event);
			}

			this.submitCount += 1;
			this.isSubmitted = true;
			this.activeSubmissions += 1;
			this.isSubmitting = true;
			this.notify();

			try {
				// 每次提交都消费自己的值与错误快照；仅最新且未失效的校验会发布到全局 errors。
				const result = await this.runWholeValidation();
				if (Object.keys(result.errors).length === 0) {
					await onValid(result.values, event);
				} else {
					await onInvalid?.(result.errors, event);
				}
			} finally {
				this.activeSubmissions -= 1;
				this.isSubmitting = this.activeSubmissions > 0;
				this.notify();
			}
		};
	}

	private invalidateValidation(): void {
		this.validationEpoch += 1;
		this.wholeValidationGeneration += 1;
	}

	private rebuildRegistrationState(): void {
		this.rules = {};
		this.depsMap = {};
		for (const [path, entries] of this.registrations) {
			const merged: FormRegisterOptions = {};
			const deps = new Set<string>();
			for (const entry of entries) {
				for (const [key, value] of Object.entries(entry.options)) {
					if (key !== 'deps' && value !== undefined) (merged as Record<string, unknown>)[key] = value;
				}
				for (const dep of entry.options.deps ?? []) deps.add(dep);
			}
			if (deps.size > 0) merged.deps = [...deps];
			this.rules[path] = merged;
			for (const dep of deps) {
				const depPath = this.resolvePath(dep);
				const dependents = this.depsMap[depPath] ?? [];
				if (!dependents.includes(path)) dependents.push(path);
				this.depsMap[depPath] = dependents;
			}
		}
	}

	private removeRegistration(path: string, id: number): void {
		const entries = this.registrations.get(path);
		if (!entries) return;
		const next = entries.filter((entry) => entry.id !== id);
		if (next.length > 0) {
			this.registrations.set(path, next);
		} else {
			this.registrations.delete(path);
			delete this.errors[path];
			delete this.touched[path];
			delete this.dirty[path];
		}
		this.fieldValidationGenerations.set(path, (this.fieldValidationGenerations.get(path) ?? 0) + 1);
		this.invalidateValidation();
		this.rebuildRegistrationState();
		this.notify(path);
	}

	/** 读取数组字段 (路径 + 原始数组) */
	private readArray(name: string): { path: string; array: unknown[] } {
		const path = this.resolvePath(name);
		const raw = getInValue(this.values, path);
		return { path, array: Array.isArray(raw) ? raw : [] };
	}

	/** 写入数组字段并通知 */
	private setFieldArray(path: string, next: unknown[], nextIds: string[]): void {
		this.invalidateValidation();
		this.values = setInValue(this.values, path, next);
		this.arrayIds.set(path, nextIds);
		this.notify(path);
	}

	private getFieldArrayIds(path: string, length: number): string[] {
		let ids = this.arrayIds.get(path);
		if (!ids) {
			ids = [];
			this.arrayIds.set(path, ids);
		}
		while (ids.length < length) ids.push(generateId('field'));
		if (ids.length > length) ids.length = length;
		return ids;
	}

	private rebaseFieldArrayDescendants(path: string, mapIndex: (index: number) => number | undefined): void {
		const rebasePath = (candidate: string): string | undefined => {
			const prefix = `${path}.`;
			if (!candidate.startsWith(prefix)) return candidate;
			const remainder = candidate.slice(prefix.length);
			const separator = remainder.indexOf('.');
			const indexSegment = separator === -1 ? remainder : remainder.slice(0, separator);
			if (!/^\d+$/.test(indexSegment)) return candidate;
			const nextIndex = mapIndex(Number(indexSegment));
			if (nextIndex === undefined) return undefined;
			return `${prefix}${nextIndex}${separator === -1 ? '' : remainder.slice(separator)}`;
		};
		const rebaseRecord = <T>(record: Record<string, T>): Record<string, T> => {
			const next: Record<string, T> = {};
			for (const [key, value] of Object.entries(record)) {
				const rebased = rebasePath(key);
				if (rebased !== undefined) next[rebased] = value;
			}
			return next;
		};
		const rebaseMap = <T>(source: Map<string, T>): Map<string, T> => {
			const next = new Map<string, T>();
			for (const [key, value] of source) {
				const rebased = rebasePath(key);
				if (rebased !== undefined) next.set(rebased, value);
			}
			return next;
		};

		const registrations = new Map<string, FormRegistrationEntry[]>();
		for (const [key, entries] of this.registrations) {
			const rebased = rebasePath(key);
			if (rebased === undefined) {
				for (const entry of entries) entry.path = `\0removed:${entry.id}`;
				continue;
			}
			for (const entry of entries) {
				entry.path = rebased;
				if (entry.options.deps) entry.options.deps = entry.options.deps.map(rebasePath).filter((dep): dep is string => dep !== undefined);
			}
			registrations.set(rebased, entries);
		}
		this.registrations = registrations;
		this.errors = rebaseRecord(this.errors);
		this.touched = rebaseRecord(this.touched);
		this.dirty = rebaseRecord(this.dirty);
		this.arrayIds = rebaseMap(this.arrayIds);
		this.fieldValidationGenerations = rebaseMap(this.fieldValidationGenerations);
		this.fieldListeners = rebaseMap(this.fieldListeners);
		this.rebuildRegistrationState();
	}

	/** 获取数组字段条目 (带稳定 id) */
	getFieldArray(name: string): FormFieldArrayItem[] {
		const { path, array } = this.readArray(name);
		const ids = this.getFieldArrayIds(path, array.length);
		return toFieldArrayItems(array, ids);
	}

	/** 数组字段追加元素 */
	append(name: string, item: unknown): void {
		const { path, array } = this.readArray(name);
		const ids = [...this.getFieldArrayIds(path, array.length), generateId('field')];
		this.setFieldArray(path, [...array, item], ids);
	}

	/** 数组字段头部插入元素 */
	prepend(name: string, item: unknown): void {
		const { path, array } = this.readArray(name);
		const ids = [generateId('field'), ...this.getFieldArrayIds(path, array.length)];
		this.rebaseFieldArrayDescendants(path, (index) => index + 1);
		this.setFieldArray(path, [item, ...array], ids);
	}

	/** 数组字段插入元素 */
	insert(name: string, index: number, item: unknown): void {
		const { path, array } = this.readArray(name);
		const next = [...array];
		const ids = [...this.getFieldArrayIds(path, array.length)];
		next.splice(index, 0, item);
		ids.splice(index, 0, generateId('field'));
		this.rebaseFieldArrayDescendants(path, (current) => (current >= index ? current + 1 : current));
		this.setFieldArray(path, next, ids);
	}

	/** 数组字段移除元素 */
	remove(name: string, index: number): void {
		const { path, array } = this.readArray(name);
		const ids = this.getFieldArrayIds(path, array.length).filter((_id, itemIndex) => itemIndex !== index);
		this.rebaseFieldArrayDescendants(path, (current) => (current === index ? undefined : current > index ? current - 1 : current));
		this.setFieldArray(
			path,
			array.filter((_item, itemIndex) => itemIndex !== index),
			ids,
		);
	}

	/** 数组字段交换元素 */
	swap(name: string, from: number, to: number): void {
		const { path, array } = this.readArray(name);
		if (from === to || from < 0 || to < 0 || from >= array.length || to >= array.length) {
			return;
		}
		const next = [...array];
		const ids = [...this.getFieldArrayIds(path, array.length)];
		[next[from], next[to]] = [next[to], next[from]];
		[ids[from], ids[to]] = [ids[to], ids[from]];
		this.rebaseFieldArrayDescendants(path, (index) => (index === from ? to : index === to ? from : index));
		this.setFieldArray(path, next, ids);
	}

	/** 数组字段移动元素 */
	move(name: string, from: number, to: number): void {
		const { path, array } = this.readArray(name);
		if (from === to || from < 0 || to < 0 || from >= array.length || to >= array.length) return;
		const next = [...array];
		const ids = [...this.getFieldArrayIds(path, array.length)];
		const [item] = next.splice(from, 1);
		const [id] = ids.splice(from, 1);
		next.splice(to, 0, item);
		ids.splice(to, 0, id);
		this.rebaseFieldArrayDescendants(path, (index) => {
			if (index === from) return to;
			if (from < to && index > from && index <= to) return index - 1;
			if (from > to && index >= to && index < from) return index + 1;
			return index;
		});
		this.setFieldArray(path, next, ids);
	}

	/** 数组字段更新元素 */
	update(name: string, index: number, item: unknown): void {
		const { path, array } = this.readArray(name);
		if (index < 0 || index >= array.length) {
			return;
		}
		const next = [...array];
		const ids = [...this.getFieldArrayIds(path, array.length)];
		next[index] = item;
		ids[index] = generateId('field');
		this.rebaseFieldArrayDescendants(path, (current) => (current === index ? undefined : current));
		this.setFieldArray(path, next, ids);
	}

	/** 数组字段整体替换 */
	replace(name: string, items: unknown[]): void {
		const path = this.resolvePath(name);
		const next = Array.isArray(items) ? [...items] : [];
		this.rebaseFieldArrayDescendants(path, () => undefined);
		this.setFieldArray(
			path,
			next,
			next.map(() => generateId('field')),
		);
	}

	/** 触发通知 */
	private notify(path?: string): void {
		this.version += 1;
		this.listeners.forEach((listener) => listener());
		if (path) {
			this.fieldListeners.get(path)?.forEach((listener) => listener());
		}
	}
}

/**
 * 创建表单存储实例 (供框架 useForm 包装)
 */
export function createFormStore(
	defaultValues: FormValues = {},
	resolver?: (values: FormValues) => FormErrors | Promise<FormErrors>,
	resolvePath: FormPathResolver = (name) => name,
): FormStore {
	return new FormStore(defaultValues, resolver, resolvePath);
}
