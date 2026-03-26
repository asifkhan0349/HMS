import React from 'react';
import Modal from './Modal';

const DeleteConfirmation = ({ isOpen, onClose, onConfirm, itemName, itemType = 'record' }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirm Deletion">
      <div className="text-center py-3">
        <div className="mb-4">
          <i className="bi bi-exclamation-triangle text-danger" style={{ fontSize: '3rem' }}></i>
        </div>
        <h5 className="fw-bold mb-3 text-dark">Delete {itemType}?</h5>
        <p className="text-muted mb-4">
          Are you sure you want to permanently delete <strong>{itemName}</strong>? This action cannot be undone.
        </p>
        <div className="d-flex gap-2">
          <button 
            type="button" 
            className="btn btn-glass w-100 py-2 border text-dark" 
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            type="button" 
            className="btn btn-danger w-100 py-2" 
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
