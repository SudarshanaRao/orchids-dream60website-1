"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "./utils";

/**
 * Theme notes applied:
 * - Background: bg-white/50
 * - Border: border-2 border-purple-400
 * - Text: text-purple-900
 * - Focus border: focus:border-purple-600
 * - Focus ring: focus:ring-2 focus:ring-purple-400/100
 * - Rounding: rounded-xl (small) -> md:rounded-xl
 * - Active tab: bg-purple-600 / text-white
 */

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  );
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        // container: background + border + responsive rounding
        "inline-flex h-9 w-fit items-center justify-center p-[3px]",
        "bg-white/50 border-2 border-purple-400 text-purple-900",
        "rounded-xl md:rounded-xl",
        className,
      )}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        // preserve sizing + spacing
        "inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow]",
        // theme colors + borders
        "border border-transparent",
        "text-purple-900",
        // active state (selected tab)
        "data-[state=active]:bg-purple-600 data-[state=active]:text-white",
        // focus states match input focus style
        "focus:border-purple-600 focus:ring-2 focus:ring-purple-400/100 focus-visible:outline-none focus-visible:ring-[3px]",
        // responsive rounding
        "rounded-xl md:rounded-xl",
        // accessibility / disabled / svg rules from original
        "disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
