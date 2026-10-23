import { useEffect, useRef } from 'react';

/**
 * Thin wrapper over the native <dialog>: showModal() gives a focus trap,
 * Escape-to-close, an inert background and a ::backdrop for free.
 * Escape and backdrop clicks call onClose; the parent owns `open`.
 */
export default function Dialog({ open, onClose, labelledBy, children, className = '' }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      onCancel={(e) => {
        e.preventDefault(); // keep `open` in React's hands
        onClose();
      }}
      onClick={(e) => e.target === ref.current && onClose()}
      className={`m-auto w-[min(28rem,calc(100vw-2rem))] rounded-2xl bg-white p-0 text-slate-800 shadow-2xl backdrop:bg-slate-950/50 backdrop:backdrop-blur-sm dark:bg-slate-900 dark:text-slate-100 ${className}`}
    >
      {open && <div className="arena-enter p-5 sm:p-6">{children}</div>}
    </dialog>
  );
}
