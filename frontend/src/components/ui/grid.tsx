import * as React from "react"
import { cn } from "@/lib/utils"

export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  columns?: {
    sm?: number
    md?: number
    lg?: number
    xl?: number
  }
  gap?: string
}

const Grid = React.forwardRef<HTMLDivElement, GridProps>(
  ({ className, columns = {}, gap = "4", children, ...props }, ref) => {
    const { sm = 1, md = 2, lg = 3, xl = 4 } = columns

    return (
      <div
        ref={ref}
        className={cn(
          "grid",
          `gap-${gap}`,
          `sm:grid-cols-${sm}`,
          `md:grid-cols-${md}`,
          `lg:grid-cols-${lg}`,
          `xl:grid-cols-${xl}`,
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Grid.displayName = "Grid"

export { Grid }

