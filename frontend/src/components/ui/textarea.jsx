import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({
  className,
  ...props
}) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "min-h-16 w-full rounded-lg border bg-dark-950 border-dark-700 px-3 py-2 text-sm text-dark-100 placeholder:text-dark-500 transition-colors outline-none resize-none",
        "focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props} />
  );
}

export { Textarea }
