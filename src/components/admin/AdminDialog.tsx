"use client";

import { X } from "lucide-react";
import { createContext, useContext, useEffect, useId, useRef, type ReactNode, type RefObject } from "react";

const DialogClose = createContext<() => void>(() => {});

function Sheet({
  dialogRef,
  kicker,
  title,
  lede,
  wide,
  onClose,
  children,
}: {
  dialogRef: RefObject<HTMLDialogElement | null>;
  kicker?: string;
  title: string;
  lede?: string;
  wide?: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const titleId = useId();
  return (
    <dialog
      ref={dialogRef}
      className={wide ? "admin-dialog is-wide" : "admin-dialog"}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialogRef.current) dialogRef.current?.close();
      }}
    >
      <div className="admin-dialog-sheet">
        <header>
          <div>
            <p className="admin-dialog-kicker">{kicker ?? "Florida"}</p>
            <h2 id={titleId}>{title}</h2>
            {lede ? <p className="admin-dialog-lede">{lede}</p> : null}
          </div>
          <button type="button" onClick={() => dialogRef.current?.close()} aria-label="Fermer">
            <X size={16} aria-hidden />
          </button>
        </header>
        <DialogClose.Provider value={() => dialogRef.current?.close()}>{children}</DialogClose.Provider>
      </div>
    </dialog>
  );
}

export function AdminDialog({
  label,
  className,
  kicker,
  title,
  lede,
  wide,
  children,
}: {
  label: string;
  className?: string;
  kicker?: string;
  title: string;
  lede?: string;
  wide?: boolean;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button type="button" className={className ?? "admin-btn"} onClick={() => ref.current?.showModal()}>
        {label}
      </button>
      <Sheet dialogRef={ref} kicker={kicker} title={title} lede={lede} wide={wide} onClose={() => {}}>
        {children}
      </Sheet>
    </>
  );
}

export function ControlledDialog({
  open,
  kicker,
  title,
  lede,
  wide,
  onClose,
  children,
}: {
  open: boolean;
  kicker?: string;
  title: string;
  lede?: string;
  wide?: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (open && !node.open) node.showModal();
    if (!open && node.open) node.close();
  }, [open]);
  return (
    <Sheet dialogRef={ref} kicker={kicker} title={title} lede={lede} wide={wide} onClose={onClose}>
      {children}
    </Sheet>
  );
}

export function DialogForm({
  action,
  submitLabel,
  danger,
  children,
}: {
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
  danger?: boolean;
  children: ReactNode;
}) {
  const close = useContext(DialogClose);
  return (
    <form
      action={async (formData) => {
        await action(formData);
        close();
      }}
    >
      {children}
      <div className="admin-dialog-actions">
        <button type="button" className="admin-btn admin-btn-ghost" onClick={close}>Annuler</button>
        <button type="submit" className={danger ? "admin-btn is-danger" : "admin-btn is-solid"}>{submitLabel}</button>
      </div>
    </form>
  );
}
