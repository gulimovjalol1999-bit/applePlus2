import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

const variants = {
  primary: 'bg-accent text-white hover:opacity-90 active:scale-[0.98]',
  secondary: 'bg-ap-gray2 text-ap-black hover:bg-ap-gray3',
  ghost: 'text-accent hover:bg-blue-50',
  outline: 'border border-ap-gray3 text-ap-black hover:bg-ap-gray1',
  dark: 'bg-ap-black text-white hover:opacity-90',
  destructive: 'bg-red-500 text-white hover:bg-red-600',
}

const sizes = {
  sm: 'h-8 px-4 text-sm rounded-full',
  md: 'h-10 px-5 text-sm rounded-full',
  lg: 'h-12 px-8 text-base rounded-full',
  xl: 'h-14 px-10 text-base rounded-full',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants
  size?: keyof typeof sizes
  isLoading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = 'primary', size = 'md', isLoading, disabled, children, ...props },
    ref
  ) => (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {isLoading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  )
)
Button.displayName = 'Button'
