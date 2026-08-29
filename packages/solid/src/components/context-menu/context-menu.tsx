import { contextMenuStyleKeys, getContextMenuCheckState, getContextMenuPosition, getContextMenuState } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/context-menu.module.scss';
import {
	createMenuFamily,
	type ContextTriggerProps,
	type MenuCheckboxItemProps,
	type MenuContentProps,
	type MenuGroupProps,
	type MenuItemProps,
	type MenuLabelProps,
	type MenuPortalProps,
	type MenuRadioGroupProps,
	type MenuRadioItemProps,
	type MenuRootProps,
	type MenuSeparatorProps,
	type MenuShortcutProps,
	type MenuSubProps,
	type MenuSubTriggerProps,
} from '../dropdown-menu/menu-internals';

const family = createMenuFamily({
	prefix: 'ContextMenu',
	kind: 'context',
	styles,
	keys: contextMenuStyleKeys,
	state: getContextMenuState,
	checkState: getContextMenuCheckState,
	position: ({ triggerRect, contentSize, viewport }) => getContextMenuPosition({ x: triggerRect.left, y: triggerRect.top, contentSize, viewport }),
});

export interface ContextMenuProps extends MenuRootProps {}
export interface ContextMenuPortalProps extends MenuPortalProps {}
export interface ContextMenuTriggerProps extends ContextTriggerProps {}
export interface ContextMenuContentProps extends Omit<MenuContentProps, 'align' | 'alignOffset' | 'side' | 'sideOffset'> {}
export interface ContextMenuGroupProps extends MenuGroupProps {}
export interface ContextMenuLabelProps extends MenuLabelProps {}
export interface ContextMenuSeparatorProps extends MenuSeparatorProps {}
export interface ContextMenuShortcutProps extends MenuShortcutProps {}
export interface ContextMenuItemProps extends MenuItemProps {}
export interface ContextMenuCheckboxItemProps extends MenuCheckboxItemProps {}
export interface ContextMenuRadioGroupProps extends MenuRadioGroupProps {}
export interface ContextMenuRadioItemProps extends MenuRadioItemProps {}
export interface ContextMenuSubProps extends MenuSubProps {}
export interface ContextMenuSubTriggerProps extends MenuSubTriggerProps {}
export interface ContextMenuSubContentProps extends Omit<MenuContentProps, 'align' | 'alignOffset' | 'side' | 'sideOffset'> {}

export function ContextMenu(props: ContextMenuProps) {
	return family.Root(props);
}
export function ContextMenuPortal(props: ContextMenuPortalProps) {
	return family.MenuPortal(props);
}
export function ContextMenuTrigger(props: ContextMenuTriggerProps) {
	return family.ContextTrigger(props);
}
export function ContextMenuContent(props: ContextMenuContentProps) {
	return family.Content(props);
}
export function ContextMenuGroup(props: ContextMenuGroupProps) {
	return family.Group(props);
}
export function ContextMenuLabel(props: ContextMenuLabelProps) {
	return family.Label(props);
}
export function ContextMenuSeparator(props: ContextMenuSeparatorProps) {
	return family.Separator(props);
}
export function ContextMenuShortcut(props: ContextMenuShortcutProps) {
	return family.Shortcut(props);
}
export function ContextMenuItem(props: ContextMenuItemProps) {
	return family.Item(props);
}
export function ContextMenuCheckboxItem(props: ContextMenuCheckboxItemProps) {
	return family.CheckboxItem(props);
}
export function ContextMenuRadioGroup(props: ContextMenuRadioGroupProps) {
	return family.RadioGroup(props);
}
export function ContextMenuRadioItem(props: ContextMenuRadioItemProps) {
	return family.RadioItem(props);
}
export function ContextMenuSub(props: ContextMenuSubProps) {
	return family.Sub(props);
}
export function ContextMenuSubTrigger(props: ContextMenuSubTriggerProps) {
	return family.SubTrigger(props);
}
export function ContextMenuSubContent(props: ContextMenuSubContentProps) {
	return family.SubContent(props);
}

export default ContextMenu;
