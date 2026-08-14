/**
 * Combobox 单项配置
 */
export interface ComboboxItem {
	/** 唯一值 */
	value: string;
	/** 展示文本 */
	label: string;
	/** 是否禁用 */
	disabled?: boolean;
	/** 额外搜索关键字 */
	keywords?: string[];
}

/**
 * Combobox 过滤结果
 */
export interface ComboboxFilterResult {
	/** 匹配项 (受 maxItems 限制) */
	items: ComboboxItem[];
	/** 匹配总数 (不含 maxItems 截断) */
	total: number;
}

/**
 * Combobox 基础 Props (框架无关部分)
 */
export interface ComboboxBaseProps {
	/** 全部候选项 */
	items: ComboboxItem[];
	/** 选中值 */
	value?: string;
	/** 选中值变化回调 */
	onValueChange?: (value: string) => void;
	/** 触发器占位文本 */
	placeholder?: string;
	/** 搜索框占位文本 */
	searchPlaceholder?: string;
	/** 无任何候选项时显示的文本 */
	emptyText?: string;
	/** 搜索无匹配时显示的文本 */
	notFoundText?: string;
	/** 下拉列表最大展示条数 */
	maxItems?: number;
	/** 是否禁用 */
	disabled?: boolean;
	/** 自定义匹配函数 */
	filter?: (item: ComboboxItem, query: string) => boolean;
}
