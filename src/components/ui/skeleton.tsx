import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-xl bg-linear-to-r from-cyan-100/80 via-sky-100/80 to-emerald-100/80", className)}
      {...props}
    />
  )
}

export { Skeleton }
