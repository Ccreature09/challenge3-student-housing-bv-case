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
      className={`m-auto w-[calc(100%-2rem)] ${width} rounded-2xl border border-sky-300 bg-white p-0 text-stone-900 shadow-xl backdrop:bg-sky-950/40`}
    >
      {open && (
        <div className="flex max-h-[85vh] flex-col">
          <div className="flex items-start justify-between gap-4 border-b border-sky-200 px-6 py-4">
            <div>
              <h2
                id="modal-title"
                className="text-xl font-semibold text-sky-900"
              >
                {title}
              </h2>
              {description && (
                <p className="mt-1 text-sm text-stone-600">{description}</p>
              )}
            </div>
            {dismissible && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="rounded-lg p-2 text-stone-600 hover:bg-sky-50 hover:text-sky-900"
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
