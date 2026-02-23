import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/core/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border border-transparent px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-50',
        success: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        destructive: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
        warning: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        outline: 'text-slate-200 border-slate-700',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
