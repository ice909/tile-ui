import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { getNextOtpIndex, getPrevOtpIndex, inputOtpStyleKeys, isOtpCharAllowed, joinOtpValue, splitOtpValue } from '@tile-ui/core';
import type { InputOtpBaseProps, InputOtpMode, InputOtpSlotBaseProps } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/input-otp.module.scss';

interface InputOtpContextValue {
	value: string;
	maxLength: number;
	activeIndex: number;
	mode: InputOtpMode;
	disabled: boolean;
	registerSlot: (index: number, element: HTMLInputElement | null) => void;
	setActiveIndex: (index: number) => void;
	focusSlot: (index: number) => void;
	handleInputChange: (index: number, inputValue: string) => void;
	handleSlotKeyDown: (index: number, event: React.KeyboardEvent<HTMLInputElement>) => void;
	handlePaste: (event: React.ClipboardEvent<HTMLInputElement>) => void;
}

const InputOtpContext = createContext<InputOtpContextValue | null>(null);

function useInputOtpContext(): InputOtpContextValue {
	const context = useContext(InputOtpContext);
	if (!context) {
		throw new Error('InputOTP sub-components must be used within <InputOTP>.');
	}
	return context;
}

export interface InputOTPProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange' | 'value' | 'defaultValue'>, InputOtpBaseProps {
	containerClassName?: string;
}

const InputOTP = React.forwardRef<HTMLDivElement, InputOTPProps>(
	(
		{ className = '', containerClassName = '', value, defaultValue = '', maxLength = 4, disabled = false, mode = 'alphanumeric', onChange, onComplete, children, ...props },
		ref,
	) => {
		const [internalValue, setInternalValue] = useState(defaultValue);
		const isControlled = value !== undefined;
		const currentValue = isControlled ? value : internalValue;
		const [activeIndex, setActiveIndexState] = useState(0);
		const slotsRef = useRef<(HTMLInputElement | null)[]>([]);

		function commit(next: string) {
			const sanitized = Array.from(next)
				.filter((char) => isOtpCharAllowed(char, mode))
				.slice(0, maxLength)
				.join('');
			if (!isControlled) {
				setInternalValue(sanitized);
			}
			onChange?.(sanitized);
			if (sanitized.length === maxLength) {
				onComplete?.(sanitized);
			}
			return sanitized;
		}

		function registerSlot(index: number, element: HTMLInputElement | null) {
			slotsRef.current[index] = element;
		}

		const focusSlot = useCallback((index: number) => {
			const slot = slotsRef.current[index];
			slot?.focus();
			slot?.select();
			setActiveIndexState(index);
		}, []);

		const setActiveIndex = useCallback((index: number) => {
			setActiveIndexState(index);
		}, []);

		function handleInputChange(index: number, inputValue: string) {
			const newChar =
				Array.from(inputValue)
					.filter((char) => isOtpCharAllowed(char, mode))
					.slice(-1)[0] ?? '';
			const chars = splitOtpValue(currentValue, maxLength);
			chars[index] = newChar;
			commit(joinOtpValue(chars, maxLength));
			if (newChar) {
				const next = getNextOtpIndex(index, maxLength);
				if (next !== null) {
					focusSlot(next);
				}
			}
		}

		function handleSlotKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
			if (event.key === 'Backspace') {
				event.preventDefault();
				const chars = splitOtpValue(currentValue, maxLength);
				if (chars[index]) {
					chars[index] = '';
					commit(joinOtpValue(chars, maxLength));
				} else {
					const prev = getPrevOtpIndex(index);
					if (prev !== null) {
						chars[prev] = '';
						commit(joinOtpValue(chars, maxLength));
						focusSlot(prev);
					}
				}
			} else if (event.key === 'ArrowLeft') {
				event.preventDefault();
				const prev = getPrevOtpIndex(index);
				if (prev !== null) {
					focusSlot(prev);
				}
			} else if (event.key === 'ArrowRight') {
				event.preventDefault();
				const next = getNextOtpIndex(index, maxLength);
				if (next !== null) {
					focusSlot(next);
				}
			}
		}

		function handlePaste(event: React.ClipboardEvent<HTMLInputElement>) {
			event.preventDefault();
			const text = event.clipboardData.getData('text');
			const pasted = Array.from(text)
				.filter((char) => isOtpCharAllowed(char, mode))
				.slice(0, maxLength);
			if (pasted.length === 0) {
				return;
			}
			const chars = splitOtpValue(currentValue, maxLength);
			for (let i = 0; i < pasted.length && activeIndex + i < maxLength; i++) {
				chars[activeIndex + i] = pasted[i];
			}
			commit(joinOtpValue(chars, maxLength));
			const nextIndex = Math.min(activeIndex + pasted.length, maxLength - 1);
			focusSlot(nextIndex);
		}

		return (
			<InputOtpContext.Provider
				value={{
					value: currentValue,
					maxLength,
					activeIndex,
					mode,
					disabled,
					registerSlot,
					setActiveIndex,
					focusSlot,
					handleInputChange,
					handleSlotKeyDown,
					handlePaste,
				}}>
				<div
					ref={ref}
					data-slot="input-otp"
					data-disabled={disabled}
					className={[styles[inputOtpStyleKeys.root], containerClassName, className].filter(Boolean).join(' ')}
					{...props}>
					{children}
				</div>
			</InputOtpContext.Provider>
		);
	},
);
InputOTP.displayName = 'InputOTP';

export interface InputOTPGroupProps extends React.HTMLAttributes<HTMLDivElement> {}

const InputOTPGroup = React.forwardRef<HTMLDivElement, InputOTPGroupProps>(({ className = '', children, ...props }, ref) => {
	return (
		<div ref={ref} data-slot="input-otp-group" className={[styles[inputOtpStyleKeys.group], className].filter(Boolean).join(' ')} {...props}>
			{children}
		</div>
	);
});
InputOTPGroup.displayName = 'InputOTPGroup';

export interface InputOTPSlotProps extends React.HTMLAttributes<HTMLDivElement>, InputOtpSlotBaseProps {}

const InputOTPSlot = React.forwardRef<HTMLDivElement, InputOTPSlotProps>(({ className = '', index, children, ...props }, ref) => {
	const context = useInputOtpContext();
	const char = context.value[index] ?? '';
	const isActive = context.activeIndex === index;

	function setRef(element: HTMLInputElement | null) {
		context.registerSlot(index, element);
	}

	return (
		<div ref={ref} data-slot="input-otp-slot" data-active={isActive} className={[styles[inputOtpStyleKeys.slot], className].filter(Boolean).join(' ')} {...props}>
			<input
				ref={setRef}
				value={char}
				disabled={context.disabled}
				inputMode={context.mode === 'numeric' ? 'numeric' : 'text'}
				autoComplete="one-time-code"
				aria-label={`Character ${index + 1}`}
				onFocus={(event) => {
					context.setActiveIndex(index);
					event.target.select();
				}}
				onChange={(event) => context.handleInputChange(index, event.target.value)}
				onKeyDown={(event) => context.handleSlotKeyDown(index, event)}
				onPaste={context.handlePaste}
			/>
			{children}
		</div>
	);
});
InputOTPSlot.displayName = 'InputOTPSlot';

export interface InputOTPSeparatorProps extends React.HTMLAttributes<HTMLDivElement> {}

const InputOTPSeparator = React.forwardRef<HTMLDivElement, InputOTPSeparatorProps>(({ className = '', ...props }, ref) => {
	return (
		<div ref={ref} data-slot="input-otp-separator" role="separator" className={[styles[inputOtpStyleKeys.separator], className].filter(Boolean).join(' ')} {...props}>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="16"
				height="16"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
				aria-hidden="true">
				<path d="M5 12h14" />
			</svg>
		</div>
	);
});
InputOTPSeparator.displayName = 'InputOTPSeparator';

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator };
export default InputOTP;
