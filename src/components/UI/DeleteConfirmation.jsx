import React from 'react';
import Modal from './Modal';

const DeleteConfirmation = ({ isOpen, onClose, onConfirm, itemName, itemType = 'record' }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirm Deletion">
      <div className="text-center py-3">
        <div className="d-flex align-items-center justify-content-center mb-4" style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.08)', margin: '0 auto' }}>
          <i className="bi bi-exclamation-triangle" style={{ fontSize: '1.75rem', color: 'var(--error)' }} />
        </div>
        <h5 className="fw-bold mb-3" style={{ color: 'var(--geist-foreground)' }}>Delete {itemType}?</h5>
        <p className="text-muted mb-4" style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>
          Are you sure you want to permanently delete <strong>{itemName}</strong>? This action cannot be undone.
        </p>
        <div className="d-flex gap-3">
          <button
            type="button"
            className="btn btn-glass flex-fill py-2"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-danger flex-fill py-2"
            onClick={onConfirm}
          >
            Confirm Delete
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteConfirmation;
