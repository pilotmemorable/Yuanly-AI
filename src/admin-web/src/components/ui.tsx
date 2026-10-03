import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

import type { Pagination } from '../api';
import type { BadgeTone } from '../utils';

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ');
}

export function Badge({ label, tone = 'neutral' }: { label: ReactNode; tone?: BadgeTone }): JSX.Element {
  return <span className={cx('badge', `tone-${tone}`)}>{label}</span>;
}

export function LoadingState({ label = 'Yükleniyor…' }: { label?: string }): JSX.Element {
  return (
    <div className="state-card">
      <div className="spinner" aria-hidden="true" />
      <p>{label}</p>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}): JSX.Element {
  return (
    <div className="state-card empty-state">
      <h3>{title}</h3>
      <p>{description}</p>
      {action ? <div className="state-action">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}): JSX.Element {
  return (
    <div className="state-card error-state">
      <h3>Bir sorun oluştu</h3>
      <p>{message}</p>
      {onRetry ? (
        <button className="button button-secondary" type="button" onClick={onRetry}>
          Tekrar dene
        </button>
      ) : null}
    </div>
  );
}

export function InlineNotice({
  title,
  description,
  tone = 'info',
}: {
  title: string;
  description?: ReactNode;
  tone?: BadgeTone;
}): JSX.Element {
  return (
    <div className={cx('inline-notice', `tone-${tone}`)}>
      <strong>{title}</strong>
      {description ? <div>{description}</div> : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}): JSX.Element {
  return (
    <article className="card stat-card">
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value}</strong>
      {detail ? <p className="stat-detail">{detail}</p> : null}
    </article>
  );
}

export function Modal({
  open,
  title,
  onClose,
  children,
  footer,
  size = 'md',
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}): JSX.Element | null {
  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div className={cx('modal', `modal-${size}`)} onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-header">
          <div>
            <h2>{title}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Kapat">
            ×
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer ? <div className="modal-footer">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  );
}

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = 'Onayla',
  cancelLabel = 'Vazgeç',
  tone = 'danger',
  busy = false,
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: BadgeTone;
  busy?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}): JSX.Element | null {
  const confirmClass = tone === 'danger' ? 'button button-danger' : 'button button-primary';

  return (
    <Modal
      open={open}
      title={title}
      onClose={busy ? () => undefined : onClose}
      size="sm"
      footer={
        <>
          <button className="button button-secondary" type="button" onClick={onClose} disabled={busy}>
            {cancelLabel}
          </button>
          <button className={confirmClass} type="button" onClick={onConfirm} disabled={busy}>
            {busy ? 'İşleniyor…' : confirmLabel}
          </button>
        </>
      }
    >
      <div className="stack-sm">{description}</div>
    </Modal>
  );
}

export function PaginationControls({
  pagination,
  onPageChange,
}: {
  pagination: Pagination;
  onPageChange: (page: number) => void;
}): JSX.Element | null {
  if (pagination.pages <= 1) return null;

  const pages: number[] = [];
  for (let page = 1; page <= pagination.pages; page += 1) {
    if (
      page === 1 ||
      page === pagination.pages ||
      Math.abs(page - pagination.page) <= 1
    ) {
      pages.push(page);
    }
  }

  return (
    <div className="pagination-bar">
      <p>
        Toplam <strong>{pagination.total}</strong> kayıt · Sayfa {pagination.page}/{pagination.pages}
      </p>
      <div className="pagination-buttons">
        <button
          className="button button-secondary button-small"
          type="button"
          disabled={pagination.page <= 1}
          onClick={() => onPageChange(pagination.page - 1)}
        >
          Önceki
        </button>
        {pages.map((page) => (
          <button
            key={page}
            className={cx('button button-secondary button-small', page === pagination.page && 'is-active')}
            type="button"
            onClick={() => onPageChange(page)}
          >
            {page}
          </button>
        ))}
        <button
          className="button button-secondary button-small"
          type="button"
          disabled={pagination.page >= pagination.pages}
          onClick={() => onPageChange(pagination.page + 1)}
        >
          Sonraki
        </button>
      </div>
    </div>
  );
}

type ToastItem = {
  id: string;
  title: string;
  description?: string;
  tone: BadgeTone;
};

type ToastInput = Omit<ToastItem, 'id'>;

type ToastContextValue = {
  addToast: (toast: ToastInput) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }): JSX.Element {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Record<string, number>>({});

  const removeToast = useCallback((id: string) => {
    const timer = timers.current[id];
    if (timer) {
      window.clearTimeout(timer);
      delete timers.current[id];
    }
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback(
    (toast: ToastInput) => {
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      setToasts((current) => [...current, { ...toast, id }]);
      timers.current[id] = window.setTimeout(() => removeToast(id), 4200);
    },
    [removeToast],
  );

  useEffect(() => {
    return () => {
      Object.values(timers.current).forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  const value = useMemo(() => ({ addToast }), [addToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div className="toast-stack" aria-live="polite" aria-atomic="true">
          {toasts.map((toast) => (
            <div key={toast.id} className={cx('toast', `tone-${toast.tone}`)}>
              <div>
                <strong>{toast.title}</strong>
                {toast.description ? <p>{toast.description}</p> : null}
              </div>
              <button className="icon-button" type="button" onClick={() => removeToast(toast.id)} aria-label="Bildirimi kapat">
                ×
              </button>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

export function CopyBox({
  title,
  value,
  onCopy,
}: {
  title: string;
  value: string;
  onCopy: () => void;
}): JSX.Element {
  return (
    <div className="credential-box">
      <div className="credential-header">
        <strong>{title}</strong>
        <button className="button button-secondary button-small" type="button" onClick={onCopy}>
          Kopyala
        </button>
      </div>
      <pre>{value}</pre>
    </div>
  );
}
