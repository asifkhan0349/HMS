import React, { memo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp, mapPatientFromApi, createCode } from '../context/AppContext';
import { useCrud } from '../hooks/useCrud';
import { patientsApi } from '../lib/api';
import Modal from '../components/UI/Modal';
import EmptyState from '../components/UI/EmptyState';
import DeleteConfirmation from '../components/UI/DeleteConfirmation';
import Pagination from '../components/UI/Pagination';
import { Skeleton } from 'boneyard-js/react';
import { usePagination } from '../hooks/usePagination';

// Memoized individual row
const PatientRow = memo(({ patient, onEdit, onDelete, isPatient, isDoctor, isNurse, isReception }) => {
  const navigate = useNavigate();
  return (
    <tr>
      <td className="px-4 py-4 fw-bold" style={{ fontVariantNumeric: 'tabular-nums' }}>{patient.id}</td>
      <td className="py-4">
        <div className="d-flex align-items-center">
          <div>
            <h6 className="mb-0 fw-bold">{patient.name}</h6>
            <small className="text-muted">{patient.gender}, {patient.age}y</small>
          </div>
        </div>
      </td>
      <td className="py-4">
        <span className="badge rounded-pill" style={{ background: 'var(--accents-1)', color: 'var(--geist-foreground)', border: '1px solid var(--accents-2)' }}>
          {patient.bloodGroup}
        </span>
      </td>
      <td className="py-4 text-muted small" style={{ fontVariantNumeric: 'tabular-nums' }}>
        {patient.phoneNumber || '-'}
      </td>
      <td className="py-4 text-muted small">
        {patient.email || '-'}
      </td>
      <td className="py-4 text-muted small" style={{ fontVariantNumeric: 'tabular-nums' }}>{patient.lastVisit}</td>
      <td className="py-4">
        <span className={`badge rounded-pill px-3 py-1 border`} style={{ 
            background: patient.status === 'Inpatient' ? 'rgba(0, 112, 243, 0.1)' : 'rgba(16, 185, 129, 0.1)',
            color: patient.status === 'Inpatient' ? 'var(--geist-success)' : 'var(--geist-success)',
            borderColor: patient.status === 'Inpatient' ? 'rgba(0, 112, 243, 0.2)' : 'rgba(16, 185, 129, 0.2)',
            fontSize: '0.75rem'
        }}>
          <span className="pulsing-dot me-2" aria-hidden="true" style={{ width: '6px', height: '6px' }}></span>
          {patient.status}
        </span>
      </td>
      {!isPatient && (
        <td className="px-4 py-4 text-end">
          {!(isDoctor || isNurse || isReception) && (
            <button 
              className="btn btn-primary btn-sm px-3 me-2"
              onClick={() => navigate('/emr')}
            >
              EHR
            </button>
          )}
          {!(isDoctor || isNurse || isReception) && (
            <>
            <button 
              className="btn btn-sm btn-glass me-2"
              onClick={() => onEdit(patient)}
              title="Edit Patient"
            >
              <i className="bi bi-pencil-square"></i>
            </button>
            <button 
              className="btn btn-sm btn-glass text-danger"
              onClick={() => onDelete(patient)}
              title="Delete Patient"
            >
              <i className="bi bi-trash3"></i>
            </button>
            </>
          )}
        </td>
      )}
    </tr>
  );
});

const Patients = () => {
  const { showToast, user } = useApp();
  const isPatient = user?.role?.toLowerCase() === 'patient';
  const isDoctor = user?.role === 'Doctor';
  const isNurse = user?.role === 'Nurse';
  const isReception = user?.role === 'Reception';
  const [searchParams, setSearchParams] = useSearchParams();
  const [localSearch, setLocalSearch] = useState(searchParams.get('search') || '');
  const { 
    data: patients, 
    loading, 
    addData: addPatient, 
    updateData: updatePatient,
    removeData: deletePatient
  } = useCrud(patientsApi, mapPatientFromApi);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [deletingPatient, setDeletingPatient] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '', age: '', gender: 'Male', bloodGroup: 'O+', phoneNumber: '', email: '', emergencyContact1: '', emergencyContact2: '', status: 'Outpatient'
  });

  const [editFormData, setEditFormData] = useState({
    name: '', age: '', gender: 'Male', bloodGroup: 'O+', phoneNumber: '', email: '', emergencyContact1: '', emergencyContact2: '', status: 'Outpatient'
  });

  const {
    paginatedData: paginatedPatients,
    currentPage,
    totalPages,
    rowsPerPage,
    totalItems,
    onPageChange,
    onRowsPerPageChange
  } = usePagination(
    patients.filter(p => {
      const q = (searchParams.get('search') || '').toLowerCase();
      if (!q) return true;
      return p.name.toLowerCase().includes(q) || 
             p.id.toString().includes(q) || 
             p.patientCode.toLowerCase().includes(q) ||
             p.bloodGroup.toLowerCase().includes(q);
    })
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.age || !formData.phoneNumber) {
      showToast('Please fill in all clinical identifiers.', 'warning');
      return;
    }
    try {
      const payload = {
        name: formData.name,
        age: parseInt(formData.age),
        gender: formData.gender,
        blood_group: formData.bloodGroup,
        phone_number: formData.phoneNumber,
        email: formData.email.trim() || null,
        emergency_contact_1: formData.emergencyContact1.trim() || null,
        emergency_contact_2: formData.emergencyContact2.trim() || null,
        patient_code: createCode('P'),
        status: formData.status,
        last_visit: new Date().toISOString().split('T')[0]
      };
      await addPatient(payload);
      showToast(`Patient ${formData.name} registered successfully.`);
      setIsModalOpen(false);
      setFormData({ name: '', age: '', gender: 'Male', bloodGroup: 'O+', phoneNumber: '', email: '', emergencyContact1: '', emergencyContact2: '', status: 'Outpatient' });
    } catch (error) {
      showToast(error.message || 'Unable to register the patient.', 'error');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: editFormData.name,
        age: parseInt(editFormData.age),
        gender: editFormData.gender,
        blood_group: editFormData.bloodGroup,
        phone_number: editFormData.phoneNumber,
        email: editFormData.email.trim() || null,
        emergency_contact_1: editFormData.emergencyContact1.trim() || null,
        emergency_contact_2: editFormData.emergencyContact2.trim() || null,
        status: editFormData.status
      };
      await updatePatient(editingPatient.apiId, payload);
      showToast(`Patient profile for ${editFormData.name} updated.`);
      setIsEditModalOpen(false);
      setEditingPatient(null);
    } catch (error) {
      showToast(error.message || 'Unable to update patient profile.', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await deletePatient(deletingPatient.apiId);
      showToast(`Patient record for ${deletingPatient.name} removed from registry.`);
      setIsDeleteModalOpen(false);
      setDeletingPatient(null);
    } catch (error) {
      showToast(error.message || 'Unable to delete patient record.', 'error');
    }
  };

  const openEditModal = (p) => {
    setEditingPatient(p);
    setEditFormData({
      name: p.name,
      age: p.age,
      gender: p.gender,
      bloodGroup: p.bloodGroup,
      phoneNumber: p.phoneNumber,
      email: p.email,
      emergencyContact1: p.emergencyContact1 || '',
      emergencyContact2: p.emergencyContact2 || '',
      status: p.status
    });
    setIsEditModalOpen(true);
  };



  return (
    <main className="patients-page p-4">
      <div className="d-flex justify-content-between align-items-center mb-5">
        <div>
          <h2 className="fw-bold mb-1">Patient Registry</h2>
          <p className="text-muted mb-0">Manage patient records and hospital admissions.</p>
        </div>
        <button 
          className="btn btn-primary px-4 py-2"
          onClick={() => setIsModalOpen(true)}
        >
          <i className="bi bi-person-plus me-2" aria-hidden="true"></i>
          Register Patient
        </button>
      </div>

      <div className="glass-card p-0 overflow-hidden border">
        <div className="p-4 border-bottom d-flex justify-content-between align-items-center bg-accents-1" style={{ background: 'var(--accents-1)' }}>
          <h6 className="fw-bold mb-0">Active Patients</h6>
          <div className="input-group w-50">
            <span className="input-group-text bg-transparent border-end-0 border-accents-2 opacity-50"><i className="bi bi-search" aria-hidden="true"></i></span>
            <input 
              type="text" 
              className="form-control border-start-0 ps-0 py-1" 
              placeholder="Filter by name, ID, or blood group…" 
              value={localSearch}
              onChange={(e) => {
                const val = e.target.value;
                setLocalSearch(val);
                setSearchParams(val ? { search: val } : {});
              }}
            />
          </div>
        </div>
        <Skeleton name="patients-table" loading={loading}>
          <div className="table-responsive">
            <table className="table table-hover mb-0 align-middle">
            <thead>
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="py-3">Patient Name</th>
                <th className="py-3">Blood Group</th>
                <th className="py-3">Phone Number</th>
                <th className="py-3">Email</th>
                <th className="py-3">Last Visit</th>
                <th className="py-3">Status</th>
                {!isPatient && !(isDoctor || isNurse || isReception) && <th className="px-4 py-3 text-end">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {patients.length === 0 ? (
                <tr>
                  <td colSpan={isPatient ? 7 : 8} className="p-0">
                    <EmptyState 
                      icon="bi-people"
                      title="No patients registered yet"
                      description="Your patient registry is currently empty. Start by registering a new patient profile to track clinical outcomes."
                      actionText="Register Patient"
                      onAction={() => setIsModalOpen(true)}
                    />
                  </td>
                </tr>
              ) : paginatedPatients.length === 0 ? (
                <tr>
                  <td colSpan={isPatient ? 7 : 8} className="p-0">
                    <EmptyState 
                      icon="bi-person-x"
                      title="No matching patients found"
                      description={`We couldn't find any outcomes matching "${searchParams.get('search') || ''}" in your registry.`}
                      actionText="Clear Search"
                      onAction={() => { setLocalSearch(''); setSearchParams({}); }}
                    />
                  </td>
                </tr>
              ) : paginatedPatients.map((p) => (
                <PatientRow 
                  key={p.id} 
                  patient={p} 
                  onEdit={openEditModal}
                  onDelete={(p) => { setDeletingPatient(p); setIsDeleteModalOpen(true); }}
                  isPatient={isPatient}
                  isDoctor={isDoctor}
                  isNurse={isNurse}
                  isReception={isReception}
                />
              ))}
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

      {/* Register Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Register New Patient"
      >
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="patient-name" className="form-label text-muted fw-bold small text-uppercase mb-2">Full Name</label>
            <input 
              id="patient-name"
              type="text" 
              className="form-control" 
              placeholder="e.g. John Doe…" 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              autoComplete="name"
            />
          </div>
          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <label htmlFor="patient-age" className="form-label text-muted fw-bold small text-uppercase mb-2">Age</label>
              <input 
                id="patient-age"
                type="number" 
                className="form-control" 
                placeholder="0" 
                value={formData.age}
                onChange={e => setFormData({...formData, age: e.target.value})}
              />
            </div>
            <div className="col-md-6">
              <label htmlFor="patient-gender" className="form-label text-muted fw-bold small text-uppercase mb-2">Gender</label>
              <select 
                id="patient-gender"
                className="form-select"
                value={formData.gender}
                onChange={e => setFormData({...formData, gender: e.target.value})}
              >
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
          </div>
          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <label htmlFor="patient-blood-group" className="form-label text-muted fw-bold small text-uppercase mb-2">Blood Group</label>
              <select 
                id="patient-blood-group"
                className="form-select"
                value={formData.bloodGroup}
                onChange={e => setFormData({...formData, bloodGroup: e.target.value})}
              >
                <option>A+</option><option>A-</option>
                <option>B+</option><option>B-</option>
                <option>O+</option><option>O-</option>
                <option>AB+</option><option>AB-</option>
              </select>
            </div>
            <div className="col-md-6">
              <label htmlFor="patient-phone" className="form-label text-muted fw-bold small text-uppercase mb-2">Phone Number</label>
              <input
                id="patient-phone"
                type="tel"
                className="form-control"
                placeholder="e.g. +91 98765 43210"
                value={formData.phoneNumber}
                onChange={e => setFormData({...formData, phoneNumber: e.target.value})}
                autoComplete="tel"
                required
              />
            </div>
          </div>
          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <label htmlFor="patient-email" className="form-label text-muted fw-bold small text-uppercase mb-2">Email</label>
              <input
                id="patient-email"
                type="email"
                className="form-control"
                placeholder="e.g. john.doe@example.com"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                autoComplete="email"
              />
            </div>
            <div className="col-md-6">
              <label htmlFor="patient-status" className="form-label text-muted fw-bold small text-uppercase mb-2">Admission Status</label>
              <select 
                id="patient-status"
                className="form-select"
                value={formData.status}
                onChange={e => setFormData({...formData, status: e.target.value})}
              >
                <option>Outpatient</option>
                <option>Inpatient</option>
                <option>Emergency</option>
              </select>
            </div>
          </div>
          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <label htmlFor="patient-emergency-contact-1" className="form-label text-muted fw-bold small text-uppercase mb-2">Emergency Contact Number 1</label>
              <input
                id="patient-emergency-contact-1"
                type="tel"
                className="form-control"
                placeholder="e.g. +91 98765 43210"
                value={formData.emergencyContact1}
                onChange={e => setFormData({...formData, emergencyContact1: e.target.value})}
                autoComplete="tel"
              />
            </div>
            <div className="col-md-6">
              <label htmlFor="patient-emergency-contact-2" className="form-label text-muted fw-bold small text-uppercase mb-2">Emergency Contact Number 2</label>
              <input
                id="patient-emergency-contact-2"
                type="tel"
                className="form-control"
                placeholder="e.g. +91 98765 43210"
                value={formData.emergencyContact2}
                onChange={e => setFormData({...formData, emergencyContact2: e.target.value})}
                autoComplete="tel"
              />
            </div>
          </div>
          <div className="d-flex gap-2 mt-5">
            <button type="button" className="btn btn-glass w-100 py-2" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary w-100 py-2">Register Patient</button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        title="Edit Patient Profile"
      >
        <form onSubmit={handleEditSubmit}>
          <div className="mb-4">
            <label htmlFor="edit-patient-name" className="form-label text-muted fw-bold small text-uppercase mb-2">Full Name</label>
            <input 
              id="edit-patient-name"
              type="text" 
              className="form-control" 
              value={editFormData.name}
              onChange={e => setEditFormData({...editFormData, name: e.target.value})}
            />
          </div>
          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <label htmlFor="edit-patient-age" className="form-label text-muted fw-bold small text-uppercase mb-2">Age</label>
              <input 
                id="edit-patient-age"
                type="number" 
                className="form-control" 
                value={editFormData.age}
                onChange={e => setEditFormData({...editFormData, age: e.target.value})}
              />
            </div>
            <div className="col-md-6">
              <label htmlFor="edit-patient-gender" className="form-label text-muted fw-bold small text-uppercase mb-2">Gender</label>
              <select 
                id="edit-patient-gender"
                className="form-select"
                value={editFormData.gender}
                onChange={e => setEditFormData({...editFormData, gender: e.target.value})}
              >
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
          </div>
          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <label htmlFor="edit-patient-blood-group" className="form-label text-muted fw-bold small text-uppercase mb-2">Blood Group</label>
              <select 
                id="edit-patient-blood-group"
                className="form-select"
                value={editFormData.bloodGroup}
                onChange={e => setEditFormData({...editFormData, bloodGroup: e.target.value})}
              >
                <option>A+</option><option>A-</option>
                <option>B+</option><option>B-</option>
                <option>O+</option><option>O-</option>
                <option>AB+</option><option>AB-</option>
              </select>
            </div>
            <div className="col-md-6">
              <label htmlFor="edit-patient-phone" className="form-label text-muted fw-bold small text-uppercase mb-2">Phone Number</label>
              <input
                id="edit-patient-phone"
                type="tel"
                className="form-control"
                value={editFormData.phoneNumber}
                onChange={e => setEditFormData({...editFormData, phoneNumber: e.target.value})}
                autoComplete="tel"
                required
              />
            </div>
          </div>
          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <label htmlFor="edit-patient-email" className="form-label text-muted fw-bold small text-uppercase mb-2">Email</label>
              <input
                id="edit-patient-email"
                type="email"
                className="form-control"
                value={editFormData.email}
                onChange={e => setEditFormData({...editFormData, email: e.target.value})}
                autoComplete="email"
              />
            </div>
            <div className="col-md-6">
              <label htmlFor="edit-patient-status" className="form-label text-muted fw-bold small text-uppercase mb-2">Admission Status</label>
              <select 
                id="edit-patient-status"
                className="form-select"
                value={editFormData.status}
                onChange={e => setEditFormData({...editFormData, status: e.target.value})}
              >
                <option>Outpatient</option>
                <option>Inpatient</option>
                <option>Emergency</option>
              </select>
            </div>
          </div>
          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <label htmlFor="edit-patient-emergency-contact-1" className="form-label text-muted fw-bold small text-uppercase mb-2">Emergency Contact Number 1</label>
              <input
                id="edit-patient-emergency-contact-1"
                type="tel"
                className="form-control"
                value={editFormData.emergencyContact1}
                onChange={e => setEditFormData({...editFormData, emergencyContact1: e.target.value})}
                autoComplete="tel"
              />
            </div>
            <div className="col-md-6">
              <label htmlFor="edit-patient-emergency-contact-2" className="form-label text-muted fw-bold small text-uppercase mb-2">Emergency Contact Number 2</label>
              <input
                id="edit-patient-emergency-contact-2"
                type="tel"
                className="form-control"
                value={editFormData.emergencyContact2}
                onChange={e => setEditFormData({...editFormData, emergencyContact2: e.target.value})}
                autoComplete="tel"
              />
            </div>
          </div>
          <div className="d-flex gap-2 mt-5">
            <button type="button" className="btn btn-glass w-100 py-2" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary w-100 py-2">Save Changes</button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <DeleteConfirmation 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        itemName={deletingPatient?.name}
        itemType="Patient Record"
      />
    </main>
  );
};

export default Patients;
