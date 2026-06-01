import React, { useState, useMemo } from 'react';
import { useApp, mapBedFromApi, mapPatientFromApi, createCode } from '../context/AppContext';
import { useCrud } from '../hooks/useCrud';
import { bedsApi, patientsApi } from '../lib/api';
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
    data: beds = [],
    loading,
    addData: addBed,
    updateData: updateBed,
    removeData: deleteBed
  } = useCrud(bedsApi, mapBedFromApi);

  const { data: patients = [] } = useCrud(patientsApi, mapPatientFromApi);
  const inpatientList = patients.filter(p => p.status === 'Inpatient');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingBed, setEditingBed] = useState(null);
  const [deletingBed, setDeletingBed] = useState(null);

  // Filter available inpatients who are not already assigned to an occupied bed
  const availableInpatientsForAdd = inpatientList.filter(p => {
    return !beds.some(b => b.status === 'Occupied' && b.patientName === p.name);
  });

  const availableInpatientsForEdit = inpatientList.filter(p => {
    const assignedBed = beds.find(b => b.status === 'Occupied' && b.patientName === p.name);
    return !assignedBed || assignedBed.id === editingBed?.id;
  });
  const [validationErrors, setValidationErrors] = useState({});

  const [formData, setFormData] = useState({
    ward_name: 'General Ward',
    type: 'Standard',
    status: 'Available',
    patient_name: '',
    allotment_reason: ''
  });

  const [editFormData, setEditFormData] = useState({
    ward_name: '',
    type: '',
    status: '',
    patient_name: '',
    allotment_reason: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!formData.ward_name) errors.ward_name = true;
    if (!formData.type) errors.type = true;
    if (!formData.status) errors.status = true;
    if (formData.status === 'Occupied') {
      if (!formData.patient_name) errors.patient_name = true;
      if (!formData.allotment_reason) errors.allotment_reason = true;
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      showToast('Please fill in all mandatory fields highlighted in red.', 'warning');
      return;
    }
    setValidationErrors({});

    try {
      await addBed({
        ...formData,
        patient_name: formData.status === 'Occupied' ? formData.patient_name : null,
        allotment_reason: formData.status === 'Occupied' ? formData.allotment_reason : null,
        bed_number: `BED-${Math.floor(100000 + Math.random() * 900000)}`,
      });
      showToast(`Bed successfully added to ${formData.ward_name}.`);
      setIsModalOpen(false);
      setFormData({ ward_name: 'General Ward', type: 'Standard', status: 'Available', patient_name: '', allotment_reason: '' });
    } catch (error) {
      showToast(error.message || 'Unable to add the bed.', 'error');
    }
  };

  const openEditModal = (bed) => {
    setEditingBed(bed);
    setEditFormData({
      ward_name: bed.ward,
      type: bed.type,
      status: bed.status,
      patient_name: bed.patientName || '',
      allotment_reason: bed.allotmentReason || ''
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!editFormData.ward_name) errors.ward_name = true;
    if (!editFormData.type) errors.type = true;
    if (!editFormData.status) errors.status = true;
    if (editFormData.status === 'Occupied') {
      if (!editFormData.patient_name) errors.patient_name = true;
      if (!editFormData.allotment_reason) errors.allotment_reason = true;
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      showToast('Please fill in all mandatory fields highlighted in red.', 'warning');
      return;
    }
    setValidationErrors({});

    try {
      await updateBed(editingBed.apiId, {
        ...editFormData,
        patient_name: editFormData.status === 'Occupied' ? editFormData.patient_name : null,
        allotment_reason: editFormData.status === 'Occupied' ? editFormData.allotment_reason : null,
      });
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
    return Object.keys(wardMap).map(key => {
      const wardBeds = wardMap[key];
      const available = wardBeds.filter(b => b.status === 'Available').length;
      const occupied = wardBeds.filter(b => b.status === 'Occupied').length;
      const maintenance = wardBeds.filter(b => b.status === 'Maintenance').length;
      return {
        name: key,
        beds: wardBeds,
        stats: {
          available,
          occupied,
          maintenance,
          total: wardBeds.length
        }
      };
    });
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
            <h5 id={`ward-${wIdx}`} className="fw-bold mb-4 d-flex align-items-center flex-wrap gap-2">
              <span>{ward.name}</span>
              <span className="badge rounded-pill ms-2" style={{ fontSize: '0.7rem', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.25)', color: '#10b981', fontVariantNumeric: 'tabular-nums' }}>
                {ward.stats.available} Available
              </span>
              <span className="badge rounded-pill" style={{ fontSize: '0.7rem', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.25)', color: '#ef4444', fontVariantNumeric: 'tabular-nums' }}>
                {ward.stats.occupied} Occupied
              </span>
              <span className="badge rounded-pill" style={{ fontSize: '0.7rem', background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.25)', color: '#f59e0b', fontVariantNumeric: 'tabular-nums' }}>
                {ward.stats.maintenance} Maintenance
              </span>
              <span className="badge rounded-pill" style={{ fontSize: '0.7rem', background: 'var(--accents-1)', border: '1px solid var(--accents-2)', color: 'var(--geist-foreground)', fontVariantNumeric: 'tabular-nums' }}>
                {ward.stats.total} Total
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
                        <i className={`bi bi-door-closed fs-5 ${bed.status === 'Available' ? 'text-success' :
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
                          color: bed.status === 'Available'
                            ? 'green'
                            : bed.status === 'Occupied'
                              ? 'red'
                              : 'orange'
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
            <label htmlFor="bed-ward-name" className="form-label text-muted fw-bold small text-uppercase mb-2 required-label">Ward Name</label>
            <select
              id="bed-ward-name"
              className={`form-select ${validationErrors.ward_name ? 'is-invalid' : ''}`}
              value={formData.ward_name}
              onChange={e => setFormData({ ...formData, ward_name: e.target.value })}
            >
              <option>General Ward</option>
              <option>ICU</option>
              <option>Private Rooms</option>
              <option>Emergency Room</option>
            </select>
          </div>
          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <label htmlFor="bed-type" className="form-label text-muted fw-bold small text-uppercase mb-2 required-label">Bed Type</label>
              <select
                id="bed-type"
                className={`form-select ${validationErrors.type ? 'is-invalid' : ''}`}
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value })}
              >
                <option>Standard</option>
                <option>ICU Bed</option>
                <option>Maternity</option>
                <option>Pediatric</option>
              </select>
            </div>
            <div className="col-md-6">
              <label htmlFor="bed-status" className="form-label text-muted fw-bold small text-uppercase mb-2 required-label">Initial Status</label>
              <select
                id="bed-status"
                className={`form-select ${validationErrors.status ? 'is-invalid' : ''}`}
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value })}
              >
                <option>Available</option>
                <option>Occupied</option>
                <option>Maintenance</option>
              </select>
            </div>
          </div>
          {formData.status === 'Occupied' && (
            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <label htmlFor="bed-patient" className="form-label text-muted fw-bold small text-uppercase mb-2 required-label">Patient</label>
                <select
                  id="bed-patient"
                  className={`form-select ${validationErrors.patient_name ? 'is-invalid' : ''}`}
                  value={formData.patient_name}
                  onChange={e => setFormData({ ...formData, patient_name: e.target.value })}
                >
                  <option value="">Select Inpatient...</option>
                  {availableInpatientsForAdd.map(p => <option key={p.id} value={p.name}>{p.name} ({p.patientCode})</option>)}
                </select>
              </div>
              <div className="col-md-6">
                <label htmlFor="bed-reason" className="form-label text-muted fw-bold small text-uppercase mb-2 required-label">Allotment Reason</label>
                <input
                  id="bed-reason"
                  type="text"
                  className={`form-control ${validationErrors.allotment_reason ? 'is-invalid' : ''}`}
                  placeholder="e.g. Post-surgery recovery"
                  value={formData.allotment_reason}
                  onChange={e => setFormData({ ...formData, allotment_reason: e.target.value })}
                />
              </div>
            </div>
          )}
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
            <label htmlFor="edit-bed-ward-name" className="form-label text-muted fw-bold small text-uppercase mb-2 required-label">Ward Name</label>
            <select
              id="edit-bed-ward-name"
              className={`form-select ${validationErrors.ward_name ? 'is-invalid' : ''}`}
              value={editFormData.ward_name}
              onChange={e => setEditFormData({ ...editFormData, ward_name: e.target.value })}
            >
              <option>General Ward</option>
              <option>ICU</option>
              <option>Private Rooms</option>
              <option>Emergency Room</option>
            </select>
          </div>
          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <label htmlFor="edit-bed-type" className="form-label text-muted fw-bold small text-uppercase mb-2 required-label">Bed Type</label>
              <select
                id="edit-bed-type"
                className={`form-select ${validationErrors.type ? 'is-invalid' : ''}`}
                value={editFormData.type}
                onChange={e => setEditFormData({ ...editFormData, type: e.target.value })}
              >
                <option>Standard</option>
                <option>ICU Bed</option>
                <option>Maternity</option>
                <option>Pediatric</option>
              </select>
            </div>
            <div className="col-md-6">
              <label htmlFor="edit-bed-status" className="form-label text-muted fw-bold small text-uppercase mb-2 required-label">Status</label>
              <select
                id="edit-bed-status"
                className={`form-select ${validationErrors.status ? 'is-invalid' : ''}`}
                value={editFormData.status}
                onChange={e => setEditFormData({ ...editFormData, status: e.target.value })}
              >
                <option>Available</option>
                <option>Occupied</option>
                <option>Maintenance</option>
              </select>
            </div>
          </div>
          {editFormData.status === 'Occupied' && (
            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <label htmlFor="edit-bed-patient" className="form-label text-muted fw-bold small text-uppercase mb-2 required-label">Patient</label>
                <select
                  id="edit-bed-patient"
                  className={`form-select ${validationErrors.patient_name ? 'is-invalid' : ''}`}
                  value={editFormData.patient_name}
                  onChange={e => setEditFormData({ ...editFormData, patient_name: e.target.value })}
                >
                  <option value="">Select Inpatient...</option>
                  {availableInpatientsForEdit.map(p => <option key={p.id} value={p.name}>{p.name} ({p.patientCode})</option>)}
                </select>
              </div>
              <div className="col-md-6">
                <label htmlFor="edit-bed-reason" className="form-label text-muted fw-bold small text-uppercase mb-2 required-label">Allotment Reason</label>
                <input
                  id="edit-bed-reason"
                  type="text"
                  className={`form-control ${validationErrors.allotment_reason ? 'is-invalid' : ''}`}
                  placeholder="e.g. Post-surgery recovery"
                  value={editFormData.allotment_reason}
                  onChange={e => setEditFormData({ ...editFormData, allotment_reason: e.target.value })}
                />
              </div>
            </div>
          )}
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
