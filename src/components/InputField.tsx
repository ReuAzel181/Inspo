import type {
  ChangeEvent,
  InputHTMLAttributes,
  ReactNode,
} from 'react';

export type InputFieldStatus = 'default' | 'active' | 'error' | 'disabled';

export interface InputFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'onChange'> {
  value?: string;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  leadingIcon?: ReactNode;
  trailing?: ReactNode;
  status?: InputFieldStatus;
  size?: 'sm' | 'md';
  containerClassName?: string;
  inputClassName?: string;
}

export function InputField({
  value,
  onChange,
  leadingIcon,
  trailing,
  status = 'default',
  size = 'md',
  disabled,
  className,
  containerClassName,
  inputClassName,
  ...inputProps
}: InputFieldProps) {
  const isDisabled = disabled || status === 'disabled';
  const isError = status === 'error';

  const rootClasses = [
    'group relative flex min-w-0 items-center overflow-hidden rounded-lg border bg-white transition-all duration-200 ease-out',
    size === 'sm' ? 'h-10' : 'h-12',

    isDisabled
      ? [
          'cursor-not-allowed',
          'border-[#e5e7eb]',
          'bg-[#f8fafc]',
          'text-[#9aa4b2]',
          'shadow-none',
        ].join(' ')

      : isError
        ? [
            'border-[#f2b8b8]',
            'bg-[#fff5f5]',
            'shadow-[0_0_0_4px_rgba(239,68,68,0.08)]',
          ].join(' ')

        : [
            // DEFAULT
            'border-[#dfe3e8]',
            'bg-white',
            'shadow-[0_1px_2px_rgba(15,23,42,0.03)]',

            // HOVER ONLY WHEN NOT FOCUSED
            'group-hover:not-focus-within:border-[#c9d1da]',
            'group-hover:not-focus-within:shadow-[0_0_0_3px_rgba(23,105,209,0.06)]',

            // FOCUS / ACTIVE
            // This remains blue regardless of mouse position.
            'focus-within:border-[#1769d1]',
            'focus-within:bg-[#f7fbff]',
            'focus-within:shadow-[0_0_0_4px_rgba(23,105,209,0.08)]',
          ].join(' '),

    containerClassName,
  ]
    .filter(Boolean)
    .join(' ');

  const iconClasses = [
    'flex shrink-0 items-center transition-colors duration-200',

    leadingIcon ? 'ml-3.5' : '',

    isDisabled
      ? 'text-[#b6bec8]'
      : isError
        ? 'text-[#d94d4d]'
        : [
            'text-[#9299a2]',

            // Hover icon only when not focused.
            'group-hover:not-focus-within:text-[#1769d1]',

            // Focused icon stays blue regardless of mouse.
            'group-focus-within:text-[#1769d1]',
          ].join(' '),
  ]
    .filter(Boolean)
    .join(' ');

  const inputClasses = [
    'min-w-0 flex-1 bg-transparent text-[13px] text-[#202328] outline-none',
    'placeholder:text-[#9da3aa]',
    'transition-colors duration-200',

    // Typing caret is blue whenever the input is focused.
    'caret-[#1769d1]',

    'focus:outline-none',
    'focus:ring-0',
    'focus-visible:outline-none',

    leadingIcon ? 'pl-3' : 'px-3',
    trailing ? 'pr-0' : 'pr-3',

    isDisabled
      ? [
          'text-[#9aa4b2]',
          'placeholder:text-[#b6bec8]',
          'caret-[#9aa4b2]',
        ].join(' ')
      : '',

    className,
    inputClassName,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClasses}>
      {leadingIcon ? (
        <span className={iconClasses}>
          {leadingIcon}
        </span>
      ) : null}

      <input
        {...inputProps}
        value={value}
        onChange={onChange}
        disabled={isDisabled}
        aria-invalid={isError || undefined}
        className={inputClasses}
      />

      {trailing ? (
        <div className="mr-2.5 flex shrink-0 items-center">
          {trailing}
        </div>
      ) : null}
    </div>
  );
}