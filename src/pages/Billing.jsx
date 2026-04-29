import React, { useState } from 'react';
import { useApp, mapInvoiceFromApi, mapPatientFromApi, createCode } from '../context/AppContext';
import { useCrud } from '../hooks/useCrud';
import { invoicesApi, patientsApi } from '../lib/api';
import Modal from '../components/UI/Modal';
import EmptyState from '../components/UI/EmptyState';
import DeleteConfirmation from '../components/UI/DeleteConfirmation';
import { Skeleton } from 'boneyard-js/react';

const Billing = () => {
  const { showToast, user } = useApp();
  const isPatient = user?.role?.toLowerCase() === 'patient';
  const { 
    data: invoices, 
    loading, 
    addData: addInvoice,
    updateData: updateInvoice,
    removeData: deleteInvoice
  } = useCrud(invoicesApi, mapInvoiceFromApi);
  
  const { data: patients } = useCrud(patientsApi, mapPatientFromApi);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [deletingInvoice, setDeletingInvoice] = useState(null);

  const [formData, setFormData] = useState({
    patient: '',
    amount: '',
  });

  const [editFormData, setEditFormData] = useState({
    patient: '',
    amount: '',
    status: 'Pending',
    method: 'Unpaid'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patient || !formData.amount) {
      showToast('Please specify patient and amount for the invoice.', 'warning');
      return;
    }

    try {
      await addInvoice({
        patient_name: formData.patient,
        invoice_date: new Date().toISOString().slice(0, 10),
        amount: Number(formData.amount),
        status: 'Pending',
        payment_method: 'Unpaid',
        invoice_code: createCode('INV'),
      });
      showToast(`Invoice for ${formData.patient} generated and queued.`);
      setIsModalOpen(false);
      setFormData({ patient: '', amount: '' });
    } catch (error) {
      showToast(error.message || 'Unable to generate the invoice.', 'error');
    }
  };

  const openEditModal = (inv) => {
    setEditingInvoice(inv);
    setEditFormData({
      patient: inv.patient,
      amount: inv.amountValue,
      status: inv.status,
      method: inv.method
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        patient_name: editFormData.patient,
        amount: Number(editFormData.amount),
        status: editFormData.status,
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

  return (
    <main className="billing-page p-4">
      <div className="d-flex justify-content-between align-items-center mb-5">
        <div>
          <h2 className="fw-bold mb-1">Financial Records</h2>
          <p className="text-muted mb-0">Manage clinical billing and payment records.</p>
        </div>
        {!isPatient && (
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
          {!isPatient && (
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
        <Skeleton name="billing-table" loading={loading}>
          <div className="table-responsive">
            <table className="table table-hover mb-0 align-middle">
            <thead>
              <tr>
                <th className="px-4 py-3">Invoice ID</th>
                <th className="py-3">Patient Name</th>
                <th className="py-3">Date</th>
                <th className="py-3">Amount</th>
                <th className="py-3">Status</th>
                <th className="py-3">Method</th>
                {!isPatient && <th className="px-4 py-3 text-end">Actions</th>}
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
                      actionText={isPatient ? undefined : "Create New Invoice"}
                      onAction={isPatient ? undefined : () => setIsModalOpen(true)}
                    />
                  </td>
                </tr>
              ) : invoices.map((inv) => (
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
                  <td className="py-4">
                    <span
                      className="badge rounded-pill px-3 py-1 border"
                      style={{
                        background: inv.status === 'Paid' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 166, 35, 0.1)',
                        color: inv.status === 'Paid' ? 'var(--geist-success)' : 'var(--geist-warning)',
                        borderColor:
                          inv.status === 'Paid' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 166, 35, 0.2)',
                        fontSize: '0.75rem',
                      }}
                    >
                      <span className="pulsing-dot me-2" aria-hidden="true" style={{ width: '6px', height: '6px' }}></span>
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-4 text-muted small">{inv.method}</td>
                  {!isPatient && (
                    <td className="px-4 py-4 text-end">
                      <button
                        className="btn btn-sm btn-glass border me-2"
                        onClick={() => openEditModal(inv)}
                        title="Edit Invoice"
                      >
                        <i className="bi bi-pencil-square" aria-hidden="true"></i>
                      </button>
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
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </Skeleton>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Generate Invoice">
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
          <div className="mb-4">
            <label htmlFor="invoice-amount" className="form-label text-muted fw-bold small text-uppercase mb-2">Amount (INR)</label>
            <div className="input-group">
              <span className="input-group-text bg-transparent border-end-0 border-accents-2 opacity-50">INR</span>
              <input
                id="invoice-amount"
                type="number"
                className="form-control border-start-0 ps-0"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
            </div>
          </div>
          <div className="p-3 rounded-3 mb-5" style={{ background: 'var(--accents-1)', border: '1px solid var(--accents-2)' }}>
            <div className="d-flex align-items-center">
              <i className="bi bi-info-circle text-muted me-2" aria-hidden="true"></i>
              <small className="text-muted">Invoices are initialized as pending until payment is finalized.</small>
            </div>
          </div>
          <div className="d-flex gap-2">
            <button type="button" className="btn btn-glass w-100 py-2" onClick={() => setIsModalOpen(false)}>
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
            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <label htmlFor="edit-invoice-amount" className="form-label text-muted fw-bold small text-uppercase mb-2">Amount (INR)</label>
                <input
                  id="edit-invoice-amount"
                  type="number"
                  className="form-control"
                  value={editFormData.amount}
                  onChange={(e) => setEditFormData({ ...editFormData, amount: e.target.value })}
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="edit-invoice-status" className="form-label text-muted fw-bold small text-uppercase mb-2">Status</label>
                <select
                  id="edit-invoice-status"
                  className="form-select"
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                >
                  <option>Pending</option>
                  <option>Paid</option>
                  <option>Cancelled</option>
                </select>
              </div>
            </div>
            <div className="mb-4">
              <label htmlFor="edit-invoice-method" className="form-label text-muted fw-bold small text-uppercase mb-2">Payment Method</label>
              <select
                id="edit-invoice-method"
                className="form-select"
                value={editFormData.method}
                onChange={(e) => setEditFormData({ ...editFormData, method: e.target.value })}
              >
                <option>Unpaid</option>
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
        itemName={`Invoice ${editingInvoice?.id} for ${editingInvoice?.patient}`}
        itemType="Invoice"
      />
    </main>
  );
};

export default Billing;
