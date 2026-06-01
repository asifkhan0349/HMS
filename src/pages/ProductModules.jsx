import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { getProductModule, productModules } from '../data/productModules';

const ProductCard = ({ product }) => (
  <div className="col-12 col-md-6 col-xl-4">
    <div className="glass-card p-4 h-100 d-flex flex-column">
      <div className="d-flex align-items-start justify-content-between mb-4">
        <div
          className="rounded-3 d-flex align-items-center justify-content-center"
          style={{ width: 52, height: 52, background: 'var(--accents-1)', border: '1px solid var(--accents-2)' }}
        >
          <i className={`${product.icon} fs-4 text-primary`} aria-hidden="true"></i>
        </div>
        <span className={`badge ${product.status === 'Live core' ? 'text-bg-primary' : 'text-bg-light'} border`}>
          {product.status}
        </span>
      </div>
      <h5 className="fw-bold mb-2">{product.title}</h5>
      <p className="text-muted small flex-grow-1">{product.summary}</p>
      <div className="d-flex flex-wrap gap-2 mb-4">
        {product.metrics.map((metric) => (
          <span key={metric} className="badge rounded-pill text-bg-light border fw-semibold">
            {metric}
          </span>
        ))}
      </div>
      <Link to={`/products/${product.id}`} className="btn btn-outline-primary btn-sm align-self-start">
        Open Module
      </Link>
    </div>
  </div>
);

const ProductDetail = ({ product }) => (
  <div className="glass-card p-4">
    <div className="d-flex flex-column flex-lg-row justify-content-between gap-4 mb-4">
      <div>
        <div className="d-flex align-items-center gap-3 mb-3">
          <i className={`${product.icon} fs-2 text-primary`} aria-hidden="true"></i>
          <div>
            <h2 className="fw-bold mb-1">{product.title}</h2>
            <span className="badge text-bg-light border">{product.status}</span>
          </div>
        </div>
        <p className="text-muted mb-0">{product.summary}</p>
      </div>
      <Link to="/products" className="btn btn-glass align-self-start">
        <i className="bi bi-grid me-2" aria-hidden="true"></i>
        All Products
      </Link>
    </div>

    <div className="row g-4">
      <div className="col-lg-6">
        <h5 className="fw-bold mb-3">Operational Metrics</h5>
        <div className="list-group">
          {product.metrics.map((metric) => (
            <div key={metric} className="list-group-item d-flex align-items-center justify-content-between">
              <span>{metric}</span>
              <span className="badge text-bg-light border">Tracked</span>
            </div>
          ))}
        </div>
      </div>
      <div className="col-lg-6">
        <h5 className="fw-bold mb-3">Connected Workflows</h5>
        <div className="d-flex flex-wrap gap-2">
          {product.routes.map((route) => (
            <Link key={route} to={route} className="btn btn-outline-primary btn-sm">
              {route}
            </Link>
          ))}
        </div>
        <div className="alert alert-info mt-4 mb-0">
          This module reuses live HMS workflows first, then can be expanded with dedicated ERP or consumer-order records as the product matures.
        </div>
      </div>
    </div>
  </div>
);

const ProductModules = () => {
  const { productId } = useParams();
  const selectedProduct = productId ? getProductModule(productId) : null;

  return (
    <main className="p-4">
      {!selectedProduct ? (
        <>
          <div className="mb-5">
            <h2 className="fw-bold mb-1">HMS Product Modules</h2>
            <p className="text-muted mb-0">
              Product-specific workspaces aligned with the public HMS suite claim.
            </p>
          </div>
          <div className="row g-4">
            {productModules.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </>
      ) : (
        <ProductDetail product={selectedProduct} />
      )}
    </main>
  );
};

export default ProductModules;
