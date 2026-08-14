import React, { createContext, useContext, useId } from 'react';
import { fieldStyleKeys, getFieldIds, getFieldMessageStyleKeys } from '@tile-ui/core';
import type { FieldBaseProps, FieldDescriptionBaseProps, FieldLabelBaseProps, FieldMessageBaseProps } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/field.module.scss';

interface FieldContextValue {
	id: string;
	labelId: string;
	descriptionId: string;
	messageId: string;
	invalid: boolean;
	required: boolean;
}

const FieldContext = createContext<FieldContextValue | null>(null);

function useFieldContext(): FieldContextValue {
	const context = useContext(FieldContext);
	if (!context) {
		throw new Error('Field sub-components must be used within <Field>.');
	}
	return context;
}

export interface FieldProps extends React.HTMLAttributes<HTMLDivElement>, FieldBaseProps {}

const Field = React.forwardRef<HTMLDivElement, FieldProps>(({ className = '', name, invalid = false, required = false, children, ...props }, ref) => {
	const generatedId = useId();
	const ids = getFieldIds(name ?? generatedId);
	const context: FieldContextValue = { ...ids, invalid, required };

	return (
		<FieldContext.Provider value={context}>
			<div ref={ref} role="group" data-slot="field" data-invalid={invalid} data-required={required} className={`${styles[fieldStyleKeys.root]} ${className}`} {...props}>
				{children}
			</div>
		</FieldContext.Provider>
	);
});
Field.displayName = 'Field';

export interface FieldLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement>, FieldLabelBaseProps {}

const FieldLabel = React.forwardRef<HTMLLabelElement, FieldLabelProps>(({ className = '', htmlFor, children, ...props }, ref) => {
	const context = useFieldContext();

	return (
		<label ref={ref} htmlFor={htmlFor ?? context.id} id={context.labelId} data-slot="field-label" className={`${styles[fieldStyleKeys.label]} ${className}`} {...props}>
			{children}
		</label>
	);
});
FieldLabel.displayName = 'FieldLabel';

export interface FieldDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement>, FieldDescriptionBaseProps {}

const FieldDescription = React.forwardRef<HTMLParagraphElement, FieldDescriptionProps>(({ className = '', children, ...props }, ref) => {
	const context = useFieldContext();

	return (
		<p ref={ref} id={context.descriptionId} data-slot="field-description" className={`${styles[fieldStyleKeys.description]} ${className}`} {...props}>
			{children}
		</p>
	);
});
FieldDescription.displayName = 'FieldDescription';

export interface FieldMessageProps extends React.HTMLAttributes<HTMLDivElement>, FieldMessageBaseProps {}

const FieldMessage = React.forwardRef<HTMLDivElement, FieldMessageProps>(({ className = '', variant = 'default', children, ...props }, ref) => {
	const context = useFieldContext();
	const styleKeys = getFieldMessageStyleKeys(variant);
	const classes = [styles[styleKeys.base], styles[styleKeys.variant], className].filter(Boolean).join(' ');

	return (
		<div ref={ref} id={context.messageId} role={variant === 'error' ? 'alert' : undefined} data-slot="field-message" data-variant={variant} className={classes} {...props}>
			{children}
		</div>
	);
});
FieldMessage.displayName = 'FieldMessage';

export { Field, FieldLabel, FieldDescription, FieldMessage };
export default Field;
