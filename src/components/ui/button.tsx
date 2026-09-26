import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/*
  Actions are rectangles (rounded-lg), status is a pill (Tag). One ink
  button per view, for its main action; everything else in a toolbar or a
  header is outline, and ghost in a panel header. `pill` sizes stay for the
  marketing pages' calls to action.
*/
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-lg text-sm font-medium whitespace-nowrap outline-none transition-[color,background-color,border-color,box-shadow,scale,opacity] duration-150 ease-(--ease-standard) active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/85 disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100 disabled:shadow-none",
        destructive:
          "bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20",
        outline:
          "border bg-background text-foreground shadow-xs hover:bg-muted/60 dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-muted text-foreground hover:bg-muted/70",
        ghost: "hover:bg-muted hover:text-foreground focus-visible:bg-muted",
        link: "text-foreground underline-offset-4 hover:underline active:scale-100",
        // For the always-dark marketing surfaces: a frosted outline.
        glass:
          "border-inverted-foreground/20 bg-inverted-foreground/5 text-inverted-foreground border shadow-none backdrop-blur-sm hover:bg-inverted-foreground/10 hover:text-inverted-foreground",
        // The same outline on the hero stage, in whichever ink the stage
        // is using: dark on grey by day, frosted on the dark stage at night.
        stage:
          "border-stage-foreground/15 bg-stage-foreground/[0.04] text-stage-foreground border shadow-none backdrop-blur-sm hover:bg-stage-foreground/10 hover:text-stage-foreground dark:border-stage-foreground/20 dark:bg-stage-foreground/5",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        // Page headers and toolbars: the same height as the filter controls.
        sm: "h-8 gap-1.5 px-3 text-[13px] has-[>svg]:px-2.5",
        // Panel headers and footers: one step under `sm`.
        xs: "h-7 gap-1.5 rounded-md px-2.5 text-xs has-[>svg]:px-2 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-10 px-6 has-[>svg]:px-4",
        // Marketing calls to action: fully rounded and a touch taller.
        pill: "h-11 rounded-full px-6 text-[15px] has-[>svg]:px-5",
        "pill-sm": "h-9 rounded-full px-4 has-[>svg]:px-3.5",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-xs": "size-7 rounded-md [&_svg:not([class*='size-'])]:size-3.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
