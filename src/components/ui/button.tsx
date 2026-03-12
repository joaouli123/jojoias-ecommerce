import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-[20px] text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/35 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-[#1A1A1A] text-zinc-50 hover:bg-[#1A1A1A]/90": variant === 'default',
            "border border-zinc-200 bg-white hover:bg-[#F9F8F6] hover:text-[#1A1A1A]": variant === 'outline',
            "hover:bg-[#F9F8F6] hover:text-[#1A1A1A]": variant === 'ghost',
            "bg-red-500 text-zinc-50 hover:bg-red-500/90": variant === 'destructive',
            "h-10 px-4 py-2": size === 'default',
            "h-9 px-3": size === 'sm',
            "h-11 px-8": size === 'lg',
            "h-10 w-10": size === 'icon',
          },
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
