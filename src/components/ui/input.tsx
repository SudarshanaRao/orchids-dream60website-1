import * as React from "react";

import { cn } from "./utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        data-slot="input"
        className={cn(
          // Base styles + your custom colors + responsive rounding
          "flex h-9 w-full min-w-0 px-3 py-1 text-base transition-all duration-200 outline-none",

          // Colors (copied from your input field)
          "bg-white/50 border-2 border-purple-400 text-purple-900 placeholder-purple-400",
          "focus:border-purple-600 focus:ring-2 focus:ring-purple-400/100",

          // Responsive rounded values
          "rounded-xl md:rounded-xl",

          // File input + disabled styles from the original
          "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",

          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export { Input };
