import * as React from "react";

import { cn } from "./utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        // Layout + transitions
        "flex field-sizing-content min-h-16 w-full px-3 py-2 text-base transition-all duration-200 outline-none resize-none",

        // Colors (same as input field)
        "bg-white/50 border-2 border-purple-400 text-purple-900 placeholder-purple-400",
        "focus:border-purple-600 focus:ring-2 focus:ring-purple-400/100",

        // Responsive rounding
        "rounded-xl md:rounded-xl",

        // Disabled + error states from original
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",

        className
      )}
      {...props}
    />
  );
}

export { Textarea };
