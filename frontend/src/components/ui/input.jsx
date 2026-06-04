import * as React from "react"

import { cn } from "@/lib/utils"

function Input({
  className,
  type,
  ...props
}) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-lg border bg-dark-950 border-dark-700 px-3 py-2 text-sm text-dark-100 placeholder:text-dark-500 transition-colors outline-none",
        "focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props} />
  );
}

export { Input }
