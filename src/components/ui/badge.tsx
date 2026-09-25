import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground',
        secondary: 'bg-secondary text-secondary-foreground',
        outline: 'border text-foreground',
        // Colores por significado (el mapeo estado -> color vive en cada vista).
        green: 'bg-green-100 text-green-800',
        amber: 'bg-amber-100 text-amber-800',
        gray: 'bg-gray-100 text-gray-700',
      },
    },
    // Gris: color por defecto para cualquier valor que la vista no mapee.
    defaultVariants: {
      variant: 'gray',
    },
  },
)

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
