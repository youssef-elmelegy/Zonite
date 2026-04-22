import { ReactNode, useCallback, useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from './Modal.module.css';
import { IconClose } from '../common/icons';

export interface ModalProps {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  /** Right-aligned action button */
  action?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  /** When false, backdrop clicks do NOT close. Default true. */
  closeOnBackdrop?: boolean;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export const Modal = ({
  open,
  title,
  children,
  onClose,
  action,
  size = 'md',
  closeOnBackdrop = true,
}: ModalProps) => {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !dialogRef.current) return;

      const focusables = dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (e.shiftKey) {
        if (active === first || !dialogRef.current.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last || !dialogRef.current.contains(active)) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown, true);

    const focusTarget =
      dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR) ?? dialogRef.current;
    focusTarget?.focus();

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown, true);
      previouslyFocused.current?.focus?.();
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return createPortal(
    <div
      className={styles.backdrop}
      onClick={closeOnBackdrop ? onClose : undefined}
      data-testid="modal-backdrop"
    >
      <div
        ref={dialogRef}
        className={`${styles.modal} ${styles[size]} fade-in`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className={styles.header}>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close modal">
            <IconClose size={20} />
          </button>
        </div>
        <div className={styles.content}>{children}</div>
        {action && <div className={styles.footer}>{action}</div>}
      </div>
    </div>,
    document.body,
  );
};
