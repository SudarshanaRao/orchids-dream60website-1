"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "./utils";

function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        "peer inline-flex h-5 w-10 items-center rounded-full transition-all",
        "cursor-pointer relative",
        // background colors
        "data-[state=checked]:bg-[#8555d7f9]",
        "data-[state=unchecked]:bg-[#bc9cfd]",
        // ✨ border added here
        "border border-[#a37efa]" // soft lavender border
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "block h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
          "data-[state=unchecked]:translate-x-0",
          "data-[state=checked]:translate-x-5"
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
