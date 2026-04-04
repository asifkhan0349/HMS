import React, { memo, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { dashboardApi } from '../lib/api';
import EmptyState from '../components/UI/EmptyState';
import { Skeleton } from 'boneyard-js/react';
import { SkeletonStatCard } from '../components/UI/SkeletonShimmer';


const StatCard = memo(({ stat }) => {
  const { showToast } = useApp();
  const isPositive = stat.trend.includes('+') || /\b(Live|Staff|Bills|Labs)\b/.test(stat.trend);

  return (
    <div
      className="col-md-3"
      onClick={() => showToast(`Telemetry Insight: ${stat.title} is currently ${stat.trend}`)}
      style={{ cursor: 'pointer' }}
    >
      <div className="glass-card p-4 stat-card h-100">
        <div className="d-flex justify-content-between mb-3 align-items-start">
          <div
            className="stat-icon-wrapper rounded-3 d-flex align-items-center justify-content-center shadow-sm"
            style={{ 
              background: 'var(--accents-1)', 
              border: '1px solid var(--accents-2)',
              width: '56px',
              height: '56px',
              fontSize: '1.75rem'
            }}
          >
            <i
              className={stat.icon}
              aria-hidden="true"
              style={{ color: stat.color === 'danger' ? 'var(--geist-error)' : 'var(--geist-success)' }}
            ></i>
          </div>
          <span
            className="badge rounded-pill h-25 px-2 py-1"
            style={{
              fontSize: '0.75rem',
              fontWeight: '600',
              background: isPositive ? 'rgba(0, 112, 243, 0.1)' : 'rgba(238, 0, 0, 0.1)',
              color: isPositive ? 'var(--geist-success)' : 'var(--geist-error)',
              border: `1px solid ${isPositive ? 'rgba(0, 112, 243, 0.2)' : 'rgba(238, 0, 0, 0.2)'}`,
            }}
          >
            {stat.trend}
          </span>
        </div>
        <h3 className="fw-bold mb-1 fs-2 mt-2" style={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
          {stat.value}
        </h3>
        <p className="text-muted mb-0 fw-semibold text-uppercase" style={{ letterSpacing: '0.05em', fontSize: '0.75rem' }}>
          {stat.title}
        </p>
      </div>
    </div>
  );
});

const QueueItem = memo(({ app }) => {
  const { showToast } = useApp();
  const [timePart = '', meridiem = ''] = typeof app?.time === 'string' ? app.time.split(' ') : ['-', ''];

  return (
    <div className="list-group-item bg-transparent border-0 p-0 mb-2">
      <div
        className="d-flex align-items-center p-3 rounded-3"
        style={{
          background: 'var(--geist-background)',
          border: '1px solid var(--accents-2)',
          cursor: 'pointer',
        }}
        onClick={() => showToast(`Reviewing status for: ${app.patient}`)}
      >
        <div className="text-center me-3" style={{ minWidth: '60px' }}>
          <span
            className="d-block fw-bold"
            style={{ color: 'var(--geist-foreground)', fontSize: '0.9rem', fontVariantNumeric: 'tabular-nums' }}
          >
            {timePart}
          </span>
          <span className="d-block text-muted" style={{ fontSize: '0.65rem' }}>
            {meridiem}
          </span>
        </div>
        <div className="flex-grow-1 overflow-hidden">
          <h6 className="mb-0 fw-bold text-truncate">{app.patient}</h6>
          <small className="text-muted d-block text-truncate">
            {app.doctor}{' '}
            <span className="fw-bold" style={{ color: app.status === 'In Progress' ? 'var(--geist-success)' : 'var(--accents-5)' }}>
              {app.status}
            </span>
          </small>
        </div>
      </div>
    </div>
  );
});

const Dashboard = () => {
  const navigate = useNavigate();
  const { showToast } = useApp();
  const [statsData, setStatsData] = React.useState(null);

  React.useEffect(() => {
    dashboardApi.getStats().then(setStatsData).catch(() => showToast('Failed to load dashboard metrics.'));
  }, [showToast]);

  const queueData = statsData?.queue || [];

  const stats = useMemo(() => {
    if (!statsData) return [];

    return [
      {
        title: 'Active Admissions',
        value: String(statsData.activeAdmissions).padStart(2, '0'),
        icon: 'bi bi-hospital',
        color: 'primary',
        trend: '+Live',
      },
      {
        title: 'Critical Alerts',
        value: String(statsData.criticalAlerts).padStart(2, '0'),
        icon: 'bi bi-activity',
        color: 'danger',
        trend: `${statsData.testsCount} Labs`,
      },
      {
        title: 'Total Patients',
        value: String(statsData.totalPatients).padStart(2, '0'),
        icon: 'bi bi-people-fill',
        color: 'success',
        trend: `${statsData.staffCount} Staff`,
      },
      {
        title: 'Monthly Revenue',
        value: new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          maximumFractionDigits: 0,
        }).format(statsData.totalRevenue),
        icon: 'bi bi-currency-rupee',
        color: 'accent',
        trend: `${statsData.invoicesCount} Bills`,
      },
    ];
  }, [statsData]);

  return (
    <main className="dashboard-page p-4">
      <div className="d-flex justify-content-between align-items-center mb-5">
        <div>
          <h2 className="fw-bold mb-1">Clinical Operations Center</h2>
          <p className="text-muted mb-0">Monitor hospital activity and manage patient workflows.</p>
        </div>
        <div className="d-flex gap-2">
          <button
            className="btn btn-glass px-4 py-2 border d-flex align-items-center"
            onClick={async () => {
              if (!statsData) { showToast('Data is still loading.', 'warning'); return; }
              try {
                const { jsPDF } = await import('jspdf');
                const { default: autoTable } = await import('jspdf-autotable');

                const doc = new jsPDF();

                // Branding header
                doc.setFontSize(22);
                doc.setTextColor(0, 112, 243);
                doc.text('HMS ELITE — CLINICAL OPERATIONS', 14, 22);

                doc.setFontSize(10);
                doc.setTextColor(100);
                doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
                doc.setDrawColor(0, 112, 243);
                doc.line(14, 34, 196, 34);

                // Operational metrics table
                autoTable(doc, {
                  startY: 40,
                  head: [['Operational Metric', 'Current Value']],
                  body: [
                    ['Active Admissions',   String(statsData.activeAdmissions)],
                    ['Critical Alerts',     String(statsData.criticalAlerts)],
                    ['Total Patients',      String(statsData.totalPatients)],
                    ['Clinical Staff',      String(statsData.staffCount)],
                    ['Active Lab Tests',    String(statsData.testsCount)],
                    ['Total Invoices',      String(statsData.invoicesCount)],
                    ['Revenue (INR)',       new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(statsData.totalRevenue)],
                  ],
                  theme: 'striped',
                  headStyles: { fillColor: [0, 112, 243] },
                });

                // Appointment queue
                if (statsData.queue && statsData.queue.length > 0) {
                  autoTable(doc, {
                    startY: doc.lastAutoTable.finalY + 15,
                    head: [['Time', 'Patient', 'Clinician', 'Status']],
                    body: statsData.queue.map(a => [a.time, a.patient, a.doctor || '—', a.status]),
                    theme: 'grid',
                    headStyles: { fillColor: [60, 60, 60] },
                  });
                }

                doc.save('HMS_Dashboard_Report.pdf');
                showToast('✓ PDF report downloaded successfully!');
              } catch (err) {
                console.error('PDF export failed:', err);
                showToast('PDF generation failed. Please try again.', 'error');
              }
            }}
          >
            <i className="bi bi-download me-2" aria-hidden="true"></i>
            Export Report
          </button>
          <button className="btn btn-primary px-4 py-2 d-flex align-items-center" onClick={() => navigate('/patients')}>
            <i className="bi bi-plus-lg me-2" aria-hidden="true"></i>
            Add Patient
          </button>
        </div>
      </div>

      {!statsData ? (
        <div className="row g-4 mb-5" role="status" aria-label="Loading dashboard metrics...">
          {[0, 1, 2, 3].map((i) => (
            <div className="col-md-3" key={i}>
              <SkeletonStatCard />
            </div>
          ))}
        </div>
      ) : (
        <div className="row g-4 mb-5">
          {stats.map((stat) => (
            <StatCard key={stat.title} stat={stat} />
          ))}
        </div>
      )}

      <div className="row g-4">
        <div className="col-lg-8">
          <div className="glass-card p-4 h-100">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="fw-bold mb-0">Department Performance</h5>
              <div className="dropdown">
                <button className="btn btn-sm btn-glass py-1 px-3 d-flex align-items-center" type="button">
                  Last 7 Days <i className="bi bi-chevron-down ms-2 small" aria-hidden="true"></i>
                </button>
              </div>
            </div>
            <div
              className="rounded-3 d-flex align-items-center justify-content-center overflow-hidden"
              style={{ height: '320px', background: 'var(--accents-1)', border: '1px dashed var(--accents-2)' }}
            >
              <EmptyState 
                icon="bi-cpu"
                title="Telemetry Unavailable"
                description="Live clinical telemetry data will appear here once analytics sensors are synchronized."
              />
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="glass-card p-4 h-100">
            <h5 className="fw-bold mb-4">Live Medical Queue</h5>
            <Skeleton name="dashboard-queue" loading={!statsData}>
              <div className="list-group list-group-flush gap-2">
                {queueData.length === 0 ? (
                  <EmptyState 
                    icon="bi-calendar2-x"
                    title="Queue Empty"
                    description="No patient appointments are currently queued."
                  />
                ) : queueData.map((app) => (
                  <QueueItem key={app.id} app={app} />
                ))}
              </div>
            </Skeleton>
            <button className="btn btn-glass w-100 mt-4 py-2 fw-semibold" onClick={() => navigate('/appointments')}>
              View All Appointments
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Dashboard;
