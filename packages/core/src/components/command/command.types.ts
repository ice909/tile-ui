/**
 * Command 单项配置 (供命令式数据驱动使用)
 */
export interface CommandItemDef {
	/** 唯一值 */
	value: string;
	/** 展示文本 */
	label?: string;
	/** 搜索关键字 */
	keywords?: string[];
	/** 是否禁用 */
	disabled?: boolean;
	/** 所属分组 */
	group?: string;
	/** 快捷键文本 */
	shortcut?: string;
}

/**
 * 命令分组定义
 */
export interface CommandGroupDef {
	/** 分组值 */
	value: string;
	/** 分组标题 */
	label?: string;
	/** 该分组下的项 */
	items: CommandItemDef[];
}

/**
 * Command 过滤结果
 */
export interface CommandFilterResult {
	/** 命中分组 */
	groups: CommandGroupDef[];
	/** 全部命中项 (扁平) */
	items: CommandItemDef[];
	/** 是否为空 */
	empty: boolean;
}

/**
 * 自定义过滤函数签名 (与 cmdk 类似)
 */
export type CommandFilterFn = (value: string, search: string, keywords?: string[]) => boolean;

/**
 * Command 基础 Props (框架无关部分)
 */
export interface CommandBaseProps {
	/** 候选项 */
	items?: CommandItemDef[];
	/** 分组 */
	groups?: CommandGroupDef[];
	/** 自定义过滤函数 */
	filter?: CommandFilterFn;
	/** 是否循环导航 */
	loop?: boolean;
}
