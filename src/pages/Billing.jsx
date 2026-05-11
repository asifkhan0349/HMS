import React, { useState, useMemo } from 'react';
import { useApp, mapInvoiceFromApi, mapPatientFromApi, mapMedicineFromApi, createCode } from '../context/AppContext';
import { useCrud } from '../hooks/useCrud';
import { invoicesApi, patientsApi, medicinesApi } from '../lib/api';
import Modal from '../components/UI/Modal';
import EmptyState from '../components/UI/EmptyState';
import DeleteConfirmation from '../components/UI/DeleteConfirmation';
import Pagination from '../components/UI/Pagination';
import { Skeleton } from 'boneyard-js/react';
import { usePagination } from '../hooks/usePagination';

const Billing = () => {
  const { showToast, user } = useApp();
  const isDoctor = user?.role === 'Doctor';
  const isNurse = user?.role === 'Nurse';
  const isReception = user?.role === 'Reception';
  // canOperate: Admin + Reception — create invoices, mark paid/cancelled, download, send email
  const canOperate = !isDoctor && !isNurse;
  // canManage: Admin only — can also edit and delete invoices
  const canManage = canOperate && !isReception;
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const { 
    data: invoices, 
    loading, 
    addData: addInvoice,
    updateData: updateInvoice,
    removeData: deleteInvoice,
    loadData: loadInvoices
  } = useCrud(invoicesApi, mapInvoiceFromApi);
  
  const [searchTerm, setSearchTerm] = useState('');

  const filteredInvoices = invoices.filter(inv => 
    inv.patient.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.id.toString().includes(searchTerm)
  );

  const {
    paginatedData: paginatedInvoices,
    currentPage,
    totalPages,
    rowsPerPage,
    totalItems,
    onPageChange,
    onRowsPerPageChange
  } = usePagination(filteredInvoices);
  
  const { data: patients } = useCrud(patientsApi, mapPatientFromApi);
  const { data: medicines } = useCrud(medicinesApi, mapMedicineFromApi);

  // lineItems: [{ rowId, name, priceValue, quantity }]
  const [lineItems, setLineItems] = useState([]);
  const [newRow, setNewRow] = useState({ name: '', price: '', qty: '1' });

  const lineItemsTotal = useMemo(
    () => lineItems.reduce((sum, item) => sum + item.priceValue * item.quantity, 0),
    [lineItems]
  );

  const handleAddRow = () => {
    if (!newRow.name.trim()) {
      showToast('Please enter a medicine name.', 'warning');
      return;
    }
    const price = Math.max(0, parseFloat(newRow.price) || 0);
    const qty = Math.max(1, parseInt(newRow.qty, 10) || 1);
    setLineItems((prev) => [
      ...prev,
      { rowId: Date.now(), name: newRow.name.trim(), priceValue: price, quantity: qty },
    ]);
    setNewRow({ name: '', price: '', qty: '1' });
  };

  const updateLineItemQty = (rowId, qty) => {
    const parsed = Math.max(1, parseInt(qty, 10) || 1);
    setLineItems((prev) => prev.map((i) => i.rowId === rowId ? { ...i, quantity: parsed } : i));
  };

  const updateLineItemPrice = (rowId, price) => {
    const parsed = Math.max(0, parseFloat(price) || 0);
    setLineItems((prev) => prev.map((i) => i.rowId === rowId ? { ...i, priceValue: parsed } : i));
  };

  const removeLineItem = (rowId) => {
    setLineItems((prev) => prev.filter((i) => i.rowId !== rowId));
  };
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [deletingInvoice, setDeletingInvoice] = useState(null);
  const [emailFormData, setEmailFormData] = useState({ recipientEmail: '' });
  const [emailValidationError, setEmailValidationError] = useState('');
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [emailSentMessage, setEmailSentMessage] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [downloadingPdfId, setDownloadingPdfId] = useState(null);

  const [formData, setFormData] = useState({
    patient: '',
    method: 'Cash',
  });

  const [editFormData, setEditFormData] = useState({
    patient: '',
    amount: '',
    status: 'Pending',
    method: 'Cash'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patient) {
      showToast('Please specify a patient for the invoice.', 'warning');
      return;
    }
    if (lineItems.length === 0) {
      showToast('Please add at least one medicine to the invoice.', 'warning');
      return;
    }

    try {
      await addInvoice({
        patient_name: formData.patient,
        invoice_date: new Date().toISOString().slice(0, 10),
        amount: lineItemsTotal,
        status: 'Pending',
        payment_method: formData.method,
        invoice_code: createCode('INV'),
        line_items: lineItems.map((item) => ({
          name: item.name,
          price: item.priceValue,
          quantity: item.quantity,
          subtotal: parseFloat((item.priceValue * item.quantity).toFixed(2)),
        })),
      });
      showToast(`Invoice for ${formData.patient} generated and queued.`);
      setIsModalOpen(false);
      setFormData({ patient: '', method: 'Cash' });
      setLineItems([]);
      setNewRow({ name: '', price: '', qty: '1' });
    } catch (error) {
      showToast(error.message || 'Unable to generate the invoice.', 'error');
    }
  };

  const openEditModal = (inv) => {
    const matchedPatient = patients.find((patient) => patient.name === inv.patient);
    setEditingInvoice(inv);
    setEditFormData({
      patient: inv.patient,
      amount: inv.amountValue,
      status: inv.status,
      method: inv.method
    });
    setEmailFormData({ recipientEmail: matchedPatient?.email || '' });
    setEmailValidationError('');
    setIsEmailSent(false);
    setEmailSentMessage('');
    setIsEditModalOpen(true);
  };

  const closeEmailModal = () => {
    setIsEmailModalOpen(false);
    setEmailValidationError('');
    setIsEmailSent(false);
    setEmailSentMessage('');
  };

  const handleUpdateStatus = async (inv, newStatus) => {
    if (newStatus === 'Paid') {
      setEditingInvoice(inv);
      setEditFormData({
        patient: inv.patient,
        amount: inv.amountValue,
        status: 'Paid',
        method: inv.method
      });
      const matchedPatient = patients.find((p) => p.name === inv.patient);
      setEmailFormData({ recipientEmail: matchedPatient?.email || '' });
      setEmailValidationError('');
      setIsEmailSent(false);
      setEmailSentMessage('');
      setIsEmailModalOpen(true);
      return;
    }

    try {
      await updateInvoice(inv.apiId, { status: newStatus });
      showToast(`Invoice for ${inv.patient} marked as ${newStatus}.`);
    } catch (error) {
      showToast(error.message || `Unable to update status to ${newStatus}.`, 'error');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        patient_name: editFormData.patient,
        amount: Number(editFormData.amount),
        status: editingInvoice.status, // Preserve current status
        payment_method: editFormData.method,
      };
      await updateInvoice(editingInvoice.apiId, payload);
      showToast(`Invoice for ${editFormData.patient} updated successfully.`);
      setIsEditModalOpen(false);
      setEditingInvoice(null);
    } catch (error) {
      showToast(error.message || 'Unable to update the invoice.', 'error');
    }
  };

  const handleSendPaidInvoiceEmail = async (e) => {
    e.preventDefault();

    const normalizedEmail = emailFormData.recipientEmail.trim().toLowerCase();
    if (!emailPattern.test(normalizedEmail)) {
      setEmailValidationError('Enter a valid email address before sending the invoice.');
      return;
    }

    setIsSendingEmail(true);
    try {
      const response = await invoicesApi.sendPaidInvoiceEmail(editingInvoice.apiId, {
        patient_name: editFormData.patient,
        amount: Number(editFormData.amount),
        status: editFormData.status,
        payment_method: editFormData.method,
        recipient_email: normalizedEmail,
      });
      await loadInvoices();

      if (response.email_sent) {
        setIsEmailSent(true);
        setEmailSentMessage(response.message || `Invoice successfully dispatched to ${normalizedEmail}.`);
      } else {
        showToast(response.message, 'error');
      }
    } catch (error) {
      showToast(error.message || 'Unable to email the invoice PDF.', 'error');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteInvoice(deletingInvoice.apiId);
      showToast(`Invoice for ${deletingInvoice.patient} removed from records.`);
      setIsDeleteModalOpen(false);
      setDeletingInvoice(null);
    } catch (error) {
      showToast(error.message || 'Unable to delete the invoice.', 'error');
    }
  };

  const getInvoiceStatusStyle = (status) => {
    const palette = {
      Pending: {
        color: '#f59e0b',
        background: 'rgba(245, 158, 11, 0.12)',
        borderColor: 'rgba(245, 158, 11, 0.35)',
      },
      Paid: {
        color: '#10b981',
        background: 'rgba(16, 185, 129, 0.12)',
        borderColor: 'rgba(16, 185, 129, 0.35)',
      },
      Cancelled: {
        color: '#ef4444',
        background: 'rgba(239, 68, 68, 0.12)',
        borderColor: 'rgba(239, 68, 68, 0.35)',
      },
    };

    return palette[status] || palette.Pending;
  };

  const canUpdateInvoiceStatus = (status) => {
    const normalizedStatus = String(status || '').toLowerCase();
    return canOperate && normalizedStatus !== 'paid' && normalizedStatus !== 'cancelled';
  };

  return (
    <main className="billing-page p-4">
      <div className="d-flex justify-content-between align-items-center mb-5">
        <div>
          <h2 className="fw-bold mb-1">Financial Records</h2>
          <p className="text-muted mb-0">Manage clinical billing and payment records.</p>
        </div>
        {canOperate && (
          <button className="btn btn-primary px-4 py-2" onClick={() => setIsModalOpen(true)}>
            <i className="bi bi-plus-circle me-2" aria-hidden="true"></i>
            Create New Invoice
          </button>
        )}
      </div>

      <div className="glass-card p-0 overflow-hidden border">
        <div
          className="p-4 border-bottom d-flex justify-content-between align-items-center"
          style={{ background: 'var(--accents-1)' }}
        >
          <h6 className="fw-bold mb-0">Recent Invoices</h6>
          <div className="d-flex gap-3 align-items-center">
            <div className="input-group input-group-sm" style={{ width: '200px' }}>
              <span className="input-group-text bg-transparent border-end-0 border-accents-2 opacity-50"><i className="bi bi-search" aria-hidden="true"></i></span>
              <input 
                type="text" 
                className="form-control border-start-0 ps-0" 
                placeholder="Search invoices…" 
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  onPageChange(1);
                }}
              />
            </div>
            {canOperate && (
              <div className="d-flex gap-2">
                <button className="btn btn-sm btn-glass border px-3" onClick={() => showToast('Exporting ledger...')}>
                  Export CSV
                </button>
                <button
                  className="btn btn-sm btn-glass border px-3"
                  onClick={() => showToast('Syncing with financial server...')}
                >
                  Sync Ledger
                </button>
              </div>
            )}
          </div>
        </div>
        <Skeleton name="billing-table" loading={loading}>
          <div className="table-responsive">
            <table className="table table-hover mb-0 align-middle">
            <thead>
              <tr>
                <th className="px-4 py-3">Invoice ID</th>
                <th className="py-3">Patient Name</th>
                <th className="py-3">Date</th>
                <th className="py-3">Amount</th>
                <th className="py-3">Method</th>
                <th className="py-3">Status</th>
                {canManage && <th className="py-3 ps-0 text-start">Actions</th>}
                {canOperate && <th className="py-3 text-center">Download</th>}
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-0">
                    <EmptyState 
                      icon="bi-receipt"
                      title="No Invoices"
                      description="No financial records or billing cycles have been initialized."
                      actionText={canOperate ? "Create New Invoice" : undefined}
                      onAction={canOperate ? () => setIsModalOpen(true) : undefined}
                    />
                  </td>
                </tr>
              ) : paginatedInvoices.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-0">
                    <EmptyState 
                      icon="bi-search"
                      title="No matching invoices"
                      description={`We couldn't find any invoices matching "${searchTerm}".`}
                      actionText="Clear Search"
                      onAction={() => { setSearchTerm(''); onPageChange(1); }}
                    />
                  </td>
                </tr>
              ) : paginatedInvoices.map((inv) => {
                const statusStyle = getInvoiceStatusStyle(inv.status);
                return (
                <tr key={inv.id}>
                  <td className="px-4 py-4 fw-bold" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {inv.id}
                  </td>
                  <td className="py-4 fw-bold">{inv.patient}</td>
                  <td className="py-4 text-muted small" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {inv.date}
                  </td>
                  <td className="py-4 fw-bold" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {inv.amount}
                  </td>
                  <td className="py-4 text-muted small">{inv.method}</td>
                  <td className="py-4">
                    <div className="d-flex align-items-center gap-3">
                      <span
                        className="badge rounded-pill px-3 py-1 border"
                        style={{
                          background: statusStyle.background,
                          color: statusStyle.color,
                          borderColor: statusStyle.borderColor,
                          fontSize: '0.75rem',
                        }}
                      >
                        <span
                          className="pulsing-dot me-2"
                          aria-hidden="true"
                          style={{
                            width: '6px',
                            height: '6px',
                            background: statusStyle.color,
                          }}
                        ></span>
                        {inv.status}
                      </span>
                      {canUpdateInvoiceStatus(inv.status) && (
                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-sm btn-glass border border-success text-success"
                            style={{ padding: '0.15rem 0.4rem' }}
                            onClick={() => handleUpdateStatus(inv, 'Paid')}
                            title="Mark as Paid"
                          >
                            <i className="bi bi-check-lg" style={{ fontSize: '0.85rem' }} aria-hidden="true"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-glass border border-danger text-danger"
                            style={{ padding: '0.15rem 0.4rem' }}
                            onClick={() => handleUpdateStatus(inv, 'Cancelled')}
                            title="Mark as Cancelled"
                          >
                            <i className="bi bi-x-lg" style={{ fontSize: '0.85rem' }} aria-hidden="true"></i>
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                   {canManage && (
                    <td className="ps-0 py-4 text-start">
                      {canManage && (
                        <button
                          className="btn btn-sm btn-glass border me-2"
                          onClick={() => openEditModal(inv)}
                          title="Edit Invoice"
                        >
                          <i className="bi bi-pencil-square" aria-hidden="true"></i>
                        </button>
                      )}
                      {canManage && (
                        <button
                          className="btn btn-sm btn-glass border text-danger"
                          onClick={() => {
                            setDeletingInvoice(inv);
                            setIsDeleteModalOpen(true);
                          }}
                          title="Delete Invoice"
                        >
                          <i className="bi bi-trash3" aria-hidden="true"></i>
                        </button>
                      )}
                    </td>
                  )}
                  {canOperate && (
                    <td className="py-4 text-center">
                      <button
                        className="btn btn-sm btn-glass border px-2"
                        title="Download Invoice PDF"
                        disabled={downloadingPdfId === inv.apiId}
                        onClick={async () => {
                          setDownloadingPdfId(inv.apiId);
                          try {
                            await invoicesApi.downloadPdf(inv.apiId, inv.id);
                          } catch (err) {
                            showToast(err.message || 'Failed to download PDF.', 'error');
                          } finally {
                            setDownloadingPdfId(null);
                          }
                        }}
                      >
                        {downloadingPdfId === inv.apiId ? (
                          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        ) : (
                          <i className="bi bi-file-earmark-arrow-down" aria-hidden="true"></i>
                        )}
                      </button>
                    </td>
                  )}
                </tr>
              )})}
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

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setLineItems([]); setNewRow({ name: '', price: '', qty: '1' }); }} title="Generate Invoice">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="invoice-patient" className="form-label text-muted fw-bold small text-uppercase mb-2">Patient Name</label>
            <input
              id="invoice-patient"
              type="text"
              className="form-control"
              placeholder="Enter patient name..."
              value={formData.patient}
              onChange={(e) => setFormData({ ...formData, patient: e.target.value })}
              list="patient-datalist"
            />
            <datalist id="patient-datalist">
              {patients.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.id}
                </option>
              ))}
            </datalist>
          </div>

          {/* Medicine Line Items — Add Row */}
          <div className="mb-3">
            <label className="form-label text-muted fw-bold small text-uppercase mb-2">Medicine Items</label>
            <div className="rounded-3 p-3" style={{ background: 'var(--accents-1)', border: '1px solid var(--accents-2)' }}>
              <div className="row g-2 align-items-end">
                <div className="col-5">
                  <label htmlFor="inv-med-name" className="form-label text-muted" style={{ fontSize: '0.72rem', letterSpacing: '0.5px', textTransform: 'uppercase', fontWeight: 600 }}>Medicine</label>
                  <input
                    id="inv-med-name"
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Medicine name"
                    value={newRow.name}
                    list="medicine-autocomplete"
                    onChange={(e) => {
                      const val = e.target.value;
                      const found = medicines.find((m) => m.name === val);
                      setNewRow((r) => ({
                        ...r,
                        name: val,
                        price: found ? String(found.priceValue) : r.price,
                      }));
                    }}
                  />
                  <datalist id="medicine-autocomplete">
                    {medicines.map((m) => (
                      <option key={m.apiId} value={m.name}>
                        ₹{m.priceValue} · Stock: {m.stock}
                      </option>
                    ))}
                  </datalist>
                </div>
                <div className="col-3">
                  <label htmlFor="inv-med-price" className="form-label text-muted" style={{ fontSize: '0.72rem', letterSpacing: '0.5px', textTransform: 'uppercase', fontWeight: 600 }}>Price (₹)</label>
                  <input
                    id="inv-med-price"
                    type="number"
                    min="0"
                    step="0.01"
                    className="form-control form-control-sm"
                    placeholder="0.00"
                    value={newRow.price}
                    onChange={(e) => setNewRow((r) => ({ ...r, price: e.target.value }))}
                  />
                </div>
                <div className="col-2">
                  <label htmlFor="inv-med-qty" className="form-label text-muted" style={{ fontSize: '0.72rem', letterSpacing: '0.5px', textTransform: 'uppercase', fontWeight: 600 }}>Qty</label>
                  <input
                    id="inv-med-qty"
                    type="number"
                    min="1"
                    className="form-control form-control-sm"
                    placeholder="1"
                    value={newRow.qty}
                    onChange={(e) => setNewRow((r) => ({ ...r, qty: e.target.value }))}
                  />
                </div>
                <div className="col-2">
                  <button
                    type="button"
                    className="btn btn-primary btn-sm w-100"
                    onClick={handleAddRow}
                  >
                    <i className="bi bi-plus-lg me-1"></i>Add
                  </button>
                </div>
              </div>
            </div>
          </div>

          {lineItems.length > 0 && (
            <div className="mb-4 rounded-3 overflow-hidden" style={{ border: '1px solid var(--accents-2)' }}>
              <table className="table table-sm mb-0 align-middle">
                <thead style={{ background: 'var(--accents-1)' }}>
                  <tr>
                    <th className="px-3 py-2 text-muted small fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>Medicine</th>
                    <th className="py-2 text-muted small fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>Price</th>
                    <th className="py-2 text-muted small fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>Qty</th>
                    <th className="py-2 text-muted small fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>Subtotal</th>
                    <th className="py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item) => (
                    <tr key={item.rowId}>
                      <td className="px-3 py-2 fw-bold" style={{ fontSize: '0.875rem' }}>{item.name}</td>
                      <td className="py-2" style={{ minWidth: '90px' }}>
                        <div className="input-group input-group-sm">
                          <span className="input-group-text bg-transparent border-end-0 opacity-50" style={{ fontSize: '0.8rem' }}>₹</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            className="form-control border-start-0 ps-0"
                            style={{ width: '75px', fontVariantNumeric: 'tabular-nums' }}
                            value={item.priceValue}
                            onChange={(e) => updateLineItemPrice(item.rowId, e.target.value)}
                          />
                        </div>
                      </td>
                      <td className="py-2">
                        <input
                          type="number"
                          min="1"
                          className="form-control form-control-sm"
                          style={{ width: '65px' }}
                          value={item.quantity}
                          onChange={(e) => updateLineItemQty(item.rowId, e.target.value)}
                        />
                      </td>
                      <td className="py-2 fw-bold" style={{ fontSize: '0.875rem', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                        ₹{(item.priceValue * item.quantity).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 pe-2 text-end">
                        <button
                          type="button"
                          className="btn btn-sm btn-glass text-danger p-1"
                          onClick={() => removeLineItem(item.rowId)}
                          title="Remove"
                        >
                          <i className="bi bi-x-lg" style={{ fontSize: '0.75rem' }}></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot style={{ background: 'var(--accents-1)', borderTop: '2px solid var(--accents-2)' }}>
                  <tr>
                    <td colSpan="3" className="px-3 py-2 fw-bold text-end text-muted small text-uppercase" style={{ letterSpacing: '0.5px' }}>Grand Total</td>
                    <td className="py-2 fw-bold" style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--geist-success)' }}>
                      ₹{lineItemsTotal.toLocaleString('en-IN')}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="invoice-method" className="form-label text-muted fw-bold small text-uppercase mb-2">Payment Method</label>
            <select
              id="invoice-method"
              className="form-select"
              value={formData.method}
              onChange={(e) => setFormData({ ...formData, method: e.target.value })}
            >
              <option>Cash</option>
              <option>Card</option>
              <option>Insurance</option>
              <option>UPI</option>
            </select>
          </div>
          <div className="p-3 rounded-3 mb-5" style={{ background: 'var(--accents-1)', border: '1px solid var(--accents-2)' }}>
            <div className="d-flex align-items-center">
              <i className="bi bi-info-circle text-muted me-2" aria-hidden="true"></i>
              <small className="text-muted">Invoices are initialized as pending until payment is finalized.</small>
            </div>
          </div>
          <div className="d-flex gap-2">
            <button type="button" className="btn btn-glass w-100 py-2" onClick={() => { setIsModalOpen(false); setLineItems([]); }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary w-100 py-2">
              Generate Invoice
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Invoice Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Update Invoice Information">
        {editingInvoice && (
          <form onSubmit={handleEditSubmit}>
            <div className="mb-4">
              <label htmlFor="edit-invoice-patient" className="form-label text-muted fw-bold small text-uppercase mb-2">Patient Name</label>
              <input
                id="edit-invoice-patient"
                type="text"
                className="form-control"
                placeholder="Enter patient name..."
                value={editFormData.patient}
                onChange={(e) => setEditFormData({ ...editFormData, patient: e.target.value })}
                list="patient-datalist"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="edit-invoice-amount" className="form-label text-muted fw-bold small text-uppercase mb-2">Amount (INR)</label>
              <input
                id="edit-invoice-amount"
                type="number"
                className="form-control"
                value={editFormData.amount}
                onChange={(e) => setEditFormData({ ...editFormData, amount: e.target.value })}
              />
            </div>
            <div className="mb-4">
              <label htmlFor="edit-invoice-method" className="form-label text-muted fw-bold small text-uppercase mb-2">Payment Method</label>
              <select
                id="edit-invoice-method"
                className="form-select"
                value={editFormData.method}
                onChange={(e) => setEditFormData({ ...editFormData, method: e.target.value })}
              >
                <option>Cash</option>
                <option>Card</option>
                <option>Insurance</option>
                <option>UPI</option>
              </select>
            </div>
            <div className="d-flex gap-2 mt-5">
              <button type="button" className="btn btn-glass w-100 py-2" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary w-100 py-2">
                Save Changes
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmation
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        itemName={`Invoice ${deletingInvoice?.id} for ${deletingInvoice?.patient}`}
        itemType="Invoice"
      />

      <Modal isOpen={isEmailModalOpen} onClose={closeEmailModal} title="Email Paid Invoice">
        {isEmailSent ? (
          <div className="text-center py-4">
            <div 
              className="d-inline-flex align-items-center justify-content-center rounded-circle mb-4"
              style={{ width: '80px', height: '80px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)' }}
            >
              <i className="bi bi-check-lg fs-1 text-success" aria-hidden="true"></i>
            </div>
            <h4 className="fw-bold mb-2">Invoice Sent!</h4>
            <p className="text-muted mb-5 px-4">{emailSentMessage}</p>
            <button 
              type="button" 
              className="btn btn-primary w-100 py-2" 
              onClick={() => {
                closeEmailModal();
                setIsEditModalOpen(false);
                setEditingInvoice(null);
              }}
            >
              Back to Invoices
            </button>
          </div>
        ) : (
          <form onSubmit={handleSendPaidInvoiceEmail} noValidate>
            <div className="mb-3">
              <label htmlFor="invoice-recipient-email" className="form-label text-muted fw-bold small text-uppercase mb-2">
                Recipient Email
              </label>
              <input
                id="invoice-recipient-email"
                type="email"
                className={`form-control ${emailValidationError ? 'is-invalid' : ''}`}
                placeholder="patient@example.com"
                value={emailFormData.recipientEmail}
                onChange={(e) => {
                  setEmailFormData({ recipientEmail: e.target.value });
                  if (emailValidationError) {
                    setEmailValidationError('');
                  }
                }}
                required
              />
              {emailValidationError && <div className="invalid-feedback d-block">{emailValidationError}</div>}
            </div>
            <div className="p-3 rounded-3 mb-4" style={{ background: 'var(--accents-1)', border: '1px solid var(--accents-2)' }}>
              <small className="text-muted">
                Marking this invoice as paid will generate a PDF on the backend and email it as an attachment.
              </small>
            </div>
            <div className="d-flex gap-2">
              <button type="button" className="btn btn-glass w-100 py-2" onClick={closeEmailModal} disabled={isSendingEmail}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary w-100 py-2" disabled={isSendingEmail}>
                {isSendingEmail ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Sending...
                  </>
                ) : (
                  'Send Invoice PDF'
                )}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </main>
  );
};

export default Billing;
