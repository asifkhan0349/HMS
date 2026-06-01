import React, { useState, useMemo, useCallback } from 'react';
import { useApp, mapPatientFromApi, formatDate } from '../context/AppContext';
import { useCrud } from '../hooks/useCrud';
import { cashReceiptsApi, patientsApi } from '../lib/api';
import EmptyState from '../components/UI/EmptyState';
import Pagination from '../components/UI/Pagination';
import { Skeleton } from 'boneyard-js/react';
import { usePagination } from '../hooks/usePagination';

const mapReceiptFromApi = (receipt) => ({
  id: receipt.id,
  invoiceCode: receipt.invoice_code,
  patientName: receipt.patient_name,
  amountPaid: Number(receipt.amount_paid || 0),
  paymentDate: receipt.payment_date,
});

const formatReceiptDateTime = (isoString) => {
  if (!isoString) return '-';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;

  // Format date part
  const formattedDate = formatDate(isoString);

  // Format time part in 12-hour format with AM/PM
  const formattedTime = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return `${formattedDate} at ${formattedTime}`;
};

const CashReceipts = () => {
  const { showToast } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch receipts and patients data using custom hooks
  const { data: receipts = [], loading } = useCrud(cashReceiptsApi, mapReceiptFromApi);
  const { data: patients = [] } = useCrud(patientsApi, mapPatientFromApi);

  const getPatientId = useCallback((patientName) => {
    if (!patientName) return '-';
    const patient = patients.find(p => p.name?.trim().toLowerCase() === patientName.trim().toLowerCase());
    return patient ? patient.id : '-';
  }, [patients]);

  const filteredReceipts = useMemo(() => {
    return receipts.filter(receipt => {
      const pId = String(getPatientId(receipt.patientName));
      const matchSearch = receipt.patientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
              pId.includes(searchTerm) || 
              String(receipt.id).includes(searchTerm);
      return matchSearch;
    });
  }, [receipts, searchTerm, getPatientId]);

  const {
    paginatedData: paginatedReceipts,
    currentPage,
    totalPages,
    rowsPerPage,
    totalItems,
    onPageChange,
    onRowsPerPageChange
  } = usePagination(filteredReceipts);

  // Summary Metrics calculations
  const totalCashReceived = useMemo(() => {
    return receipts.reduce((sum, r) => sum + r.amountPaid, 0);
  }, [receipts]);

  const todayCashReceived = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    return receipts
      .filter(r => r.paymentDate && r.paymentDate.slice(0, 10) === todayStr)
      .reduce((sum, r) => sum + r.amountPaid, 0);
  }, [receipts]);

  return (
    <main className="cash-receipts-page p-4">
      <div className="d-flex justify-content-between align-items-center mb-5">
        <div>
          <h2 className="fw-bold mb-1">Cash Receipts Ledger</h2>
          <p className="text-muted mb-0">Monitor cash inflows, partial payments, and financial receipts.</p>
        </div>
      </div>

      <div className="row g-4 mb-5">
        <div className="col-md-6 col-lg-4">
          <div className="glass-card p-4 border d-flex justify-content-between align-items-center" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(16, 185, 129, 0.02) 100%)', borderColor: 'rgba(16, 185, 129, 0.15)' }}>
            <div>
              <p className="text-muted fw-bold small text-uppercase mb-2" style={{ letterSpacing: '0.5px' }}>Total Cash Receipts</p>
              <h3 className="fw-bold mb-0 text-success" style={{ fontVariantNumeric: 'tabular-nums' }}>
                ₹{totalCashReceived.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="rounded-circle p-3 d-flex align-items-center justify-content-center" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', width: '56px', height: '56px' }}>
              <i className="bi bi-wallet2 fs-4"></i>
            </div>
          </div>
        </div>
        <div className="col-md-6 col-lg-4">
          <div className="glass-card p-4 border d-flex justify-content-between align-items-center" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(59, 130, 246, 0.02) 100%)', borderColor: 'rgba(59, 130, 246, 0.15)' }}>
            <div>
              <p className="text-muted fw-bold small text-uppercase mb-2" style={{ letterSpacing: '0.5px' }}>Today's Receipts</p>
              <h3 className="fw-bold mb-0 text-primary" style={{ fontVariantNumeric: 'tabular-nums' }}>
                ₹{todayCashReceived.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="rounded-circle p-3 d-flex align-items-center justify-content-center" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', width: '56px', height: '56px' }}>
              <i className="bi bi-calendar-check fs-4"></i>
            </div>
          </div>
        </div>
        <div className="col-md-12 col-lg-4">
          <div className="glass-card p-4 border d-flex justify-content-between align-items-center" style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(245, 158, 11, 0.02) 100%)', borderColor: 'rgba(245, 158, 11, 0.15)' }}>
            <div>
              <p className="text-muted fw-bold small text-uppercase mb-2" style={{ letterSpacing: '0.5px' }}>Transaction Volume</p>
              <h3 className="fw-bold mb-0 text-warning" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {receipts.length} Payments
              </h3>
            </div>
            <div className="rounded-circle p-3 d-flex align-items-center justify-content-center" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', width: '56px', height: '56px' }}>
              <i className="bi bi-receipt fs-4"></i>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card p-0 overflow-hidden border">
        <div className="p-4 border-bottom d-flex justify-content-between align-items-center" style={{ background: 'var(--accents-1)' }}>
          <h6 className="fw-bold mb-0">Payments Stream</h6>
          <div className="d-flex gap-3 align-items-center">
            <div className="input-group input-group-sm" style={{ width: '250px' }}>
              <span className="input-group-text bg-transparent border-end-0 border-accents-2 opacity-50"><i className="bi bi-search" aria-hidden="true"></i></span>
              <input 
                type="text" 
                className="form-control border-start-0 ps-0" 
                placeholder="Search name, invoice, or ID…" 
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  onPageChange(1);
                }}
              />
            </div>
          </div>
        </div>

        <Skeleton name="receipts-table" loading={loading}>
          <div className="table-responsive">
            <table className="table table-hover mb-0 align-middle">
              <thead>
                <tr>
                  <th className="px-4 py-3">Receipt ID</th>
                  <th className="py-3">Patient ID</th>
                  <th className="py-3">Patient Name</th>
                  <th className="py-3">Amount Paid</th>
                  <th className="py-3">Payment Date & Time</th>
                </tr>
              </thead>
              <tbody>
                {receipts.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-0">
                      <EmptyState 
                        icon="bi-cash-coin"
                        title="No Cash Receipts"
                        description="No payment transactions have been logged yet."
                      />
                    </td>
                  </tr>
                ) : paginatedReceipts.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-0">
                      <EmptyState 
                        icon="bi-search"
                        title="No Matching Transactions"
                        description={`No receipts matched your search for "${searchTerm}".`}
                        actionText="Clear Search"
                        onAction={() => { setSearchTerm(''); onPageChange(1); }}
                      />
                    </td>
                  </tr>
                ) : (
                  paginatedReceipts.map((receipt) => (
                    <tr key={receipt.id}>
                      <td className="px-4 py-4 fw-bold" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {receipt.id}
                      </td>
                      <td className="py-4 text-muted small" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {getPatientId(receipt.patientName)}
                      </td>
                      <td className="py-4 fw-bold">{receipt.patientName}</td>
                      <td className="py-4 text-success fw-bold" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        ₹{receipt.amountPaid.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 text-muted small">
                        {formatReceiptDateTime(receipt.paymentDate)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Skeleton>

        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={onRowsPerPageChange}
          totalItems={totalItems}
        />
      </div>
    </main>
  );
};

export default CashReceipts;
