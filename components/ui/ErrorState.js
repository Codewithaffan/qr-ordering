"use client";
import Button from "./Button";

export default function ErrorState({ message = "Something went wrong.", onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-14 text-center">
      <div className="text-4xl" aria-hidden>⚠️</div>
      <h3 className="text-base font-semibold text-ink">Couldn&apos;t load this</h3>
      <p className="max-w-sm text-sm text-muted">{message}</p>
      {onRetry && (
        <Button variant="secondary" className="mt-3" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
