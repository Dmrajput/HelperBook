import { Button } from "@/components/ui/button";

export function ErrorState({ message = "Something went wrong.", onRetry }) {
  return (
    <div className="rounded-xl border border-red-100 bg-red-50 px-6 py-8 text-center">
      <p className="text-sm text-danger">{message}</p>
      {onRetry ? (
        <Button className="mt-4" variant="secondary" onClick={onRetry}>
          Retry
        </Button>
      ) : null}
    </div>
  );
}
