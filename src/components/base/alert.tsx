import type { ReactNode } from "react"
import { tv, type VariantProps } from "tailwind-variants"

const alertVariants = tv({
  base: "border-1 py-2 px-4 space-y-2 rounded-md",
  variants: {
    color: {
      warning: "bg-yellow-200 border-yellow-300 text-yellow-800",
      error: "bg-red-200 border-red-300 text-red-800",
    },
  },
  defaultVariants: {
    variant: "solid",
    color: "error",
  },
})

type AlertVariants = VariantProps<typeof alertVariants>

export interface AlertProps extends AlertVariants {
  className?: string
  title: ReactNode
  description: ReactNode
}

export function Alert({ title, description, ...props }: AlertProps) {
  // return (
  //   <RACButton
  //     {...props}
  //     className={composeRenderProps(props.className, (className, renderProps) =>
  //       button({ ...renderProps, variant: props.variant, className }),
  //     )}
  //   />
  // );

  return (
    <div className={alertVariants(props)}>
      <h3 className="font-bold">{title}</h3>

      <p className="text-sm">{description}</p>
    </div>
  )
}
