import * as React from "react"

const Select = React.forwardRef(({ className, children, ...props }, ref) => {
    return (
        <select
            className={`flex h-10 w-full items-center justify-between rounded-lg border bg-dark-950 border-dark-700 px-3 py-2 text-sm text-dark-100 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
            ref={ref}
            {...props}
        >
            {children}
        </select>
    )
})
Select.displayName = "Select"

export { Select }
