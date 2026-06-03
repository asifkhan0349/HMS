import React from 'react';

const EmptyState = ({ icon, title, description, actionText, onAction }) => {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center py-5 px-4 text-center">
      <div className="empty-state-icon">
        <i className={`bi ${icon} fs-1`} style={{ color: 'var(--primary)', opacity: 0.6 }} />
      </div>
      <h5 className="fw-bold mb-2" style={{ color: 'var(--geist-foreground)' }}>{title}</h5>
      <p className="text-muted mb-4" style={{ maxWidth: '420px', fontSize: '0.9rem', lineHeight: 1.6 }}>
        {description}
      </p>
      {actionText && onAction && (
        <button
          className="btn btn-primary px-4 py-2"
          onClick={onAction}
        >
          <i className="bi bi-plus-lg me-2" />
          {actionText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
