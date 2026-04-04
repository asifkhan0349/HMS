import React, { useMemo, useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { reportsApi, downloadCsv } from '../lib/api';
import { Skeleton } from 'boneyard-js/react';

const formatTimestamp = (date) =>
  new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);

const Reports = () => {
  const { showToast } = useApp();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    reportsApi.getStats().then(setStats).catch(() => showToast('Failed to load reports.'));
  }, [showToast]);

  const reports = useMemo(() => {
    // Provide a mocked stats object so that the layout renders for boneyard
    const realStats = stats || { appointmentsCount: 0, revenue: 0, lowStockCount: 0, doctorCount: 0 };
    const now = new Date();

    return [
      {
        id: 'operational',
        title: `OPD Daily Report (${realStats.appointmentsCount || 0} Appointments)`,
        category: 'Operational',
        lastGen: formatTimestamp(now),
        icon: 'bi-clipboard2-pulse',
      },
      {
        id: 'financial',
        title: `Pharmacy & Billing Summary (${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(realStats.revenue || 0)})`,
        category: 'Financial',
        lastGen: formatTimestamp(now),
        icon: 'bi-cash-stack',
      },
      {
        id: 'inventory',
        title: `Inventory Stock Level (${realStats.lowStockCount || 0} Alerts)`,
        category: 'Inventory',
        lastGen: formatTimestamp(now),
        icon: 'bi-box-seam',
      },
      {
        id: 'performance',
        title: `Consultation Efficiency (${realStats.doctorCount || 0} Doctors Active)`,
        category: 'Performance',
        lastGen: formatTimestamp(now),
        icon: 'bi-speedometer2',
      },
    ];
  }, [stats]);

  const advisory = useMemo(() => {
    if (!stats) return { title: 'Loading...', text: 'Analyzing...', action: 'Wait' };

    const { activePatients, pendingLabs, lowStockCount: lowStock } = stats;

    if (activePatients === 0 && pendingLabs === 0 && lowStock === 0) {
      return {
        title: 'GEN-AI STRATEGIC ADVISORY',
        text: 'Hospital data systems are currently in a fresh state. Historical and live analytics will populate this advisory once clinical operations commence.',
        action: 'Review Setup Guide',
      };
    }

    if (pendingLabs >= lowStock && pendingLabs >= activePatients && pendingLabs > 0) {
      return {
        title: 'GEN-AI STRATEGIC ADVISORY',
        text: `Diagnostics load is elevated with ${pendingLabs} active lab workflows. Consider assigning additional clinician review capacity to reduce turnaround time.`,
        action: 'Review Diagnostics Capacity',
      };
    }

    if (lowStock >= activePatients && lowStock > 0) {
      return {
        title: 'GEN-AI STRATEGIC ADVISORY',
        text: `${lowStock} inventory items are flagged for low stock. Prioritize procurement and replenishment planning before throughput is affected.`,
        action: 'Open Inventory Readiness',
      };
    }

    return {
      title: 'GEN-AI STRATEGIC ADVISORY',
      text: `${activePatients || 0} admitted patients are currently active. Staffing and diagnostic capacity are within acceptable limits, but continued inpatient monitoring is recommended.`,
      action: 'Review Admission Trends',
    };
  }, [stats]);

  return (
    <div className="reports-page">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-0">Reports & Analytics</h2>
          <p className="text-muted mb-0">Hospital operational analytics generated from live backend data.</p>
        </div>
        <button
          className="btn btn-outline-primary px-3 py-2 rounded-3"
          onClick={() => {
            if (!stats) { showToast('Data is still loading, please wait.', 'warning'); return; }
            const rows = [
              { Report: 'OPD Daily', Appointments: stats.appointmentsCount },
              { Report: 'Billing Summary', Revenue_INR: stats.revenue },
              { Report: 'Inventory Alerts', LowStockItems: stats.lowStockCount },
              { Report: 'Staffing', Doctors: stats.doctorCount, TotalStaff: stats.staffCount, OnLeave: stats.staffOnLeave },
              { Report: 'Lab', PendingLabs: stats.pendingLabs },
              { Report: 'Patients', ActivePatients: stats.activePatients },
            ];
            downloadCsv(rows, 'hms_reports_summary.csv');
            showToast('Report downloaded as hms_reports_summary.csv');
          }}
        >
          <i className="bi bi-cloud-download me-2"></i>Download All
        </button>
      </div>

      <Skeleton name="reports-grid" loading={!stats}>
      <div className="row g-4 mb-5">
        {reports.map((report) => (
          <div key={report.id} className="col-md-6">
            <div className="glass-card p-4 d-flex align-items-center justify-content-between h-100">
              <div className="d-flex align-items-center">
                <div
                  className="bg-primary bg-opacity-10 rounded-4 d-flex align-items-center justify-content-center me-4"
                  style={{ width: '64px', height: '64px' }}
                >
                  <i className={`bi fs-2 text-primary ${report.icon}`}></i>
                </div>
                <div>
                  <small className="text-muted">{report.lastGen}</small>
                  <small
                    className="text-uppercase text-accent fw-bold"
                    style={{ fontSize: '0.65rem', letterSpacing: '2px', color: 'var(--accent-color)' }}
                  >
                    {report.category}
                  </small>
                  <h5 className="fw-bold mt-1 mb-2 gradient-text">{report.title}</h5>
                  <p className="text-muted mb-0 small opacity-75">
                    <i className="bi bi-clock-history me-1"></i> Last Generated: {report.lastGen}
                  </p>
                </div>
              </div>
              <button
                className="btn btn-primary btn-sm px-3 rounded-3 shadow-none py-2"
                onClick={() => showToast(`Synchronizing backend analytics for ${report.title}...`)}
              >
                RUN SYNC <i className="bi bi-arrow-right ms-1"></i>
              </button>
            </div>
          </div>
        ))}
      </div>
      </Skeleton>

      <Skeleton name="reports-advisory" loading={!stats}>
      <div
        className="glass-card p-4 border-start border-4 border-accent shadow-lg"
        style={{ borderLeftColor: 'var(--accent-color) !important' }}
      >
        <div className="row align-items-center">
          <div className="col-md-1 d-none d-md-block text-center">
            <div
              className="bg-accent bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center p-3"
              style={{ background: 'rgba(96, 239, 255, 0.1)' }}
            >
              <i className="bi bi-cpu text-accent fs-3" style={{ color: 'var(--accent-color)' }}></i>
            </div>
          </div>
          <div className="col-md-8 ps-md-4">
            <h6 className="fw-bold mb-1">{advisory.title}</h6>
            <p className="text-muted mb-0 small">{advisory.text}</p>
          </div>
          <div className="col-md-3 text-md-end mt-3 mt-md-0">
            <button
              className="btn btn-primary btn-sm px-4"
              onClick={() => showToast(`Executing strategic action: ${advisory.action}.`)}
            >
              {advisory.action}
            </button>
          </div>
        </div>
      </div>
      </Skeleton>
    </div>
  );
};

export default Reports;
