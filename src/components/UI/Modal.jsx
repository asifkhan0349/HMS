import React, { useEffect, useId, useRef } from 'react';

const Modal = ({ isOpen, onClose, title, children }) => {
  const dialogRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (isOpen && dialogRef.current) {
      const focusableSelector = [
        'button:not([disabled])',
        '[href]',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
      ].join(', ');

      const getFocusableElements = () =>
        Array.from(dialogRef.current.querySelectorAll(focusableSelector)).filter(
          (element) => !element.hasAttribute('hidden') && element.getAttribute('aria-hidden') !== 'true'
        );

      const focusableElements = getFocusableElements();
      focusableElements[0]?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !dialogRef.current) {
      return undefined;
    }

    const previousActiveElement = document.activeElement;
    const focusableSelector = [
      'button:not([disabled])',
      '[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    const getFocusableElements = () =>
      Array.from(dialogRef.current.querySelectorAll(focusableSelector)).filter(
        (element) => !element.hasAttribute('hidden') && element.getAttribute('aria-hidden') !== 'true'
      );

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== 'Tab') return;

      const items = getFocusableElements();
      if (items.length === 0) {
        event.preventDefault();
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (previousActiveElement instanceof HTMLElement) {
        previousActiveElement.focus();
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        ref={dialogRef}
        className="premium-card w-100 mx-3 d-flex flex-column"
        style={{
          maxWidth: '560px',
          maxHeight: '85vh',
          overflow: 'hidden',

        }}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="px-5 py-4 border-bottom d-flex justify-content-between align-items-center flex-shrink-0" style={{ borderColor: 'var(--accents-2)' }}>
          <h5 id={titleId} className="mb-0 fw-bold d-flex align-items-center gap-2" style={{ color: 'var(--geist-foreground)' }}>
            <i className="bi bi-file-earmark-plus" style={{ color: 'var(--primary)' }} />
            {title}
          </h5>
          <button
            type="button"
            className="btn btn-glass btn-sm d-flex align-items-center justify-content-center"
            onClick={onClose}
            style={{ width: '32px', height: '32px', padding: 0 }}
            aria-label={`Close ${title}`}
          >
            <i className="bi bi-x-lg" style={{ fontSize: '0.75rem' }} />
          </button>
        </div>
        <div className="p-5 overflow-y-auto flex-grow-1" style={{ color: 'var(--geist-foreground)' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
