import { cn } from "@/lib/utils";

const variants = {
  default: "bg-brand text-white hover:bg-[#4a47c7] shadow-sm",
  secondary: "bg-white text-ink border border-border hover:bg-slate-50",
  outline: "border border-brand text-brand bg-transparent hover:bg-brand-soft",
  ghost: "text-ink hover:bg-slate-100",
};

const sizes = {
  default: "h-11 px-5 text-sm",
  sm: "h-9 px-3 text-sm",
  lg: "h-12 px-6 text-base",
};

export function Button({ className, variant = "default", size = "default", type = "button", asChild, ...props }) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}
