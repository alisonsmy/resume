import { useEffect, useRef, type ReactNode } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  id: string;
  title: string;
  description: string;
  className?: string;
  closeLabel: string;
  children: ReactNode;
}
export function Modal({
  open,
  onClose,
  id,
  title,
  description,
  className = "",
  closeLabel,
  children,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (open && !dialog?.open) dialog?.showModal();
    if (!open && dialog?.open) dialog.close();
    document.body.classList.toggle("editor-open", open);
    return () => {
      document.body.classList.remove("editor-open");
    };
  }, [open]);
  return (
    <dialog
      ref={ref}
      id={id}
      className={`experience-editor ${className}`}
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-intro`}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="editor-header">
        <div>
          <h2 id={`${id}-title`}>{title}</h2>
          <p id={`${id}-intro`}>{description}</p>
        </div>
        <button
          type="button"
          className="editor-close"
          aria-label={closeLabel}
          onClick={onClose}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m5 5 14 14M19 5 5 19" />
          </svg>
        </button>
      </div>
      {children}
    </dialog>
  );
}
