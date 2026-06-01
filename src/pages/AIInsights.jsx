import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { aiInsightsApi } from '../lib/api';
import EmptyState from '../components/UI/EmptyState';
import { useApp } from '../context/AppContext';

const severityClass = {
  critical: 'text-bg-danger',
  warning: 'text-bg-warning',
  info: 'text-bg-info',
};

const AIInsights = () => {
  const { showToast } = useApp();
  const [insights, setInsights] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const loadInsights = useCallback((shouldReset = true) => {
    if (shouldReset) {
      setErrorMessage('');
      setInsights(null);
    }
    aiInsightsApi.list({ include_health: true })
      .then(setInsights)
      .catch((error) => {
        const message = error.message || 'Failed to load AI insights.';
        setErrorMessage(message);
        setInsights([]);
        showToast(message, 'error');
      });
  }, [showToast]);

  useEffect(() => {
    loadInsights(false);
  }, [loadInsights]);

  const grouped = useMemo(() => {
    const source = insights || [];
    return source.reduce((acc, insight) => {
      acc[insight.module] = acc[insight.module] || [];
      acc[insight.module].push(insight);
      return acc;
    }, {});
  }, [insights]);

  return (
    <main className="p-4">
      <div className="d-flex justify-content-between align-items-start mb-5">
        <div>
          <h2 className="fw-bold mb-1">AI Insights</h2>
          <p className="text-muted mb-0">
            Explainable operational alerts for beds, inventory, lab, pharmacy, and revenue.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-outline-primary"
          onClick={() => {
            loadInsights();
          }}
        >
          <i className="bi bi-arrow-clockwise me-2" aria-hidden="true"></i>
          Refresh
        </button>
      </div>

      {errorMessage ? (
        <div className="alert alert-danger" role="alert">
          <div className="fw-bold mb-1">AI insights could not be loaded.</div>
          <div>{errorMessage}</div>
        </div>
      ) : !insights ? (
        <div className="glass-card p-5" role="status">Analyzing operational data...</div>
      ) : insights.length === 0 ? (
        <EmptyState
          icon="bi-stars"
          title="No Active AI Alerts"
          description="Current operational signals are within the configured rule thresholds."
        />
      ) : (
        <div className="row g-4">
          {Object.entries(grouped).map(([moduleName, moduleInsights]) => (
            <div key={moduleName} className="col-12 col-xl-6">
              <div className="glass-card p-4 h-100">
                <h5 className="fw-bold mb-4">{moduleName}</h5>
                <div className="d-flex flex-column gap-3">
                  {moduleInsights.map((insight) => (
                    <article key={insight.id} className="border rounded-3 p-3">
                      <div className="d-flex justify-content-between gap-3 mb-2">
                        <h6 className="fw-bold mb-0">{insight.title}</h6>
                        <span className={`badge ${severityClass[insight.severity] || 'text-bg-secondary'}`}>
                          {insight.severity}
                        </span>
                      </div>
                      <p className="text-muted small mb-2">{insight.message}</p>
                      <p className="small mb-2"><strong>Recommended action:</strong> {insight.recommendation}</p>
                      <p className="small text-muted mb-0"><strong>Trigger:</strong> {insight.trigger}</p>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
};

export default AIInsights;
