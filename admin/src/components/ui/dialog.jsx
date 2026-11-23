import { cn } from "@/lib/utils";

export function Dialog({ open, onClose, title, children, footer, className }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-slate-900/40" aria-label="Close dialog" onClick={onClose} />
      <div className={cn("relative z-10 w-full max-w-lg rounded-xl border border-border bg-white shadow-xl", className)}>
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold text-ink">{title}</h2>
          <button type="button" className="text-muted hover:text-ink" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer ? <div className="flex justify-end gap-2 border-t border-border px-5 py-4">{footer}</div> : null}
      </div>
    </div>
  );
}
