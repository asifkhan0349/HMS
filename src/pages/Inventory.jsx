import React, { useState } from 'react';
import { useApp, mapInventoryFromApi, createCode } from '../context/AppContext';
import { useCrud } from '../hooks/useCrud';
import { inventoryApi } from '../lib/api';
import Modal from '../components/UI/Modal';
import EmptyState from '../components/UI/EmptyState';
import DeleteConfirmation from '../components/UI/DeleteConfirmation';
import Pagination from '../components/UI/Pagination';
import { Skeleton } from 'boneyard-js/react';
import { usePagination } from '../hooks/usePagination';

const Inventory = () => {
  const { showToast, user } = useApp();
  const isDoctor = user?.role === 'Doctor';
  const isNurse = user?.role === 'Nurse';
  const isReception = user?.role === 'Reception';
  const {
    data: inventoryItems,
    loading,
    addData: addInventory,
    updateData: updateInventory,
    removeData: deleteInventory
  } = useCrud(inventoryApi, mapInventoryFromApi);

  const {
    paginatedData: paginatedInventoryItems,
    currentPage,
    totalPages,
    rowsPerPage,
    totalItems,
    onPageChange,
    onRowsPerPageChange
  } = usePagination(inventoryItems);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);

  const [formData, setFormData] = useState({
    name: '', category: 'General', stock: '', unit: 'Units'
  });

  const [editFormData, setEditFormData] = useState({
    name: '', category: 'General', stock: '', unit: 'Units'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.stock) {
      showToast('Please specify item name and initial stock quantity.', 'warning');
      return;
    }
    try {
      const stockValue = parseInt(formData.stock, 10);
      await addInventory({
        item_code: createCode('INV'),
        name: formData.name,
        category: formData.category,
        stock: stockValue,
        unit: formData.unit,
        status: stockValue > 10 ? 'In Stock' : 'Low Stock',
      });
      showToast(`${formData.name} added to inventory.`);
      setIsModalOpen(false);
      setFormData({ name: '', category: 'General', stock: '', unit: 'Units' });
    } catch (error) {
      showToast(error.message || 'Unable to add the item.', 'error');
    }
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setEditFormData({
      name: item.name,
      category: item.category,
      stock: item.stock,
      unit: item.unit
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const stockValue = parseInt(editFormData.stock, 10);
      const payload = {
        name: editFormData.name,
        category: editFormData.category,
        stock: stockValue,
        unit: editFormData.unit,
        status: stockValue > 10 ? 'In Stock' : stockValue > 0 ? 'Low Stock' : 'Out of Stock',
      };
      await updateInventory(editingItem.apiId, payload);
      showToast(`${editFormData.name} updated in inventory.`);
      setIsEditModalOpen(false);
      setEditingItem(null);
    } catch (error) {
      showToast(error.message || 'Unable to update the item.', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteInventory(deletingItem.apiId);
      showToast(`${deletingItem.name} removed from inventory.`);
      setIsDeleteModalOpen(false);
      setDeletingItem(null);
    } catch (error) {
      showToast(error.message || 'Unable to delete the item.', 'error');
    }
  };

  return (
    <main className="inventory-page p-4">
      <div className="d-flex justify-content-between align-items-center mb-5">
        <div>
          <h2 className="fw-bold mb-1">Inventory Management</h2>
          <p className="text-muted mb-0">Track and manage hospital supplies and equipment.</p>
        </div>
        <div className="d-flex gap-2">
          <button
            className="btn btn-glass px-4 py-2 border d-flex align-items-center"
            onClick={async () => {
              try {
                const { jsPDF } = await import('jspdf');
                const { default: autoTable } = await import('jspdf-autotable');
                const doc = new jsPDF();

                doc.setFontSize(22);
                doc.setTextColor(0, 112, 243);
                doc.text('HMS ELITE — INVENTORY AUDIT REPORT', 14, 22);

                doc.setFontSize(10);
                doc.setTextColor(100);
                doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
                doc.setDrawColor(0, 112, 243);
                doc.line(14, 34, 196, 34);

                if (inventoryItems.length === 0) {
                  doc.setFontSize(12);
                  doc.setTextColor(150);
                  doc.text('No inventory items found.', 14, 50);
                } else {
                  autoTable(doc, {
                    startY: 40,
                    head: [['Item ID', 'Name', 'Category', 'Stock', 'Unit', 'Status']],
                    body: inventoryItems.map(item => [
                      item.id, item.name, item.category,
                      String(item.stock), item.unit, item.status
                    ]),
                    theme: 'striped',
                    headStyles: { fillColor: [0, 112, 243] },
                  });
                }

                doc.save('HMS_Inventory_Audit.pdf');
                showToast('✓ Inventory Audit Report downloaded!');
              } catch (err) {
                console.error('PDF export failed:', err);
                showToast('PDF generation failed. Please try again.', 'error');
              }
            }}
          >
            <i className="bi bi-download me-2" aria-hidden="true"></i>
            Audit Report
          </button>
          <button
            className="btn btn-primary px-4 py-2 d-flex align-items-center"
            onClick={() => setIsModalOpen(true)}
          >
            <i className="bi bi-cart-plus me-2" aria-hidden="true"></i>
            Add Supply
          </button>
        </div>
      </div>

      <Skeleton name="inventory-table" loading={loading}>
        <div className="glass-card overflow-hidden">
          <div className="table-responsive">
            <table className="table mb-0 align-middle">
              <thead>
                <tr>
                  <th className="px-4">Item ID</th>
                  <th>Item Name</th>
                  <th>Category</th>
                  <th>Current Stock</th>
                  <th>Status</th>
                  {!(isDoctor || isNurse || isReception) && <th className="px-4 text-end">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {inventoryItems.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-0">
                      <EmptyState
                        icon="bi-box-seam"
                        title="No Inventory Items"
                        description="Your hospital supply repository is currently empty. Start by adding new supplies or equipment."
                        actionText="Add Supply"
                        onAction={() => setIsModalOpen(true)}
                      />
                    </td>
                  </tr>
                ) : paginatedInventoryItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 fw-bold" style={{ fontVariantNumeric: 'tabular-nums' }}>{item.id}</td>
                    <td>{item.name}</td>
                    <td>
                      <span className="badge rounded-pill bg-light text-dark border px-2 py-1 small fw-medium">
                        {item.category}
                      </span>
                    </td>
                    <td style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {item.stock} {item.unit}
                    </td>
                    <td>
                      <span
                        className="px-2 py-1 rounded-pill small fw-bold"
                        style={{
                          fontSize: '0.7rem',
                          background: item.status === 'In Stock'
                            ? 'rgba(16, 185, 129, 0.15)'
                            : item.status === 'Low Stock'
                              ? 'rgba(245, 166, 35, 0.15)'
                              : 'rgba(238, 0, 0, 0.15)',

                          color: item.status === 'In Stock'
                            ? 'green'
                            : item.status === 'Low Stock'
                              ? 'orange'
                              : 'red',

                          border: `1px solid ${item.status === 'In Stock'
                              ? 'rgba(16, 185, 129, 0.3)'
                              : item.status === 'Low Stock'
                                ? 'rgba(245, 166, 35, 0.3)'
                                : 'rgba(238, 0, 0, 0.3)'
                            }`
                        }}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 text-end">
                      {!(isDoctor || isNurse || isReception) && (
                        <>
                          <button
                            className="btn btn-sm btn-glass me-2"
                            onClick={() => openEditModal(item)}
                            title="Edit Item"
                          >
                            <i className="bi bi-pencil-square" aria-hidden="true"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-glass text-danger"
                            onClick={() => {
                              setDeletingItem(item);
                              setIsDeleteModalOpen(true);
                            }}
                            title="Delete Item"
                          >
                            <i className="bi bi-trash3" aria-hidden="true"></i>
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={onRowsPerPageChange}
          totalItems={totalItems}
        />
      </Skeleton>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Inventory Item">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="inventory-name" className="form-label text-muted fw-bold small text-uppercase mb-2">Item Name</label>
            <input
              id="inventory-name"
              type="text"
              className="form-control"
              placeholder="e.g. Surgical Masks"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <label htmlFor="inventory-category" className="form-label text-muted fw-bold small text-uppercase mb-2">Category</label>
              <select
                id="inventory-category"
                className="form-select"
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
              >
                <option>General</option>
                <option>PPE</option>
                <option>Stationery</option>
                <option>Hardware</option>
              </select>
            </div>
            <div className="col-md-6">
              <label htmlFor="inventory-unit" className="form-label text-muted fw-bold small text-uppercase mb-2">Unit</label>
              <select
                id="inventory-unit"
                className="form-select"
                value={formData.unit}
                onChange={e => setFormData({ ...formData, unit: e.target.value })}
              >
                <option>Units</option>
                <option>Boxes</option>
                <option>Pieces</option>
                <option>Vials</option>
              </select>
            </div>
          </div>
          <div className="mb-4">
            <label htmlFor="inventory-stock" className="form-label text-muted fw-bold small text-uppercase mb-2">Initial Stock</label>
            <input
              id="inventory-stock"
              type="number"
              className="form-control"
              placeholder="0"
              value={formData.stock}
              onChange={e => setFormData({ ...formData, stock: e.target.value })}
            />
          </div>
          <div className="d-flex gap-2 mt-5">
            <button type="button" className="btn btn-glass w-100 py-2" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary w-100 py-2">Add Item</button>
          </div>
        </form>
      </Modal>

      {/* Edit Inventory Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Update Inventory Item">
        {editingItem && (
          <form onSubmit={handleEditSubmit}>
            <div className="mb-4">
              <label htmlFor="edit-inventory-name" className="form-label text-muted fw-bold small text-uppercase mb-2">Item Name</label>
              <input
                id="edit-inventory-name"
                type="text"
                className="form-control"
                value={editFormData.name}
                onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
              />
            </div>
            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <label htmlFor="edit-inventory-category" className="form-label text-muted fw-bold small text-uppercase mb-2">Category</label>
                <select
                  id="edit-inventory-category"
                  className="form-select"
                  value={editFormData.category}
                  onChange={e => setEditFormData({ ...editFormData, category: e.target.value })}
                >
                  <option>General</option>
                  <option>PPE</option>
                  <option>Stationery</option>
                  <option>Hardware</option>
                </select>
              </div>
              <div className="col-md-6">
                <label htmlFor="edit-inventory-unit" className="form-label text-muted fw-bold small text-uppercase mb-2">Unit</label>
                <select
                  id="edit-inventory-unit"
                  className="form-select"
                  value={editFormData.unit}
                  onChange={e => setEditFormData({ ...editFormData, unit: e.target.value })}
                >
                  <option>Units</option>
                  <option>Boxes</option>
                  <option>Pieces</option>
                  <option>Vials</option>
                </select>
              </div>
            </div>
            <div className="mb-4">
              <label htmlFor="edit-inventory-stock" className="form-label text-muted fw-bold small text-uppercase mb-2">Current Stock</label>
              <input
                id="edit-inventory-stock"
                type="number"
                className="form-control"
                value={editFormData.stock}
                onChange={e => setEditFormData({ ...editFormData, stock: e.target.value })}
              />
            </div>
            <div className="d-flex gap-2 mt-5">
              <button type="button" className="btn btn-glass w-100 py-2" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary w-100 py-2">Save Changes</button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmation
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        itemName={deletingItem?.name}
        itemType="Inventory Item"
      />
    </main>
  );
};

export default Inventory;
