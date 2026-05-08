import React, { useEffect, useId, useRef } from 'react';

const Modal = ({ isOpen, onClose, title, children }) => {
  const dialogRef = useRef(null);
  const titleId = useId();

  // Prevent scrolling when modal is open
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

  // Store latest onClose in a ref to avoid effect re-triggers while keeping it fresh for the listener
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Focus the first element only once when the modal opens
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

  // Handle keyboard events (Escape and Tab-trapping)
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

      if (event.key !== 'Tab') {
        return;
      }

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
    <div 
      className="modal-overlay d-flex align-items-center justify-content-center"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(2, 6, 23, 0.85)',
        backdropFilter: 'blur(12px)',
        zIndex: 3000,
        animation: 'fadeIn 0.3s ease'
      }}
      onClick={onClose}
    >
      <div 
        ref={dialogRef}
        className="glass-card p-0 w-100 mx-3 animate-fade-up d-flex flex-column"
        style={{ maxWidth: '600px', maxHeight: '90vh', overflow: 'hidden', border: '1px solid rgba(45, 212, 191, 0.4)' }}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="p-4 border-bottom border-accents-2 d-flex justify-content-between align-items-center bg-white flex-shrink-0">
          <h4 id={titleId} className="mb-0 fw-bold d-flex align-items-center text-dark">
            <i className="bi bi-file-earmark-plus text-primary me-2"></i>
            {title}
          </h4>
          <button
            type="button"
            className="btn btn-glass btn-sm rounded-circle"
            onClick={onClose}
            style={{ width: '32px', height: '32px', padding: 0 }}
            aria-label={`Close ${title}`}
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
        <div className="p-4 bg-white text-dark overflow-y-auto custom-scrollbar flex-grow-1">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
