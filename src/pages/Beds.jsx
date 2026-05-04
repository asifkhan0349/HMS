import React, { useState, useMemo } from 'react';
import { useApp, mapBedFromApi, createCode } from '../context/AppContext';
import { useCrud } from '../hooks/useCrud';
import { bedsApi } from '../lib/api';
import Modal from '../components/UI/Modal';
import EmptyState from '../components/UI/EmptyState';
import DeleteConfirmation from '../components/UI/DeleteConfirmation';
import { Skeleton } from 'boneyard-js/react';

const Beds = () => {
  const { showToast, user } = useApp();
  const isDoctor = user?.role === 'Doctor';
  const isNurse = user?.role === 'Nurse';
  const isReception = user?.role === 'Reception';
  const { 
    data: beds, 
    loading,
    addData: addBed, 
    updateData: updateBed, 
    removeData: deleteBed 
  } = useCrud(bedsApi, mapBedFromApi);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingBed, setEditingBed] = useState(null);
  const [deletingBed, setDeletingBed] = useState(null);

  const [formData, setFormData] = useState({
    ward_name: 'General Ward',
    type: 'Standard',
    status: 'Available'
  });

  const [editFormData, setEditFormData] = useState({
    ward_name: '',
    type: '',
    status: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addBed({
        ...formData,
        bed_number: createCode('BED'),
      });
      showToast(`Bed successfully added to ${formData.ward_name}.`);
      setIsModalOpen(false);
      setFormData({ ward_name: 'General Ward', type: 'Standard', status: 'Available' });
    } catch (error) {
      showToast(error.message || 'Unable to add the bed.', 'error');
    }
  };

  const openEditModal = (bed) => {
    setEditingBed(bed);
    setEditFormData({
      ward_name: bed.ward,
      type: bed.type,
      status: bed.status
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateBed(editingBed.apiId, editFormData);
      showToast(`Bed ${editingBed.id} updated successfully.`);
      setIsEditModalOpen(false);
      setEditingBed(null);
    } catch (error) {
      showToast(error.message || 'Unable to update the bed.', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteBed(deletingBed.apiId);
      showToast(`Bed ${deletingBed.id} removed successfully.`);
      setIsDeleteModalOpen(false);
      setDeletingBed(null);
    } catch (error) {
      showToast(error.message || 'Unable to delete the bed.', 'error');
    }
  };

  const wards = useMemo(() => {
    const wardMap = { 'ICU': [], 'General Ward': [], 'Private Rooms': [] };
    beds.forEach(bed => {
       if (!wardMap[bed.ward]) wardMap[bed.ward] = [];
       wardMap[bed.ward].push(bed);
    });
    return Object.keys(wardMap).map(key => ({ name: key, beds: wardMap[key] }));
  }, [beds]);

  return (
    <main className="beds-page p-4">
      <div className="d-flex justify-content-between align-items-center mb-5">
        <div>
          <h2 className="fw-bold mb-1">Bed Management</h2>
          <p className="text-muted mb-0">Monitor real-time bed availability and patient admissions.</p>
        </div>
        <div className="d-flex gap-3 align-items-center">
          <div className="d-flex gap-3 align-items-center px-4 py-2 rounded-2 border" style={{ background: 'var(--accents-1)' }}>
            <span className="text-muted small fw-bold d-flex align-items-center">
              <span className="pulsing-dot me-2" style={{ background: 'var(--geist-success)' }} aria-hidden="true"></span>
              AVAILABLE
            </span>
            <span className="text-muted small fw-bold d-flex align-items-center">
              <span className="pulsing-dot me-2" style={{ background: 'var(--geist-error)' }} aria-hidden="true"></span>
              OCCUPIED
            </span>
          </div>
          <button className="btn btn-primary px-4 py-2" onClick={() => setIsModalOpen(true)}>
             <i className="bi bi-plus-lg me-2" aria-hidden="true"></i>
             Add Bed
          </button>
        </div>
      </div>

      <Skeleton name="beds-grid" loading={loading}>
        {wards.map((ward, wIdx) => (
          <section key={wIdx} className="mb-5" aria-labelledby={`ward-${wIdx}`}>
           <h5 id={`ward-${wIdx}`} className="fw-bold mb-4 d-flex align-items-center">
             {ward.name} 
             <span className="badge rounded-pill ms-3" style={{ fontSize: '0.7rem', background: 'var(--accents-1)', border: '1px solid var(--accents-2)', color: 'var(--geist-foreground)' }}>
                {ward.beds.length} TOTAL
             </span>
           </h5>
           <div className="row g-4">
              {ward.beds.length === 0 ? (
                <div className="col-12 glass-card">
                  <EmptyState 
                    icon="bi-hospital"
                    title="No Beds Configured"
                    description="This ward currently has no beds registered in the system."
                    actionText="Add Bed"
                    onAction={() => setIsModalOpen(true)}
                  />
                </div>
              ) : ward.beds.map((bed, bIdx) => (
                <div key={bIdx} className="col-6 col-md-3 col-lg-2">
                    <div className="position-relative h-100">
                      <button 
                        className="glass-card p-4 text-center border w-100 h-100 transition-all hover-translate-y" 
                        onClick={() => !(isDoctor || isNurse || isReception) && openEditModal(bed)}
                        aria-label={`Edit Bed ${bed.id}, ${bed.status}`}
                        style={{ 
                          background: 'var(--geist-background)',
                          borderColor: 'var(--accents-2)',
                          cursor: (isDoctor || isNurse || isReception) ? 'default' : 'pointer'
                        }}
                      >
                         <div className={`bg-accents-1 rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center border`} style={{ width: '48px', height: '48px', background: 'var(--accents-1)' }}>
                           <i className={`bi bi-door-closed fs-5 ${
                              bed.status === 'Available' ? 'text-success' : 
                              bed.status === 'Occupied' ? 'text-danger' : 
                              'text-warning'
                           }`} aria-hidden="true"></i>
                         </div>
                         
                         <h6 className="fw-bold mb-1" style={{ fontVariantNumeric: 'tabular-nums' }}>BED {bed.id}</h6>
                         <small className="text-muted d-block text-uppercase" style={{ fontSize: '0.6rem', letterSpacing: '0.05em' }}>{bed.type}</small>
                         <small 
                           className="mt-2 d-inline-block fw-bold" 
                           style={{ 
                               fontSize: '0.65rem',
                               color: bed.status === 'Available' ? 'var(--geist-success)' : bed.status === 'Occupied' ? 'var(--geist-error)' : 'var(--geist-warning)'
                           }}
                         >
                           {bed.status.toUpperCase()}
                         </small>
                      </button>
                      {!(isDoctor || isNurse || isReception) && (
                        <button 
                          className="btn btn-sm btn-glass text-danger position-absolute top-0 end-0 m-2 p-0 d-flex align-items-center justify-content-center"
                          style={{ width: '24px', height: '24px', borderRadius: '50%', zIndex: 10 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingBed(bed);
                            setIsDeleteModalOpen(true);
                          }}
                          title="Delete Bed"
                        >
                          <i className="bi bi-x" aria-hidden="true"></i>
                        </button>
                      )}
                    </div>
                </div>
              ))}
           </div>
        </section>
        ))}
      </Skeleton>

      {/* Add Bed Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Bed">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="bed-ward-name" className="form-label text-muted fw-bold small text-uppercase mb-2">Ward Name</label>
            <select 
              id="bed-ward-name"
              className="form-select" 
              value={formData.ward_name}
              onChange={e => setFormData({...formData, ward_name: e.target.value})}
            >
              <option>General Ward</option>
              <option>ICU</option>
              <option>Private Rooms</option>
              <option>Emergency Room</option>
            </select>
          </div>
          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <label htmlFor="bed-type" className="form-label text-muted fw-bold small text-uppercase mb-2">Bed Type</label>
              <select 
                id="bed-type"
                className="form-select"
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value})}
              >
                <option>Standard</option>
                <option>ICU Bed</option>
                <option>Maternity</option>
                <option>Pediatric</option>
              </select>
            </div>
            <div className="col-md-6">
              <label htmlFor="bed-status" className="form-label text-muted fw-bold small text-uppercase mb-2">Initial Status</label>
              <select 
                id="bed-status"
                className="form-select"
                value={formData.status}
                onChange={e => setFormData({...formData, status: e.target.value})}
              >
                <option>Available</option>
                <option>Occupied</option>
                <option>Maintenance</option>
              </select>
            </div>
          </div>
          <div className="d-flex gap-2 mt-5">
            <button type="button" className="btn btn-glass w-100 py-2" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary w-100 py-2">Add Bed</button>
          </div>
        </form>
      </Modal>

      {/* Edit Bed Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Bed Details">
        <form onSubmit={handleEditSubmit}>
          <div className="mb-4">
            <label htmlFor="edit-bed-ward-name" className="form-label text-muted fw-bold small text-uppercase mb-2">Ward Name</label>
            <select 
              id="edit-bed-ward-name"
              className="form-select" 
              value={editFormData.ward_name}
              onChange={e => setEditFormData({...editFormData, ward_name: e.target.value})}
            >
              <option>General Ward</option>
              <option>ICU</option>
              <option>Private Rooms</option>
              <option>Emergency Room</option>
            </select>
          </div>
          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <label htmlFor="edit-bed-type" className="form-label text-muted fw-bold small text-uppercase mb-2">Bed Type</label>
              <select 
                id="edit-bed-type"
                className="form-select"
                value={editFormData.type}
                onChange={e => setEditFormData({...editFormData, type: e.target.value})}
              >
                <option>Standard</option>
                <option>ICU Bed</option>
                <option>Maternity</option>
                <option>Pediatric</option>
              </select>
            </div>
            <div className="col-md-6">
              <label htmlFor="edit-bed-status" className="form-label text-muted fw-bold small text-uppercase mb-2">Status</label>
              <select 
                id="edit-bed-status"
                className="form-select"
                value={editFormData.status}
                onChange={e => setEditFormData({...editFormData, status: e.target.value})}
              >
                <option>Available</option>
                <option>Occupied</option>
                <option>Maintenance</option>
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
        itemName={`Bed ${deletingBed?.id}`}
        itemType="Hospital Bed"
      />
    </main>
  );
};

export default Beds;
