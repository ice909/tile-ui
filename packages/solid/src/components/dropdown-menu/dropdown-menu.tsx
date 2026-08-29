import { dropdownMenuStyleKeys, getDropdownMenuCheckState, getDropdownMenuPosition, getDropdownMenuState } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/dropdown-menu.module.scss';
import {
	createMenuFamily,
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
	type MenuTriggerProps,
} from './menu-internals';

const family = createMenuFamily({
	prefix: 'DropdownMenu',
	kind: 'dropdown',
	styles,
	keys: dropdownMenuStyleKeys,
	state: getDropdownMenuState,
	checkState: getDropdownMenuCheckState,
	position: getDropdownMenuPosition,
});

export interface DropdownMenuProps extends MenuRootProps {}
export interface DropdownMenuPortalProps extends MenuPortalProps {}
export interface DropdownMenuTriggerProps extends MenuTriggerProps {}
export interface DropdownMenuContentProps extends MenuContentProps {}
export interface DropdownMenuGroupProps extends MenuGroupProps {}
export interface DropdownMenuLabelProps extends MenuLabelProps {}
export interface DropdownMenuSeparatorProps extends MenuSeparatorProps {}
export interface DropdownMenuShortcutProps extends MenuShortcutProps {}
export interface DropdownMenuItemProps extends MenuItemProps {}
export interface DropdownMenuCheckboxItemProps extends MenuCheckboxItemProps {}
export interface DropdownMenuRadioGroupProps extends MenuRadioGroupProps {}
export interface DropdownMenuRadioItemProps extends MenuRadioItemProps {}
export interface DropdownMenuSubProps extends MenuSubProps {}
export interface DropdownMenuSubTriggerProps extends MenuSubTriggerProps {}
export interface DropdownMenuSubContentProps extends MenuContentProps {}

export function DropdownMenu(props: DropdownMenuProps) {
	return family.Root(props);
}
export function DropdownMenuPortal(props: DropdownMenuPortalProps) {
	return family.MenuPortal(props);
}
export function DropdownMenuTrigger(props: DropdownMenuTriggerProps) {
	return family.Trigger(props);
}
export function DropdownMenuContent(props: DropdownMenuContentProps) {
	return family.Content(props);
}
export function DropdownMenuGroup(props: DropdownMenuGroupProps) {
	return family.Group(props);
}
export function DropdownMenuLabel(props: DropdownMenuLabelProps) {
	return family.Label(props);
}
export function DropdownMenuSeparator(props: DropdownMenuSeparatorProps) {
	return family.Separator(props);
}
export function DropdownMenuShortcut(props: DropdownMenuShortcutProps) {
	return family.Shortcut(props);
}
export function DropdownMenuItem(props: DropdownMenuItemProps) {
	return family.Item(props);
}
export function DropdownMenuCheckboxItem(props: DropdownMenuCheckboxItemProps) {
	return family.CheckboxItem(props);
}
export function DropdownMenuRadioGroup(props: DropdownMenuRadioGroupProps) {
	return family.RadioGroup(props);
}
export function DropdownMenuRadioItem(props: DropdownMenuRadioItemProps) {
	return family.RadioItem(props);
}
export function DropdownMenuSub(props: DropdownMenuSubProps) {
	return family.Sub(props);
}
export function DropdownMenuSubTrigger(props: DropdownMenuSubTriggerProps) {
	return family.SubTrigger(props);
}
export function DropdownMenuSubContent(props: DropdownMenuSubContentProps) {
	return family.SubContent(props);
}

export default DropdownMenu;
