import React, { useMemo, useState } from 'react';
import { useApp, mapRecordFromApi, mapPatientFromApi, mapStaffFromApi, createCode } from '../context/AppContext';
import { useCrud } from '../hooks/useCrud';
import { recordsApi, patientsApi, staffApi } from '../lib/api';
import Modal from '../components/UI/Modal';
import EmptyState from '../components/UI/EmptyState';
import DeleteConfirmation from '../components/UI/DeleteConfirmation';
import { Skeleton } from 'boneyard-js/react';

const EMR = () => {
  const createDraftRecord = () => ({
    patient: '',
    doctor: '',
    diagnosis: '',
    prescription: '',
    clinicalId: createCode('CID'),
  });

  const { showToast, user } = useApp();
  const isPatient = user?.role?.toLowerCase() === 'patient';
  const { 
    data: records, 
    loading, 
    addData: addRecord, 
    updateData: updateRecord,
    removeData: deleteRecord
  } = useCrud(recordsApi, mapRecordFromApi);
  
  const { data: patients } = useCrud(patientsApi, mapPatientFromApi);
  const { data: staff } = useCrud(staffApi, mapStaffFromApi, { enabled: !isPatient });
  const doctorOptions = [...new Set(staff.filter(s => s.role === 'Doctor').map(s => s.name))];
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [deletingRecord, setDeletingRecord] = useState(null);
  
  const [formData, setFormData] = useState(createDraftRecord);
  const [editFormData, setEditFormData] = useState({
    patient: '',
    doctor: '',
    diagnosis: '',
    prescription: '',
    clinicalId: '',
  });

  const recordSummary = useMemo(
    () => ({
      total: records.length,
      recent: records.slice(0, 3).length,
    }),
    [records]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patient || !formData.diagnosis) {
      showToast('Please specify patient and diagnosis for the EMR entry.', 'warning');
      return;
    }
    try {
      await addRecord({
        clinical_id: formData.clinicalId,
        record_date: new Date().toISOString().slice(0, 10),
        patient_name: formData.patient,
        doctor_name: formData.doctor,
        diagnosis: formData.diagnosis,
        prescription: formData.prescription,
        record_code: createCode('REC'),
      });
      showToast(`Medical record for ${formData.patient} successfully encrypted and stored.`);
      setIsModalOpen(false);
      setFormData(createDraftRecord());
    } catch (error) {
      showToast(error.message || 'Unable to save the EMR entry.', 'error');
    }
  };

  const openEditModal = (record) => {
    setEditingRecord(record);
    setEditFormData({
      patient: record.patient,
      doctor: record.doctor,
      diagnosis: record.diagnosis,
      prescription: record.prescription || '',
      clinicalId: record.clinicalId,
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        patient_name: editFormData.patient,
        doctor_name: editFormData.doctor,
        diagnosis: editFormData.diagnosis,
        prescription: editFormData.prescription,
      };
      await updateRecord(editingRecord.apiId, payload);
      showToast(`Medical record for ${editFormData.patient} updated successfully.`);
      setIsEditModalOpen(false);
      setEditingRecord(null);
    } catch (error) {
      showToast(error.message || 'Unable to update medical record.', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteRecord(deletingRecord.apiId);
      showToast(`Medical record for ${deletingRecord.patient} removed from registry.`);
      setIsDeleteModalOpen(false);
      setDeletingRecord(null);
    } catch (error) {
      showToast(error.message || 'Unable to delete medical record.', 'error');
    }
  };

  return (
    <div className="emr-page">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-0">Electronic Medical Records</h2>
          <p className="text-white opacity-75 mb-0">Encrypted clinical history and diagnostic telemetry.</p>
        </div>
        {!isPatient && (
          <button className="btn btn-primary px-4 py-2 rounded-3 shadow-sm" onClick={() => setIsModalOpen(true)}>
            <i className="bi bi-file-earmark-plus me-2"></i>New EMR Entry
          </button>
        )}
      </div>

      <div className="glass-card p-0 overflow-hidden shadow-lg border-0">
        <div className="p-4 border-bottom d-flex justify-content-between align-items-center">
          <h5 className="fw-bold mb-0">Encrypted Record History</h5>
          <div className="text-muted small">Backend records loaded: {recordSummary.total}</div>
        </div>
        <Skeleton name="emr-table" loading={loading}>
        <div className="table-responsive">
          <table className="table table-hover mb-0 align-middle">
            <thead>
              <tr>
                <th className="px-4 py-4">Record ID</th>
                <th className="py-4">Clinical ID</th>
                <th className="py-4">Entry Date</th>
                <th className="py-4">Patient Identity</th>
                <th className="py-4">Clinician</th>
                <th className="py-4">Primary Diagnosis</th>
                <th className="px-4 py-4 text-end">Electronic Validation</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-0">
                    <EmptyState 
                      icon="bi-file-earmark-medical"
                      title="No Clinical Records"
                      description="Electronic health history is currently empty for the selected clinical scope."
                      actionText={isPatient ? undefined : "New EMR Entry"}
                      onAction={isPatient ? undefined : () => setIsModalOpen(true)}
                    />
                  </td>
                </tr>
              ) : records.map((record) => (
                <tr key={record.id}>
                  <td className="px-4 py-4 fw-bold gradient-text">{record.id}</td>
                  <td className="py-4 text-white opacity-75">{record.clinicalId}</td>
                  <td className="py-4 text-white opacity-50 small">{record.date}</td>
                  <td className="py-4 fw-bold text-white">{record.patient}</td>
                  <td className="py-4 text-white-50 small">{record.doctor}</td>
                  <td className="py-4">
                    <span className="badge-soft-success px-3 py-1 rounded-pill">{record.diagnosis}</span>
                  </td>
                  <td className="px-4 py-4 text-end">
                    {!isPatient && (
                      <>
                        <button
                          className="btn btn-sm btn-glass me-2"
                          onClick={() => openEditModal(record)}
                          title="Edit Record"
                        >
                          <i className="bi bi-pencil-square"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-glass text-danger"
                          onClick={() => {
                            setDeletingRecord(record);
                            setIsDeleteModalOpen(true);
                          }}
                          title="Delete Record"
                        >
                          <i className="bi bi-trash3"></i>
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </Skeleton>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Electronic Clinical Entry Protocol">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="emr-patient" className="form-label text-accent fw-bold small text-uppercase mb-2" style={{ letterSpacing: '1px' }}>
              Patient Identity
            </label>
            <select
              id="emr-patient"
              className="form-select"
              value={formData.patient}
              onChange={(e) => setFormData({ ...formData, patient: e.target.value })}
            >
              <option value="">Select an active patient profile...</option>
              {patients.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name} ({p.id})
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label htmlFor="emr-diagnosis" className="form-label text-accent fw-bold small text-uppercase mb-2" style={{ letterSpacing: '1px' }}>
              Clinical Diagnosis Telemetry
            </label>
            <input
              id="emr-diagnosis"
              type="text"
              className="form-control"
              placeholder="e.g. Acute Respiratory Infection"
              value={formData.diagnosis}
              onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
            />
          </div>
          <div className="mb-4">
            <label htmlFor="emr-prescription" className="form-label text-accent fw-bold small text-uppercase mb-2" style={{ letterSpacing: '1px' }}>
              Medical Prescription Protocol
            </label>
            <textarea
              id="emr-prescription"
              className="form-control"
              rows="3"
              placeholder="List pharmaceutical interventions..."
              value={formData.prescription}
              onChange={(e) => setFormData({ ...formData, prescription: e.target.value })}
            ></textarea>
          </div>
          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <label htmlFor="emr-doctor" className="form-label text-accent fw-bold small text-uppercase mb-2" style={{ letterSpacing: '1px' }}>
                Attending Clinician
              </label>
              <input
                id="emr-doctor"
                type="text"
                className="form-control"
                value={formData.doctor}
                onChange={(e) => setFormData({ ...formData, doctor: e.target.value })}
                list="emr-doctor-options"
                placeholder="Enter clinician name"
              />
              <datalist id="emr-doctor-options">
                {doctorOptions.map((doctor) => (
                  <option key={doctor} value={doctor} />
                ))}
              </datalist>
            </div>
            <div className="col-md-6">
              <label htmlFor="emr-clinical-id" className="form-label text-accent fw-bold small text-uppercase mb-2" style={{ letterSpacing: '1px' }}>
                Clinical Reference ID
              </label>
              <input id="emr-clinical-id" type="text" className="form-control opacity-50" value={formData.clinicalId} readOnly />
            </div>
          </div>
          <div className="d-flex gap-3 mt-5">
            <button type="button" className="btn btn-glass w-100 py-3" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary w-100 py-3">
              Finalize Entry
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit EMR Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Update Clinical Record">
        {editingRecord && (
          <form onSubmit={handleEditSubmit}>
            <div className="mb-4">
              <label htmlFor="edit-emr-patient" className="form-label text-accent fw-bold small text-uppercase mb-2" style={{ letterSpacing: '1px' }}>
                Patient Identity
              </label>
              <select
                id="edit-emr-patient"
                className="form-select"
                value={editFormData.patient}
                onChange={(e) => setEditFormData({ ...editFormData, patient: e.target.value })}
              >
                <option value="">Select an active patient profile...</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name} ({p.id})
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label htmlFor="edit-emr-diagnosis" className="form-label text-accent fw-bold small text-uppercase mb-2" style={{ letterSpacing: '1px' }}>
                Clinical Diagnosis Telemetry
              </label>
              <input
                id="edit-emr-diagnosis"
                type="text"
                className="form-control"
                value={editFormData.diagnosis}
                onChange={(e) => setEditFormData({ ...editFormData, diagnosis: e.target.value })}
              />
            </div>
            <div className="mb-4">
              <label htmlFor="edit-emr-prescription" className="form-label text-accent fw-bold small text-uppercase mb-2" style={{ letterSpacing: '1px' }}>
                Medical Prescription Protocol
              </label>
              <textarea
                id="edit-emr-prescription"
                className="form-control"
                rows="3"
                value={editFormData.prescription}
                onChange={(e) => setEditFormData({ ...editFormData, prescription: e.target.value })}
              ></textarea>
            </div>
            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <label htmlFor="edit-emr-doctor" className="form-label text-accent fw-bold small text-uppercase mb-2" style={{ letterSpacing: '1px' }}>
                  Attending Clinician
                </label>
                <input
                  id="edit-emr-doctor"
                  type="text"
                  className="form-control"
                  value={editFormData.doctor}
                  onChange={(e) => setEditFormData({ ...editFormData, doctor: e.target.value })}
                  list="emr-doctor-options"
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="edit-emr-clinical-id" className="form-label text-accent fw-bold small text-uppercase mb-2" style={{ letterSpacing: '1px' }}>
                  Clinical Reference ID
                </label>
                <input id="edit-emr-clinical-id" type="text" className="form-control opacity-25" value={editFormData.clinicalId} readOnly />
              </div>
            </div>
            <div className="d-flex gap-3 mt-5">
              <button type="button" className="btn btn-glass w-100 py-3" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary w-100 py-3">
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
        itemName={`Record for ${deletingRecord?.patient}`}
        itemType="Medical Record"
      />
    </div>
  );
};

export default EMR;
