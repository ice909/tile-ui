import { getMenubarCheckState, getMenubarPosition, getMenubarState, menubarStyleKeys } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/menubar.module.scss';
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
	type MenuSeparatorProps,
	type MenuShortcutProps,
	type MenuSubProps,
	type MenuSubTriggerProps,
	type MenuTriggerProps,
	type MenubarMenuProps as InternalMenubarMenuProps,
	type MenubarRootProps,
} from '../dropdown-menu/menu-internals';

const family = createMenuFamily({
	prefix: 'Menubar',
	kind: 'menubar',
	styles,
	keys: menubarStyleKeys,
	state: getMenubarState,
	checkState: getMenubarCheckState,
	position: getMenubarPosition,
});

export interface MenubarProps extends MenubarRootProps {}
export interface MenubarPortalProps extends MenuPortalProps {}
export interface MenubarMenuProps extends InternalMenubarMenuProps {}
export interface MenubarTriggerProps extends MenuTriggerProps {
	disabled?: boolean;
}
export interface MenubarContentProps extends MenuContentProps {}
export interface MenubarGroupProps extends MenuGroupProps {}
export interface MenubarLabelProps extends MenuLabelProps {}
export interface MenubarSeparatorProps extends MenuSeparatorProps {}
export interface MenubarShortcutProps extends MenuShortcutProps {}
export interface MenubarItemProps extends MenuItemProps {}
export interface MenubarCheckboxItemProps extends MenuCheckboxItemProps {}
export interface MenubarRadioGroupProps extends MenuRadioGroupProps {}
export interface MenubarRadioItemProps extends MenuRadioItemProps {}
export interface MenubarSubProps extends MenuSubProps {}
export interface MenubarSubTriggerProps extends MenuSubTriggerProps {}
export interface MenubarSubContentProps extends MenuContentProps {}

export function Menubar(props: MenubarProps) {
	return family.MenubarRoot(props);
}
export function MenubarPortal(props: MenubarPortalProps) {
	return family.MenuPortal(props);
}
export function MenubarMenu(props: MenubarMenuProps) {
	return family.MenubarMenu(props);
}
export function MenubarTrigger(props: MenubarTriggerProps) {
	return family.MenubarTrigger(props);
}
export function MenubarContent(props: MenubarContentProps) {
	return family.Content(props);
}
export function MenubarGroup(props: MenubarGroupProps) {
	return family.Group(props);
}
export function MenubarLabel(props: MenubarLabelProps) {
	return family.Label(props);
}
export function MenubarSeparator(props: MenubarSeparatorProps) {
	return family.Separator(props);
}
export function MenubarShortcut(props: MenubarShortcutProps) {
	return family.Shortcut(props);
}
export function MenubarItem(props: MenubarItemProps) {
	return family.Item(props);
}
export function MenubarCheckboxItem(props: MenubarCheckboxItemProps) {
	return family.CheckboxItem(props);
}
export function MenubarRadioGroup(props: MenubarRadioGroupProps) {
	return family.RadioGroup(props);
}
export function MenubarRadioItem(props: MenubarRadioItemProps) {
	return family.RadioItem(props);
}
export function MenubarSub(props: MenubarSubProps) {
	return family.Sub(props);
}
export function MenubarSubTrigger(props: MenubarSubTriggerProps) {
	return family.SubTrigger(props);
}
export function MenubarSubContent(props: MenubarSubContentProps) {
	return family.SubContent(props);
}

export default Menubar;
