import { cn } from "@/lib/utils";

export function Table({ className, ...props }) {
  return (
    <div className="w-full overflow-auto">
      <table className={cn("w-full caption-bottom text-sm", className)} {...props} />
    </div>
  );
}

export function THead({ className, ...props }) {
  return <thead className={cn("border-b border-border bg-slate-50/80 text-left", className)} {...props} />;
}

export function TBody({ className, ...props }) {
  return <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />;
}

export function TR({ className, ...props }) {
  return <tr className={cn("border-b border-border transition hover:bg-slate-50/70", className)} {...props} />;
}

export function TH({ className, ...props }) {
  return <th className={cn("h-10 px-4 text-xs font-semibold uppercase tracking-wide text-muted", className)} {...props} />;
}

export function TD({ className, ...props }) {
  return <td className={cn("px-4 py-3 align-middle text-ink", className)} {...props} />;
}
