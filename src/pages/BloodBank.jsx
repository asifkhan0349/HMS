import React, { useState } from 'react';
import { useApp, mapBloodGroupFromApi, mapActivityFromApi } from '../context/AppContext';
import { useCrud } from '../hooks/useCrud';
import { bloodInventoryApi, bloodActivitiesApi } from '../lib/api';
import Modal from '../components/UI/Modal';
import EmptyState from '../components/UI/EmptyState';
import DeleteConfirmation from '../components/UI/DeleteConfirmation';
import { Skeleton } from 'boneyard-js/react';

const BloodBank = () => {
  const { showToast } = useApp();
  const { 
    data: bloodGroups, 
    loading: loadingInventory,
    loadData: loadBlood,
    updateData: updateInventory,
    removeData: deleteInventory
  } = useCrud(bloodInventoryApi, mapBloodGroupFromApi);
  
  const { 
    data: activities, 
    loading: loadingActivities,
    addData: addActivity,
    updateData: updateActivity,
    removeData: deleteActivity
  } = useCrud(bloodActivitiesApi, mapActivityFromApi);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isActivityEditModalOpen, setIsActivityEditModalOpen] = useState(false);
  const [isInventoryEditModalOpen, setIsInventoryEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [editingActivity, setEditingActivity] = useState(null);
  const [editingInventory, setEditingInventory] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [deletingType, setDeletingType] = useState(''); // 'inventory' or 'activity'

  const [formData, setFormData] = useState({
    type: 'Donation',
    blood_group: 'O+',
    units: '',
    donor_name: ''
  });

  const [activityEditFormData, setActivityEditFormData] = useState({
    type: 'Donation',
    blood_group: 'O+',
    units: '',
    donor_name: ''
  });

  const [inventoryEditFormData, setInventoryEditFormData] = useState({
    units: '',
    status: 'Stable',
    trend: 'Stable'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.units) {
      showToast('Please enter the number of units.', 'warning');
      return;
    }
    try {
      await addActivity(formData);
      showToast(`Blood ${formData.type.toLowerCase()} logged successfully.`);
      setIsModalOpen(false);
      setFormData({ type: 'Donation', blood_group: 'O+', units: '', donor_name: '' });
      await loadBlood(); // refresh totals
    } catch (error) {
      showToast(error.message || 'Unable to log activity.', 'error');
    }
  };

  const openActivityEditModal = (act) => {
    setEditingActivity(act);
    setActivityEditFormData({
      type: act.type,
      blood_group: act.group,
      units: act.units,
      donor_name: act.donor || act.hospital || ''
    });
    setIsActivityEditModalOpen(true);
  };

  const handleActivityEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateActivity(editingActivity.apiId, activityEditFormData);
      showToast('Activity log updated.');
      setIsActivityEditModalOpen(false);
      setEditingActivity(null);
      loadBlood(); // refresh totals in case units changed
    } catch (error) {
      showToast(error.message || 'Unable to update activity.', 'error');
    }
  };

  const openInventoryEditModal = (group) => {
    setEditingInventory(group);
    setInventoryEditFormData({
      units: group.units,
      status: group.status,
      trend: group.trend
    });
    setIsInventoryEditModalOpen(true);
  };

  const handleInventoryEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateInventory(editingInventory.apiId, {
        units: parseInt(inventoryEditFormData.units, 10),
        status: inventoryEditFormData.status,
        trend: inventoryEditFormData.trend
      });
      showToast(`Inventory for ${editingInventory.type} updated.`);
      setIsInventoryEditModalOpen(false);
      setEditingInventory(null);
    } catch (error) {
      showToast(error.message || 'Unable to update inventory.', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      if (deletingType === 'activity') {
        await deleteActivity(deletingItem.apiId);
        showToast('Activity record removed.');
        loadBlood();
      } else {
        await deleteInventory(deletingItem.apiId);
        showToast(`Inventory record for ${deletingItem.type} removed.`);
      }
      setIsDeleteModalOpen(false);
      setDeletingItem(null);
    } catch (error) {
      showToast(error.message || 'Unable to delete record.', 'error');
    }
  };

  return (
    <main className="bloodbank-page p-4">
      <div className="d-flex justify-content-between align-items-center mb-5">
        <div>
          <h2 className="fw-bold mb-1">Blood Bank Repository</h2>
          <p className="text-muted mb-0">Monitor real-time blood unit availability and donation cycle.</p>
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
                doc.setTextColor(180, 0, 0);
                doc.text('HMS ELITE — BLOOD BANK REGISTRY', 14, 22);

                doc.setFontSize(10);
                doc.setTextColor(100);
                doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
                doc.setDrawColor(180, 0, 0);
                doc.line(14, 34, 196, 34);

                // Blood inventory summary
                doc.setFontSize(13);
                doc.setTextColor(40);
                doc.text('Blood Group Inventory', 14, 43);

                if (bloodGroups.length > 0) {
                  autoTable(doc, {
                    startY: 48,
                    head: [['Blood Group', 'Units Available', 'Trend', 'Status']],
                    body: bloodGroups.map(g => [g.type, String(g.units), g.trend, g.status]),
                    theme: 'striped',
                    headStyles: { fillColor: [180, 0, 0] },
                  });
                } else {
                  doc.setFontSize(10);
                  doc.setTextColor(150);
                  doc.text('No blood inventory data.', 14, 55);
                }

                // Activity log
                const nextY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : 70;
                doc.setFontSize(13);
                doc.setTextColor(40);
                doc.text('Activity Log', 14, nextY);

                if (activities.length > 0) {
                  autoTable(doc, {
                    startY: nextY + 5,
                    head: [['Type', 'Blood Group', 'Units', 'Donor / Entity', 'Date']],
                    body: activities.map(a => [
                      a.type, a.group, String(a.units),
                      a.donor || a.hospital || '—', a.date
                    ]),
                    theme: 'grid',
                    headStyles: { fillColor: [60, 60, 60] },
                  });
                } else {
                  doc.setFontSize(10);
                  doc.setTextColor(150);
                  doc.text('No activity records found.', 14, nextY + 10);
                }

                doc.save('HMS_BloodBank_Registry.pdf');
                showToast('✓ Blood Bank Registry downloaded!');
              } catch (err) {
                console.error('PDF export failed:', err);
                showToast('PDF generation failed. Please try again.', 'error');
              }
            }}
          >
            <i className="bi bi-file-earmark-medical me-2" aria-hidden="true"></i>
            Request Registry
          </button>
          <button 
            className="btn btn-primary px-4 py-2 d-flex align-items-center"
            onClick={() => { setFormData({...formData, type: 'Donation'}); setIsModalOpen(true); }}
          >
            <i className="bi bi-person-plus me-2" aria-hidden="true"></i>
            Add Donor
          </button>
        </div>
      </div>

      <Skeleton name="bloodbank-inventory" loading={loadingInventory}>
        <div className="row g-4 mb-5">
        {[
          'A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'
        ].map(type => {
          const group = bloodGroups.find(g => g.type === type) || { 
            type, units: 0, status: 'Empty', trend: 'Stable' 
          };
          return (
            <div key={type} className="col-md-3">
              <div className="glass-card p-4 transition-all hover-translate-y position-relative h-100 d-flex flex-column">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <div 
                    className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white shadow-sm" 
                    style={{ 
                      width: '48px', 
                      height: '48px', 
                      fontSize: '1.25rem',
                      background: 'linear-gradient(135deg, #ee0000 0%, #a00000 100%)'
                    }}
                  >
                    {type}
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <span 
                      className="px-2 py-1 rounded-pill small fw-bold"
                      style={{ 
                        fontSize: '0.65rem',
                        background: group.status === 'Stable' ? 'rgba(0, 112, 243, 0.1)' : 
                                   group.status === 'Low' ? 'rgba(245, 166, 35, 0.1)' : 'rgba(238, 0, 0, 0.1)',
                        color: group.status === 'Stable' ? 'var(--geist-success)' : 
                               group.status === 'Low' ? 'var(--geist-warning)' : 'var(--geist-error)',
                      }}
                    >
                      {group.status.toUpperCase()}
                    </span>
                    {group.apiId && (
                      <div className="dropdown">
                        <button className="btn btn-sm btn-glass p-0 border-0" data-bs-toggle="dropdown" style={{ width: '20px' }}>
                          <i className="bi bi-three-dots-vertical small"></i>
                        </button>
                        <ul className="dropdown-menu dropdown-menu-end glass-card border shadow-sm">
                          <li><button className="dropdown-item small" onClick={() => openInventoryEditModal(group)}><i className="bi bi-pencil me-2"></i>Edit Stock</button></li>
                          <li><button className="dropdown-item small text-danger" onClick={() => {
                            setDeletingItem(group);
                            setDeletingType('inventory');
                            setIsDeleteModalOpen(true);
                          }}><i className="bi bi-trash me-2"></i>Remove</button></li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
                <h3 className="fw-bold mb-1 fs-2 mt-auto" style={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>{group.units} Units</h3>
                <p className="small text-muted mb-0 fw-medium">Stock Trend: <span className={group.trend?.includes('+') ? 'text-success fw-bold' : 'text-danger fw-bold'}>{group.trend}</span> today</p>
                {group.units === 0 && <div className="text-warning small mt-3 fw-bold"><i className="bi bi-exclamation-triangle me-1"></i>Inventory Empty</div>}
              </div>
            </div>
          );
        })}
        </div>
      </Skeleton>

      <div className="glass-card p-4">
        <h5 className="fw-bold mb-4">Recent Activity Logs</h5>
        <Skeleton name="bloodbank-activities" loading={loadingActivities}>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Group</th>
                <th>Units</th>
                <th>Entity/Person</th>
                <th>Timestamp</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {activities.length === 0 ? (
                <tr>
                   <td colSpan="6" className="p-0">
                      <EmptyState 
                        icon="bi-journal-text"
                        title="No Activity"
                        description="No donation or usage cycles have been logged yet."
                      />
                   </td>
                </tr>
              ) : activities.map((act) => (
                <tr key={act.id}>
                  <td>
                    <span className={`fw-medium ${act.type === 'Donation' ? 'text-success' : 'text-primary'}`}>
                      {act.type}
                    </span>
                  </td>
                  <td className="fw-bold">{act.group}</td>
                  <td style={{ fontVariantNumeric: 'tabular-nums' }}>{act.units}</td>
                  <td className="text-muted">{act.donor || act.hospital}</td>
                  <td className="small text-muted">{act.date}</td>
                  <td className="text-end">
                    <button className="btn btn-sm btn-glass me-2" onClick={() => openActivityEditModal(act)}>
                      <i className="bi bi-pencil"></i>
                    </button>
                    <button className="btn btn-sm btn-glass text-danger" onClick={() => {
                      setDeletingItem(act);
                      setDeletingType('activity');
                      setIsDeleteModalOpen(true);
                    }}>
                      <i className="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </Skeleton>
      </div>

      {/* Log Activity Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Log Blood Bank Activity">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="blood-activity-type" className="form-label text-muted fw-bold small text-uppercase mb-2">Activity Type</label>
            <select 
              id="blood-activity-type"
              className="form-select" 
              value={formData.type}
              onChange={e => setFormData({...formData, type: e.target.value})}
            >
              <option>Donation</option>
              <option>Usage</option>
              <option>Transfer</option>
            </select>
          </div>
          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <label htmlFor="blood-group" className="form-label text-muted fw-bold small text-uppercase mb-2">Blood Group</label>
              <select 
                id="blood-group"
                className="form-select"
                value={formData.blood_group}
                onChange={e => setFormData({...formData, blood_group: e.target.value})}
              >
                <option>A+</option><option>A-</option>
                <option>B+</option><option>B-</option>
                <option>O+</option><option>O-</option>
                <option>AB+</option><option>AB-</option>
              </select>
            </div>
            <div className="col-md-6">
              <label htmlFor="blood-units" className="form-label text-muted fw-bold small text-uppercase mb-2">Units (Bags)</label>
              <input 
                id="blood-units"
                type="number" 
                className="form-control" 
                placeholder="1" 
                min="1"
                value={formData.units}
                onChange={e => setFormData({...formData, units: e.target.value})}
                required
              />
            </div>
          </div>
          <div className="mb-4">
            <label htmlFor="blood-donor-name" className="form-label text-muted fw-bold small text-uppercase mb-2">Entity or Donor Name</label>
            <input 
              id="blood-donor-name"
              type="text" 
              className="form-control" 
              placeholder="e.g. John Doe / City Hospital" 
              value={formData.donor_name}
              onChange={e => setFormData({...formData, donor_name: e.target.value})}
              required
            />
          </div>
          <div className="d-flex gap-2 mt-5">
            <button type="button" className="btn btn-glass w-100 py-2" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary w-100 py-2">Log Activity</button>
          </div>
        </form>
      </Modal>

      {/* Edit Activity Modal */}
      <Modal isOpen={isActivityEditModalOpen} onClose={() => setIsActivityEditModalOpen(false)} title="Edit Activity Record">
        <form onSubmit={handleActivityEditSubmit}>
          <div className="mb-4">
            <label htmlFor="edit-activity-type" className="form-label text-muted fw-bold small text-uppercase mb-2">Activity Type</label>
            <select 
              id="edit-activity-type"
              className="form-select" 
              value={activityEditFormData.type}
              onChange={e => setActivityEditFormData({...activityEditFormData, type: e.target.value})}
            >
              <option>Donation</option>
              <option>Usage</option>
              <option>Transfer</option>
            </select>
          </div>
          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <label htmlFor="edit-blood-group" className="form-label text-muted fw-bold small text-uppercase mb-2">Blood Group</label>
              <select 
                id="edit-blood-group"
                className="form-select"
                value={activityEditFormData.blood_group}
                onChange={e => setActivityEditFormData({...activityEditFormData, blood_group: e.target.value})}
              >
                <option>A+</option><option>A-</option>
                <option>B+</option><option>B-</option>
                <option>O+</option><option>O-</option>
                <option>AB+</option><option>AB-</option>
              </select>
            </div>
            <div className="col-md-6">
              <label htmlFor="edit-blood-units" className="form-label text-muted fw-bold small text-uppercase mb-2">Units (Bags)</label>
              <input 
                id="edit-blood-units"
                type="number" 
                className="form-control" 
                min="1"
                value={activityEditFormData.units}
                onChange={e => setActivityEditFormData({...activityEditFormData, units: e.target.value})}
                required
              />
            </div>
          </div>
          <div className="mb-4">
            <label htmlFor="edit-blood-donor-name" className="form-label text-muted fw-bold small text-uppercase mb-2">Entity or Donor Name</label>
            <input 
              id="edit-blood-donor-name"
              type="text" 
              className="form-control" 
              value={activityEditFormData.donor_name}
              onChange={e => setActivityEditFormData({...activityEditFormData, donor_name: e.target.value})}
              required
            />
          </div>
          <div className="d-flex gap-2 mt-5">
            <button type="button" className="btn btn-glass w-100 py-2" onClick={() => setIsActivityEditModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary w-100 py-2">Save Changes</button>
          </div>
        </form>
      </Modal>

      {/* Edit Inventory Modal */}
      <Modal isOpen={isInventoryEditModalOpen} onClose={() => setIsInventoryEditModalOpen(false)} title={`Edit ${editingInventory?.type} Inventory`}>
        <form onSubmit={handleInventoryEditSubmit}>
          <div className="mb-4">
            <label htmlFor="edit-inv-units" className="form-label text-muted fw-bold small text-uppercase mb-2">Total Units Available</label>
            <input 
              id="edit-inv-units"
              type="number" 
              className="form-control" 
              value={inventoryEditFormData.units}
              onChange={e => setInventoryEditFormData({...inventoryEditFormData, units: e.target.value})}
            />
          </div>
          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <label htmlFor="edit-inv-status" className="form-label text-muted fw-bold small text-uppercase mb-2">Status</label>
              <select 
                id="edit-inv-status"
                className="form-select"
                value={inventoryEditFormData.status}
                onChange={e => setInventoryEditFormData({...inventoryEditFormData, status: e.target.value})}
              >
                <option>Stable</option>
                <option>Low</option>
                <option>Critical</option>
              </select>
            </div>
            <div className="col-md-6">
              <label htmlFor="edit-inv-trend" className="form-label text-muted fw-bold small text-uppercase mb-2">Trend</label>
              <input 
                id="edit-inv-trend"
                type="text" 
                className="form-control" 
                value={inventoryEditFormData.trend}
                onChange={e => setInventoryEditFormData({...inventoryEditFormData, trend: e.target.value})}
                placeholder="e.g. +2 units"
              />
            </div>
          </div>
          <div className="d-flex gap-2 mt-5">
            <button type="button" className="btn btn-glass w-100 py-2" onClick={() => setIsInventoryEditModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary w-100 py-2">Update Inventory</button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <DeleteConfirmation 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        itemName={deletingType === 'activity' ? `Blood ${deletingItem?.type} (${deletingItem?.group})` : `${deletingItem?.type} Inventory`}
        itemType={deletingType === 'activity' ? "Activity Record" : "Inventory Level"}
      />
    </main>
  );
};

export default BloodBank;
