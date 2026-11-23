import { cn } from "@/lib/utils";

const variants = {
  default: "bg-brand text-white hover:bg-indigo-600",
  secondary: "bg-white text-ink border border-border hover:bg-slate-50",
  outline: "border border-border bg-transparent hover:bg-slate-50",
  ghost: "hover:bg-slate-100 text-ink",
  danger: "bg-danger text-white hover:bg-red-700",
};

const sizes = {
  default: "h-9 px-4 text-sm",
  sm: "h-8 px-3 text-xs",
  lg: "h-10 px-5 text-sm",
  icon: "h-9 w-9",
};

export function Button({ className, variant = "default", size = "default", type = "button", ...props }) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-medium transition disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}
