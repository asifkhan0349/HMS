import React from 'react';

const EmptyState = ({ icon, title, description, actionText, onAction }) => {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center py-5 px-4 text-center">
      <div 
        className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center mb-4"
        style={{ width: '80px', height: '80px' }}
      >
        <i className={`bi ${icon} fs-1 text-primary opacity-75`}></i>
      </div>
      <h4 className="fw-bold mb-2">{title}</h4>
      <p className="text-muted mb-4 max-w-md mx-auto" style={{ maxWidth: '400px' }}>
        {description}
      </p>
      {actionText && onAction && (
        <button 
          className="btn btn-primary px-4 py-2 rounded-3 shadow-sm"
          onClick={onAction}
        >
          <i className="bi bi-plus-lg me-2"></i>
          {actionText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
