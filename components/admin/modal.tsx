"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

/** Popup built on the native <dialog>: focus trap, Escape to close and a backdrop for free. */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = "lg",
  dismissible = true,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  size?: "md" | "lg" | "xl";
  /** false = no close button, Escape and backdrop clicks do nothing. */
  dismissible?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    // Next.js keeps a page you navigate away from mounted but hidden, and runs
    // this cleanup when it hides it. A modal <dialog> left open makes the rest
    // of the document inert, which froze every button on the next page, so it
    // must be closed here (closing also tells the owner via onClose).
    return () => {
      if (dialog.open) dialog.close();
    };
  }, [open]);

  const width = { md: "max-w-xl", lg: "max-w-4xl", xl: "max-w-6xl" }[size];

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={(event) => {
        if (!dismissible) event.preventDefault(); // Escape
      }}
      onClick={(event) => {
        // A click on the backdrop lands on the <dialog> element itself.
        if (dismissible && event.target === ref.current) onClose();
      }}
      aria-labelledby="modal-title"
      className={`m-auto w-[calc(100%-2rem)] ${width} rounded-2xl border border-border bg-card p-0 text-foreground shadow-xl backdrop:bg-foreground/40`}
    >
      {open && (
        <div className="flex max-h-[85vh] flex-col">
          <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
            <div>
              <h2
                id="modal-title"
                className="text-xl font-semibold text-primary"
              >
                {title}
              </h2>
              {description && (
                <p className="mt-1 text-sm text-muted-foreground">{description}</p>
              )}
            </div>
            {dismissible && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-primary"
              >
                <X className="size-5" />
              </button>
            )}
          </div>
          <div className="overflow-y-auto px-6 py-5">{children}</div>
        </div>
      )}
    </dialog>
  );
}
