import React, { useState } from 'react';
import { useApp, mapMedicineFromApi, createCode } from '../context/AppContext';
import { useCrud } from '../hooks/useCrud';
import { medicinesApi } from '../lib/api';
import Modal from '../components/UI/Modal';
import EmptyState from '../components/UI/EmptyState';
import DeleteConfirmation from '../components/UI/DeleteConfirmation';
import { Skeleton } from 'boneyard-js/react';

const Pharmacy = () => {
  const { showToast } = useApp();
  const { 
    data: medicines, 
    loading, 
    addData: addMedicine,
    updateData: updateMedicine,
    removeData: deleteMedicine
  } = useCrud(medicinesApi, mapMedicineFromApi);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [deletingMedicine, setDeletingMedicine] = useState(null);

  const [formData, setFormData] = useState({
    name: '', batch: '', stock: '', expiry: ''
  });

  const [editFormData, setEditFormData] = useState({
    name: '',
    batch: '',
    stock: '',
    expiry: '',
    status: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.stock) {
      showToast('Please specify medicine name and initial stock quantity.', 'warning');
      return;
    }
    try {
      const stock = parseInt(formData.stock, 10);
      await addMedicine({
        medicine_code: createCode('MED'),
        name: formData.name,
        batch: formData.batch,
        stock,
        expiry_date: formData.expiry,
        status: stock > 20 ? 'In Stock' : 'Low Stock',
      });
      showToast(`${formData.name} added to inventory.`);
      setIsModalOpen(false);
      setFormData({ name: '', batch: '', stock: '', expiry: '' });
    } catch (error) {
      showToast(error.message || 'Unable to add the medicine.', 'error');
    }
  };

  const openEditModal = (med) => {
    setEditingMedicine(med);
    setEditFormData({
      name: med.name,
      batch: med.batch,
      stock: med.stock,
      expiry: med.expiry,
      status: med.status
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const stock = parseInt(editFormData.stock, 10);
      await updateMedicine(editingMedicine.apiId, {
        name: editFormData.name,
        batch: editFormData.batch,
        stock,
        expiry_date: editFormData.expiry,
        status: editFormData.status === 'Auto' ? (stock > 20 ? 'In Stock' : 'Low Stock') : editFormData.status
      });
      showToast(`${editFormData.name} updated successfully.`);
      setIsEditModalOpen(false);
      setEditingMedicine(null);
    } catch (error) {
      showToast(error.message || 'Unable to update medicine.', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMedicine(deletingMedicine.apiId);
      showToast(`${deletingMedicine.name} removed from inventory.`);
      setIsDeleteModalOpen(false);
      setDeletingMedicine(null);
    } catch (error) {
      showToast(error.message || 'Unable to delete medicine.', 'error');
    }
  };

  return (
    <main className="pharmacy-page p-4">
      <div className="d-flex justify-content-between align-items-center mb-5">
        <div>
          <h2 className="fw-bold mb-1">Pharmacy Inventory</h2>
          <p className="text-muted mb-0">Monitor medication stock levels and dispense records.</p>
        </div>
        <div className="d-flex gap-2">
           <button 
             className="btn btn-glass px-4 py-2 border text-muted"
             onClick={() => showToast('Analyzing stock for expiration alerts…')}
           >
            <i className="bi bi-shield-exclamation me-2" aria-hidden="true"></i>
            Stock Alerts
          </button>
          <button 
            className="btn btn-primary px-4 py-2"
            onClick={() => setIsModalOpen(true)}
          >
            <i className="bi bi-box-seam me-2" aria-hidden="true"></i>
            Add Medicine
          </button>
        </div>
      </div>

      <div className="glass-card p-0 overflow-hidden border">
        <div className="p-4 border-bottom d-flex justify-content-between align-items-center" style={{ background: 'var(--accents-1)' }}>
          <h6 className="fw-bold mb-0">Active Stock</h6>
          <div className="input-group w-25">
            <span className="input-group-text bg-transparent border-end-0 border-accents-2 opacity-50"><i className="bi bi-search" aria-hidden="true"></i></span>
            <input type="text" className="form-control border-start-0 ps-0 py-1" placeholder="Search inventory…" />
          </div>
        </div>
        <Skeleton name="pharmacy-table" loading={loading}>
          <div className="table-responsive">
            <table className="table table-hover mb-0 align-middle">
            <thead>
              <tr>
                <th className="px-4 py-3">Medicine Name</th>
                <th className="py-3">Batch ID</th>
                <th className="py-3">Stock Level</th>
                <th className="py-3">Expiration</th>
                <th className="py-3 text-center">Status</th>
                <th className="px-4 py-3 text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {medicines.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-0">
                    <EmptyState 
                      icon="bi-capsule-pill"
                      title="Pharmacy Empty"
                      description="No medication stock levels have been recorded in the system yet."
                      actionText="Add Medicine"
                      onAction={() => setIsModalOpen(true)}
                    />
                  </td>
                </tr>
              ) : medicines.map((med) => (
                <tr key={med.id}>
                  <td className="px-4 py-4 fw-bold">{med.name}</td>
                  <td className="py-4 text-muted small" style={{ fontVariantNumeric: 'tabular-nums' }}>{med.batch}</td>
                  <td className="py-4 fw-bold" style={{ fontVariantNumeric: 'tabular-nums' }}>{med.stock} Units</td>
                  <td className="py-4 text-muted small" style={{ fontVariantNumeric: 'tabular-nums' }}>{med.expiry}</td>
                  <td className="py-4 text-center">
                    <span className={`badge rounded-pill px-3 py-1 border`} style={{ 
                        background: med.stock > 20 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 166, 35, 0.1)',
                        color: med.stock > 20 ? 'var(--geist-success)' : 'var(--geist-warning)',
                        borderColor: med.stock > 20 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 166, 35, 0.2)',
                        fontSize: '0.75rem'
                    }}>
                      {med.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-end">
                    <div className="d-flex justify-content-end align-items-center gap-2">
                      <button 
                        className="btn btn-primary btn-sm px-3"
                        onClick={() => showToast(`Dispensing ${med.name}…`)}
                      >
                        Dispense
                      </button>
                      <button 
                        className="btn btn-sm btn-glass text-primary"
                        onClick={() => openEditModal(med)}
                        title="Edit Stock"
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button 
                        className="btn btn-sm btn-glass text-danger"
                        onClick={() => {
                          setDeletingMedicine(med);
                          setIsDeleteModalOpen(true);
                        }}
                        title="Remove Medicine"
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </Skeleton>
      </div>

      {/* Add Medicine Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Add Inventory"
      >
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="medicine-name" className="form-label text-muted fw-bold small text-uppercase mb-2">Medicine Name</label>
            <input 
              id="medicine-name"
              type="text" 
              className="form-control" 
              placeholder="e.g. Paracetamol 500mg…" 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <label htmlFor="medicine-batch" className="form-label text-muted fw-bold small text-uppercase mb-2">Batch ID</label>
              <input 
                id="medicine-batch"
                type="text" 
                className="form-control" 
                placeholder="BT-XXXX" 
                value={formData.batch}
                onChange={e => setFormData({...formData, batch: e.target.value})}
              />
            </div>
            <div className="col-md-6">
              <label htmlFor="medicine-stock" className="form-label text-muted fw-bold small text-uppercase mb-2">Quantity</label>
              <input 
                id="medicine-stock"
                type="number" 
                className="form-control" 
                placeholder="0" 
                value={formData.stock}
                onChange={e => setFormData({...formData, stock: e.target.value})}
              />
            </div>
          </div>
          <div className="mb-4">
            <label htmlFor="medicine-expiry" className="form-label text-muted fw-bold small text-uppercase mb-2">Expiration Date (YYYY-MM-DD)</label>
            <input 
              id="medicine-expiry"
              type="date" 
              className="form-control" 
              value={formData.expiry}
              onChange={e => setFormData({...formData, expiry: e.target.value})}
            />
          </div>
          <div className="d-flex gap-2 mt-5">
            <button type="button" className="btn btn-glass w-100 py-2" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary w-100 py-2">Add Medicine</button>
          </div>
        </form>
      </Modal>

      {/* Edit Medicine Modal */}
      <Modal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        title="Edit Inventory Details"
      >
        <form onSubmit={handleEditSubmit}>
          <div className="mb-4">
            <label htmlFor="edit-medicine-name" className="form-label text-muted fw-bold small text-uppercase mb-2">Medicine Name</label>
            <input 
              id="edit-medicine-name"
              type="text" 
              className="form-control" 
              value={editFormData.name}
              onChange={e => setEditFormData({...editFormData, name: e.target.value})}
            />
          </div>
          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <label htmlFor="edit-medicine-batch" className="form-label text-muted fw-bold small text-uppercase mb-2">Batch ID</label>
              <input 
                id="edit-medicine-batch"
                type="text" 
                className="form-control" 
                value={editFormData.batch}
                onChange={e => setEditFormData({...editFormData, batch: e.target.value})}
              />
            </div>
            <div className="col-md-6">
              <label htmlFor="edit-medicine-stock" className="form-label text-muted fw-bold small text-uppercase mb-2">Quantity</label>
              <input 
                id="edit-medicine-stock"
                type="number" 
                className="form-control" 
                value={editFormData.stock}
                onChange={e => setEditFormData({...editFormData, stock: e.target.value})}
              />
            </div>
          </div>
          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <label htmlFor="edit-medicine-expiry" className="form-label text-muted fw-bold small text-uppercase mb-2">Expiration Date</label>
              <input 
                id="edit-medicine-expiry"
                type="date" 
                className="form-control" 
                value={editFormData.expiry}
                onChange={e => setEditFormData({...editFormData, expiry: e.target.value})}
              />
            </div>
            <div className="col-md-6">
              <label htmlFor="edit-medicine-status" className="form-label text-muted fw-bold small text-uppercase mb-2">Status Style</label>
              <select 
                id="edit-medicine-status"
                className="form-select"
                value={editFormData.status}
                onChange={e => setEditFormData({...editFormData, status: e.target.value})}
              >
                <option value="Auto">Auto (Based on Stock)</option>
                <option>In Stock</option>
                <option>Low Stock</option>
                <option>Out of Stock</option>
              </select>
            </div>
          </div>
          <div className="d-flex gap-2 mt-5">
            <button type="button" className="btn btn-glass w-100 py-2" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary w-100 py-2">Save Changes</button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <DeleteConfirmation 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        itemName={deletingMedicine?.name}
        itemType="Medication Inventory"
      />
    </main>
  );
};

export default Pharmacy;
