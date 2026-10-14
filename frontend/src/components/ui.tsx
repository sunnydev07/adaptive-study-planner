import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';
import { cn } from '../lib/utils';

/* ---------- Button ---------- */
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full text-sm font-medium transition-all duration-200 cursor-pointer disabled:pointer-events-none disabled:opacity-45 active:scale-[0.97] [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-ink text-paper shadow-sm hover:bg-stone-800',
        accent: 'bg-emerald-800 text-white shadow-sm hover:bg-emerald-900',
        outline: 'border border-stone-300 bg-white hover:border-ink hover:bg-stone-50',
        ghost: 'hover:bg-stone-200/60',
        softRose: 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100',
        softAmber: 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100',
        softSky: 'bg-sky-50 text-sky-900 border border-sky-200 hover:bg-sky-100',
        softViolet: 'bg-violet-50 text-violet-900 border border-violet-200 hover:bg-violet-100',
      },
      size: {
        sm: 'h-8 px-3 text-[13px]',
        default: 'h-10 px-5',
        lg: 'h-12 px-7 text-[15px]',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild, ...p }, ref) => {
  const C = asChild ? Slot : 'button';
  return <C ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...p} />;
});
Button.displayName = 'Button';

/* ---------- Card ---------- */
export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...p }, ref) => (
  <div ref={ref} className={cn('rounded-2xl border border-stone-200/90 bg-white shadow-[0_1px_2px_rgba(28,25,23,0.05)]', className)} {...p} />
));
Card.displayName = 'Card';

export const CardHeader = ({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col gap-1 px-5 pt-5', className)} {...p} />
);
export const CardTitle = ({ className, ...p }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={cn('font-display text-[22px] leading-tight', className)} {...p} />
);
export const CardContent = ({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('px-5 pb-5', className)} {...p} />
);

/* ---------- Badge ---------- */
const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold tracking-wide [&_svg]:size-3',
  {
    variants: {
      variant: {
        default: 'border-stone-200 bg-stone-100 text-stone-700',
        ink: 'border-ink bg-ink text-paper',
        accent: 'border-emerald-200 bg-emerald-50 text-emerald-900',
        rose: 'border-rose-200 bg-rose-50 text-rose-800',
        amber: 'border-amber-200 bg-amber-50 text-amber-900',
        sky: 'border-sky-200 bg-sky-50 text-sky-900',
        violet: 'border-violet-200 bg-violet-50 text-violet-900',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);
export const Badge = ({ className, variant, ...p }: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) => (
  <span className={cn(badgeVariants({ variant }), className)} {...p} />
);

/* ---------- Progress ---------- */
export const Progress = ({ value, className, barClassName }: { value: number; className?: string; barClassName?: string }) => (
  <div className={cn('h-2 w-full overflow-hidden rounded-full bg-stone-200/70', className)}>
    <div className={cn('h-full rounded-full bg-ink transition-[width] duration-700 ease-out', barClassName)} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
  </div>
);

/* ---------- Separator ---------- */
export const Separator = ({ className }: { className?: string }) => <div className={cn('h-px bg-stone-200/80', className)} />;

/* ---------- Tabs (radix) ---------- */
export const Tabs = TabsPrimitive.Root;
export const TabsList = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>>(({ className, ...p }, ref) => (
  <TabsPrimitive.List ref={ref} className={cn('inline-flex items-center gap-1 rounded-full border border-stone-200 bg-stone-100/70 p-1', className)} {...p} />
));
TabsList.displayName = 'TabsList';
export const TabsTrigger = React.forwardRef<HTMLButtonElement, React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>>(({ className, ...p }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn('rounded-full px-4 py-1.5 text-[13px] font-medium text-stone-500 transition-all cursor-pointer data-[state=active]:bg-ink data-[state=active]:text-paper data-[state=active]:shadow-sm', className)}
    {...p}
  />
));
TabsTrigger.displayName = 'TabsTrigger';

/* ---------- Dialog (radix) ---------- */
export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export function DialogContent({ className, children, ...p }: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in-0" />
      <DialogPrimitive.Content
        className={cn('fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-stone-200 bg-white p-6 shadow-2xl data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95', className)}
        {...p}
      >
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-full p-1.5 text-stone-400 hover:bg-stone-100 hover:text-ink transition-colors" aria-label="Close">
          <X size={16} />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
export const DialogTitle = ({ className, ...p }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h2 className={cn('font-display text-2xl', className)} {...p} />
);
export const DialogDescription = ({ className, ...p }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn('mt-1 text-sm leading-relaxed text-stone-500', className)} {...p} />
);
export const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block">
    <span className="eyebrow mb-1.5 block">{label}</span>
    {children}
  </label>
);
export const inputCls =
  'w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm outline-none transition-all placeholder:text-stone-400 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15';
