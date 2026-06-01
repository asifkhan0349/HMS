import React, { memo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp, mapPatientFromApi, mapActivityFromApi, mapBedFromApi, mapInvoiceFromApi, mapAppointmentFromApi, createCode } from '../context/AppContext';
import { useCrud } from '../hooks/useCrud';
import { patientsApi, bloodActivitiesApi, bedsApi, invoicesApi, appointmentsApi } from '../lib/api';
import Modal from '../components/UI/Modal';
import EmptyState from '../components/UI/EmptyState';
import DeleteConfirmation from '../components/UI/DeleteConfirmation';
import Pagination from '../components/UI/Pagination';
import { Skeleton } from 'boneyard-js/react';
import { usePagination } from '../hooks/usePagination';

// Memoized individual row
const PatientRow = memo(({ patient, onEdit, onDelete, onViewProfile, isPatient, isDoctor, isNurse, isReception }) => {
  const navigate = useNavigate();
  return (
    <tr>
      <td className="px-4 py-4 fw-bold" style={{ fontVariantNumeric: 'tabular-nums' }}>{patient.id}</td>
      <td className="py-4">
        <div className="d-flex align-items-center">
          <div>
            <h6 className="mb-0 fw-bold">
              <button 
                className="btn btn-link p-0 text-decoration-none fw-bold text-start" 
                style={{ color: 'var(--geist-foreground)', border: 'none', background: 'none' }}
                onClick={() => onViewProfile(patient)}
                title="View Profile Details"
              >
                {patient.name}
              </button>
            </h6>
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
          <button 
            className="btn btn-sm btn-glass me-2"
            onClick={() => onViewProfile(patient)}
            title="View Patient Profile"
          >
            <i className="bi bi-eye"></i>
          </button>

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

  const {
    data: activities,
    loading: loadingActivities
  } = useCrud(bloodActivitiesApi, mapActivityFromApi);

  const { data: beds } = useCrud(bedsApi, mapBedFromApi);
  const { data: invoices } = useCrud(invoicesApi, mapInvoiceFromApi);

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const handleViewProfile = (p) => {
    setSelectedPatient(p);
    setIsProfileModalOpen(true);
  };
  
  const [isOnlineRegModalOpen, setIsOnlineRegModalOpen] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState('');
  const [selectedApptDetails, setSelectedApptDetails] = useState(null);
  const [isRegisteringOnline, setIsRegisteringOnline] = useState(false);

  const openOnlineRegModal = async () => {
    setIsOnlineRegModalOpen(true);
    setLoadingAppointments(true);
    setSelectedBookingId('');
    setSelectedApptDetails(null);
    try {
      const apptsData = await appointmentsApi.list();
      const mapped = apptsData.map(mapAppointmentFromApi);
      setAppointments(mapped);
    } catch (err) {
      showToast(err.message || 'Unable to fetch appointments.', 'error');
    } finally {
      setLoadingAppointments(false);
    }
  };

  const handleBookingIdChange = (bookingId) => {
    setSelectedBookingId(bookingId);
    const appt = appointments.find(a => a.appointmentId === bookingId);
    setSelectedApptDetails(appt || null);
  };

  const handleRegisterOnlinePatient = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!selectedApptDetails) return;
    
    setIsRegisteringOnline(true);
    try {
      const isDuplicate = patients.some(p => p.bookingId === selectedApptDetails.appointmentId);
      if (isDuplicate) {
        showToast(`Booking ID ${selectedApptDetails.appointmentId} has already been registered.`, 'warning');
        setIsRegisteringOnline(false);
        return;
      }

      let age = selectedApptDetails.patientAge;
      if (!age && selectedApptDetails.patientDateOfBirth) {
        const dob = new Date(selectedApptDetails.patientDateOfBirth);
        const today = new Date();
        age = today.getFullYear() - dob.getFullYear();
        const m = today.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
          age--;
        }
      }
      if (typeof age !== 'number' || Number.isNaN(age) || age < 0) {
        age = 30;
      }

      let gender = 'Other';
      const gLower = selectedApptDetails.patientGender?.toLowerCase();
      if (gLower === 'male') gender = 'Male';
      else if (gLower === 'female') gender = 'Female';

      const validBloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
      let bloodGroup = selectedApptDetails.bloodGroup || 'O+';
      if (!validBloodGroups.includes(bloodGroup)) {
        bloodGroup = 'O+';
      }

      const payload = {
        name: selectedApptDetails.patient,
        age: parseInt(age),
        gender: gender,
        blood_group: bloodGroup,
        phone_number: selectedApptDetails.phoneNumber || '000-0000',
        email: selectedApptDetails.patientEmail || null,
        emergency_contact_1: selectedApptDetails.emergencyContact || '000-0000',
        emergency_contact_2: selectedApptDetails.emergencyContact2 || null,
        patient_code: createCode('P'),
        status: 'Outpatient',
        last_visit: selectedApptDetails.appointmentDate || new Date().toISOString().split('T')[0],
        booking_id: selectedApptDetails.appointmentId,
        address: selectedApptDetails.patientAddress || null,
        doctor_name: selectedApptDetails.doctor || null,
        appointment_date: selectedApptDetails.appointmentDate || null
      };

      await addPatient(payload);
      showToast(`Patient ${selectedApptDetails.patient} registered successfully from booking ${selectedApptDetails.appointmentId}.`);
      setIsOnlineRegModalOpen(false);
      setSelectedBookingId('');
      setSelectedApptDetails(null);
    } catch (error) {
      showToast(error.message || 'Unable to register the patient from online booking.', 'error');
    } finally {
      setIsRegisteringOnline(false);
    }
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [deletingPatient, setDeletingPatient] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  
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
    const errors = {};
    if (!formData.name.trim()) errors.name = true;
    if (!formData.age) errors.age = true;
    if (!formData.phoneNumber.trim()) errors.phoneNumber = true;
    if (!formData.gender) errors.gender = true;
    if (!formData.bloodGroup) errors.bloodGroup = true;
    if (!formData.status) errors.status = true;
    if (!formData.emergencyContact1.trim()) errors.emergencyContact1 = true;

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      showToast('Please fill in all mandatory fields highlighted in red.', 'warning');
      return;
    }
    setValidationErrors({});
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
    const errors = {};
    if (!editFormData.name.trim()) errors.name = true;
    if (!editFormData.age) errors.age = true;
    if (!editFormData.phoneNumber.trim()) errors.phoneNumber = true;
    if (!editFormData.gender) errors.gender = true;
    if (!editFormData.bloodGroup) errors.bloodGroup = true;
    if (!editFormData.status) errors.status = true;
    if (!editFormData.emergencyContact1.trim()) errors.emergencyContact1 = true;

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      showToast('Please fill in all mandatory fields highlighted in red.', 'warning');
      return;
    }
    setValidationErrors({});
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
        {!isPatient && (
          <div className="d-flex gap-2">
            <button 
              className="btn btn-glass px-4 py-2"
              onClick={openOnlineRegModal}
            >
              <i className="bi bi-globe me-2"></i>
              Online Patient Registration
            </button>
            <button 
              className="btn btn-primary px-4 py-2"
              onClick={() => setIsModalOpen(true)}
            >
              <i className="bi bi-person-plus me-2" aria-hidden="true"></i>
              Register Patient
            </button>
          </div>
        )}
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
                {!isPatient && <th className="px-4 py-3 text-end">Actions</th>}
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
                  onViewProfile={handleViewProfile}
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

      {/* Online Registration Modal */}
      <Modal 
        isOpen={isOnlineRegModalOpen} 
        onClose={() => setIsOnlineRegModalOpen(false)} 
        title="Online Patient Registration"
      >
        <div className="mb-4">
          <label htmlFor="booking-select" className="form-label text-muted fw-bold small text-uppercase mb-2 required-label">Select Online Booking ID</label>
          {loadingAppointments ? (
            <div className="d-flex align-items-center gap-2 py-2 text-muted">
              <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
              <span className="small">Fetching pending online bookings...</span>
            </div>
          ) : (
            <select 
              id="booking-select"
              className="form-select"
              value={selectedBookingId}
              onChange={(e) => handleBookingIdChange(e.target.value)}
            >
              <option value="">-- Choose Booking ID --</option>
              {(() => {
                const unregistered = appointments.filter(
                  appt => appt.appointmentId && !patients.some(p => p.bookingId === appt.appointmentId)
                );
                if (unregistered.length === 0) {
                  return <option disabled value="">No unregistered bookings available</option>;
                }
                return unregistered.map(appt => (
                  <option key={appt.apiId} value={appt.appointmentId}>
                    {appt.appointmentId} - {appt.patient} ({appt.appointmentDate})
                  </option>
                ));
              })()}
            </select>
          )}
        </div>

        {selectedApptDetails ? (
          <div className="card border-0 rounded-3 overflow-hidden mb-4" style={{ background: 'var(--accents-1)', border: '1px solid var(--accents-2)' }}>
            <div className="card-header py-3 px-4 border-0" style={{ background: 'rgba(0, 112, 243, 0.05)' }}>
              <div className="d-flex justify-content-between align-items-center">
                <h6 className="mb-0 fw-bold text-primary"><i className="bi bi-card-text me-2"></i>Patient Booking Details</h6>
                <span className="badge rounded-pill bg-primary px-3 py-1 font-monospace" style={{ fontSize: '0.75rem' }}>{selectedApptDetails.appointmentId}</span>
              </div>
            </div>
            <div className="card-body p-4">
              <div className="row g-4">
                <div className="col-12 border-bottom pb-3">
                  <div className="text-muted small text-uppercase fw-bold mb-1">Patient Name</div>
                  <h5 className="fw-bold mb-0 text-dark">{selectedApptDetails.patient}</h5>
                </div>
                
                <div className="col-md-6">
                  <div className="text-muted small text-uppercase fw-bold mb-1">Gender / Age</div>
                  <div className="fw-semibold text-dark">{selectedApptDetails.patientGender || 'Other'} / {selectedApptDetails.patientAge ? `${selectedApptDetails.patientAge} years` : (selectedApptDetails.patientDateOfBirth ? 'DOB provided' : 'Not specified')}</div>
                </div>

                <div className="col-md-6">
                  <div className="text-muted small text-uppercase fw-bold mb-1">Contact Phone</div>
                  <div className="fw-semibold text-dark" style={{ fontVariantNumeric: 'tabular-nums' }}>{selectedApptDetails.phoneNumber || '-'}</div>
                </div>

                <div className="col-md-6">
                  <div className="text-muted small text-uppercase fw-bold mb-1">Email Address</div>
                  <div className="fw-semibold text-dark text-truncate" title={selectedApptDetails.patientEmail}>{selectedApptDetails.patientEmail || '-'}</div>
                </div>

                <div className="col-md-6">
                  <div className="text-muted small text-uppercase fw-bold mb-1">Blood Group</div>
                  <div className="fw-semibold text-dark"><span className="badge bg-danger px-2.5 py-1">{selectedApptDetails.bloodGroup || 'Not provided'}</span></div>
                </div>

                <div className="col-12 border-top pt-3">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className="text-muted small text-uppercase fw-bold mb-1">Doctor Assigned</div>
                      <div className="fw-semibold text-dark"><i className="bi bi-person-badge-fill me-1 text-primary"></i>{selectedApptDetails.doctor || '-'}</div>
                    </div>
                    <div className="col-md-6">
                      <div className="text-muted small text-uppercase fw-bold mb-1">Appointment Date</div>
                      <div className="fw-semibold text-dark"><i className="bi bi-calendar-event me-1 text-primary"></i>{selectedApptDetails.appointmentDate || '-'}</div>
                    </div>
                  </div>
                </div>

                {selectedApptDetails.patientAddress && (
                  <div className="col-12 border-top pt-3">
                    <div className="text-muted small text-uppercase fw-bold mb-1">Patient Address</div>
                    <div className="fw-semibold text-dark text-wrap small">{selectedApptDetails.patientAddress}</div>
                  </div>
                )}

                {selectedApptDetails.symptoms && (
                  <div className="col-12 border-top pt-3">
                    <div className="text-muted small text-uppercase fw-bold mb-1">Symptoms Description</div>
                    <div className="fw-semibold text-dark text-wrap small">{selectedApptDetails.symptoms}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          !loadingAppointments && (
            <div className="text-center py-5 border rounded-3 mb-4 bg-light bg-opacity-50">
              <i className="bi bi-globe fs-1 text-muted opacity-40 mb-3 d-block"></i>
              <p className="text-muted small mb-0 px-4">Please select a Booking ID from the dropdown above to view patient details and register them in the system.</p>
            </div>
          )
        )}

        <div className="d-flex gap-2 mt-5">
          <button type="button" className="btn btn-glass w-100 py-2" onClick={() => setIsOnlineRegModalOpen(false)}>Cancel</button>
          <button 
            type="button" 
            className="btn btn-primary w-100 py-2" 
            onClick={handleRegisterOnlinePatient}
            disabled={!selectedApptDetails || isRegisteringOnline}
          >
            {isRegisteringOnline ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Registering...
              </>
            ) : (
              'Register Patient'
            )}
          </button>
        </div>
      </Modal>

      {/* Register Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Register New Patient"
      >
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="patient-name" className="form-label text-muted fw-bold small text-uppercase mb-2 required-label">Full Name</label>
            <input 
              id="patient-name"
              type="text" 
              className={`form-control ${validationErrors.name ? 'is-invalid' : ''}`} 
              placeholder="e.g. John Doe…" 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              autoComplete="name"
            />
          </div>
          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <label htmlFor="patient-age" className="form-label text-muted fw-bold small text-uppercase mb-2 required-label">Age</label>
              <input 
                id="patient-age"
                type="number" 
                className={`form-control ${validationErrors.age ? 'is-invalid' : ''}`} 
                placeholder="0" 
                value={formData.age}
                onChange={e => setFormData({...formData, age: e.target.value})}
              />
            </div>
            <div className="col-md-6">
              <label htmlFor="patient-gender" className="form-label text-muted fw-bold small text-uppercase mb-2 required-label">Gender</label>
              <select 
                id="patient-gender"
                className={`form-select ${validationErrors.gender ? 'is-invalid' : ''}`}
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
              <label htmlFor="patient-blood-group" className="form-label text-muted fw-bold small text-uppercase mb-2 required-label">Blood Group</label>
              <select 
                id="patient-blood-group"
                className={`form-select ${validationErrors.bloodGroup ? 'is-invalid' : ''}`}
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
              <label htmlFor="patient-phone" className="form-label text-muted fw-bold small text-uppercase mb-2 required-label">Phone Number</label>
              <input
                id="patient-phone"
                type="tel"
                className={`form-control ${validationErrors.phoneNumber ? 'is-invalid' : ''}`}
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
              <label htmlFor="patient-status" className="form-label text-muted fw-bold small text-uppercase mb-2 required-label">Admission Status</label>
              <select 
                id="patient-status"
                className={`form-select ${validationErrors.status ? 'is-invalid' : ''}`}
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
              <label htmlFor="patient-emergency-contact-1" className="form-label text-muted fw-bold small text-uppercase mb-2 required-label">Emergency Contact Number 1</label>
              <input
                id="patient-emergency-contact-1"
                type="tel"
                className={`form-control ${validationErrors.emergencyContact1 ? 'is-invalid' : ''}`}
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
            <label htmlFor="edit-patient-name" className="form-label text-muted fw-bold small text-uppercase mb-2 required-label">Full Name</label>
            <input 
              id="edit-patient-name"
              type="text" 
              className={`form-control ${validationErrors.name ? 'is-invalid' : ''}`} 
              value={editFormData.name}
              onChange={e => setEditFormData({...editFormData, name: e.target.value})}
            />
          </div>
          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <label htmlFor="edit-patient-age" className="form-label text-muted fw-bold small text-uppercase mb-2 required-label">Age</label>
              <input 
                id="edit-patient-age"
                type="number" 
                className={`form-control ${validationErrors.age ? 'is-invalid' : ''}`} 
                value={editFormData.age}
                onChange={e => setEditFormData({...editFormData, age: e.target.value})}
              />
            </div>
            <div className="col-md-6">
              <label htmlFor="edit-patient-gender" className="form-label text-muted fw-bold small text-uppercase mb-2 required-label">Gender</label>
              <select 
                id="edit-patient-gender"
                className={`form-select ${validationErrors.gender ? 'is-invalid' : ''}`}
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
              <label htmlFor="edit-patient-blood-group" className="form-label text-muted fw-bold small text-uppercase mb-2 required-label">Blood Group</label>
              <select 
                id="edit-patient-blood-group"
                className={`form-select ${validationErrors.bloodGroup ? 'is-invalid' : ''}`}
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
              <label htmlFor="edit-patient-phone" className="form-label text-muted fw-bold small text-uppercase mb-2 required-label">Phone Number</label>
              <input
                id="edit-patient-phone"
                type="tel"
                className={`form-control ${validationErrors.phoneNumber ? 'is-invalid' : ''}`}
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
              <label htmlFor="edit-patient-status" className="form-label text-muted fw-bold small text-uppercase mb-2 required-label">Admission Status</label>
              <select 
                id="edit-patient-status"
                className={`form-select ${validationErrors.status ? 'is-invalid' : ''}`}
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
              <label htmlFor="edit-patient-emergency-contact-1" className="form-label text-muted fw-bold small text-uppercase mb-2 required-label">Emergency Contact Number 1</label>
              <input
                id="edit-patient-emergency-contact-1"
                type="tel"
                className={`form-control ${validationErrors.emergencyContact1 ? 'is-invalid' : ''}`}
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

      {/* Patient Profile Modal */}
      <Modal 
        isOpen={isProfileModalOpen} 
        onClose={() => { setIsProfileModalOpen(false); setSelectedPatient(null); }} 
        title="Patient Profile Card"
      >
        {selectedPatient && (
          <div className="patient-profile-card">
            {/* Header Summary */}
            <div className="d-flex align-items-center gap-3 mb-4 pb-3 border-bottom">
              <div 
                className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white shadow-sm" 
                style={{ 
                  width: '56px', 
                  height: '56px', 
                  fontSize: '1.5rem',
                  background: 'linear-gradient(135deg, #0070f3 0%, #00259e 100%)'
                }}
              >
                {selectedPatient.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 className="fw-bold mb-1 text-dark">{selectedPatient.name}</h4>
                <div className="d-flex align-items-center gap-2">
                  <span className="text-muted small">ID: {selectedPatient.id}</span>
                  <span className="text-muted small">•</span>
                  <span className="text-muted small">Code: {selectedPatient.patientCode}</span>
                  <span className="text-muted small">•</span>
                  <span className={`badge rounded-pill px-2 py-0.5 border`} style={{ 
                      background: selectedPatient.status === 'Inpatient' ? 'rgba(0, 112, 243, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                      color: 'var(--geist-success)',
                      borderColor: selectedPatient.status === 'Inpatient' ? 'rgba(0, 112, 243, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                      fontSize: '0.65rem'
                  }}>
                    {selectedPatient.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Details Grid */}
            <div className="row g-4 mb-4">
              <div className="col-md-6">
                <div className="p-3 border rounded h-100" style={{ background: 'rgba(0,0,0,0.03)' }}>
                  <h6 className="fw-bold text-muted small text-uppercase mb-3"><i className="bi bi-person me-2"></i>Personal Info</h6>
                  <div className="mb-2 d-flex justify-content-between">
                    <span className="text-muted small">Age:</span>
                    <span className="fw-semibold small text-dark">{selectedPatient.age} years</span>
                  </div>
                  <div className="mb-2 d-flex justify-content-between">
                    <span className="text-muted small">Gender:</span>
                    <span className="fw-semibold small text-dark">{selectedPatient.gender}</span>
                  </div>
                  <div className="mb-0 d-flex justify-content-between align-items-center">
                    <span className="text-muted small">Blood Group:</span>
                    <span className="badge bg-danger px-2 py-1">{selectedPatient.bloodGroup}</span>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="p-3 border rounded h-100" style={{ background: 'rgba(0,0,0,0.03)' }}>
                  <h6 className="fw-bold text-muted small text-uppercase mb-3"><i className="bi bi-telephone me-2"></i>Contact Details</h6>
                  <div className="mb-2 d-flex justify-content-between">
                    <span className="text-muted small">Phone:</span>
                    <span className="fw-semibold small text-dark" style={{ fontVariantNumeric: 'tabular-nums' }}>{selectedPatient.phoneNumber || '-'}</span>
                  </div>
                  <div className="mb-0 d-flex justify-content-between align-items-center">
                    <span className="text-muted small">Email:</span>
                    <span className="fw-semibold small text-dark text-truncate ms-2" style={{ maxWidth: '160px' }} title={selectedPatient.email}>{selectedPatient.email || '-'}</span>
                  </div>
                  {selectedPatient.address && (
                    <div className="mt-2 border-top pt-2">
                      <span className="text-muted small d-block">Address:</span>
                      <span className="fw-semibold small text-dark d-block text-wrap mt-0.5">{selectedPatient.address}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Emergency Contacts */}
            <div className="p-3 border rounded mb-4" style={{ background: 'rgba(0,0,0,0.03)' }}>
              <h6 className="fw-bold text-muted small text-uppercase mb-3"><i className="bi bi-shield-exclamation me-2"></i>Emergency Contacts</h6>
              <div className="row">
                <div className="col-md-6 mb-2 mb-md-0">
                  <div className="small text-muted mb-1">Primary Contact:</div>
                  <div className="fw-semibold small text-dark" style={{ fontVariantNumeric: 'tabular-nums' }}>{selectedPatient.emergencyContact1 || '-'}</div>
                </div>
                <div className="col-md-6">
                  <div className="small text-muted mb-1">Secondary Contact:</div>
                  <div className="fw-semibold small text-dark" style={{ fontVariantNumeric: 'tabular-nums' }}>{selectedPatient.emergencyContact2 || '-'}</div>
                </div>
              </div>
            </div>

            {/* Online Booking Details */}
            {selectedPatient.bookingId && (
              <div className="p-3 border rounded mb-4" style={{ background: 'rgba(0,0,0,0.03)' }}>
                <h6 className="fw-bold text-muted small text-uppercase mb-3"><i className="bi bi-globe me-2 text-primary"></i>Online Registration Link</h6>
                <div className="row g-3">
                  <div className="col-md-4">
                    <div className="small text-muted mb-1">Booking ID:</div>
                    <div className="fw-bold small text-primary">{selectedPatient.bookingId}</div>
                  </div>
                  <div className="col-md-4">
                    <div className="small text-muted mb-1">Doctor Assigned:</div>
                    <div className="fw-semibold small text-dark">{selectedPatient.doctorName || '-'}</div>
                  </div>
                  <div className="col-md-4">
                    <div className="small text-muted mb-1">Appointment Date:</div>
                    <div className="fw-semibold small text-dark">{selectedPatient.appointmentDate || '-'}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Bed Assignment Details */}
            {(() => {
              const assignedBed = beds.find(b => b.patientName === selectedPatient.name);
              if (assignedBed) {
                return (
                  <div className="p-3 border rounded mb-4" style={{ background: 'rgba(0,0,0,0.03)' }}>
                    <h6 className="fw-bold text-muted small text-uppercase mb-3"><i className="bi bi-hospital me-2"></i>Bed Assignment</h6>
                    <div className="row">
                      <div className="col-md-4 mb-2 mb-md-0">
                        <div className="small text-muted mb-1">Ward / Room:</div>
                        <div className="fw-semibold small text-dark">{assignedBed.ward}</div>
                      </div>
                      <div className="col-md-4 mb-2 mb-md-0">
                        <div className="small text-muted mb-1">Bed Number:</div>
                        <div className="fw-semibold small text-dark">{assignedBed.id}</div>
                      </div>
                      <div className="col-md-4">
                        <div className="small text-muted mb-1">Allotment Reason:</div>
                        <div className="fw-semibold small text-dark">{assignedBed.allotmentReason || '-'}</div>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            {/* Invoices History */}
            <div className="p-3 border rounded mb-4" style={{ background: 'rgba(0,0,0,0.03)' }}>
              <h6 className="fw-bold text-muted small text-uppercase mb-3 d-flex align-items-center justify-content-between">
                <span><i className="bi bi-receipt me-2 text-primary"></i>Invoices & Billing History</span>
                <span className="badge rounded-pill bg-primary-soft text-primary px-2.5 py-1 small fw-bold" style={{ fontSize: '0.65rem', background: 'rgba(0, 112, 243, 0.08)' }}>
                  {invoices.filter(inv => inv.patient?.toLowerCase() === selectedPatient.name?.toLowerCase()).length} Invoices
                </span>
              </h6>
              <div className="invoice-history-list" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                {invoices.filter(inv => inv.patient?.toLowerCase() === selectedPatient.name?.toLowerCase()).length === 0 ? (
                  <div className="text-center py-4 text-muted small">
                    <i className="bi bi-receipt fs-4 text-muted opacity-50 mb-2 d-block"></i>
                    No billing records or invoices found for this patient.
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-sm table-borderless align-middle mb-0">
                      <thead>
                        <tr className="border-bottom small text-muted">
                          <th className="py-1">Invoice Code</th>
                          <th className="py-1">Billing Type</th>
                          <th className="py-1">Amount</th>
                          <th className="py-1">Status</th>
                          <th className="py-1 text-end">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoices
                          .filter(inv => inv.patient?.toLowerCase() === selectedPatient.name?.toLowerCase())
                          .map((inv) => (
                            <tr key={inv.apiId} className="small border-bottom-subtle">
                              <td className="py-2 fw-semibold text-dark">{inv.id}</td>
                              <td className="py-2 text-muted">{inv.billingType}</td>
                              <td className="py-2 fw-bold text-dark">{inv.amount}</td>
                              <td className="py-2">
                                <span className={`badge rounded-pill px-2 py-0.5`} style={{
                                  background: inv.status === 'Paid' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                  color: inv.status === 'Paid' ? 'var(--geist-success)' : 'var(--geist-warning)',
                                  fontSize: '0.65rem'
                                }}>
                                  {inv.status}
                                </span>
                              </td>
                              <td className="py-2 text-muted text-end" style={{ fontVariantNumeric: 'tabular-nums' }}>{inv.date}</td>
                            </tr>
                          ))
                        }
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Transfusion / Blood Usage History */}
            <div className="p-3 border rounded" style={{ background: 'rgba(0,0,0,0.03)' }}>
              <h6 className="fw-bold text-muted small text-uppercase mb-3 d-flex align-items-center justify-content-between">
                <span><i className="bi bi-droplet-half text-danger me-2"></i>Transfusion & Blood Usage History</span>
                <span className="badge rounded-pill bg-danger-soft text-danger px-2.5 py-1 small fw-bold" style={{ fontSize: '0.65rem', background: 'rgba(238, 0, 0, 0.08)' }}>
                  {activities.filter(act => act.type === 'Usage' && act.donor?.toLowerCase() === selectedPatient.name?.toLowerCase()).length} Logs
                </span>
              </h6>
              <div className="transfusion-history-list" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                {activities.filter(act => act.type === 'Usage' && act.donor?.toLowerCase() === selectedPatient.name?.toLowerCase()).length === 0 ? (
                  <div className="text-center py-4 text-muted small">
                    <i className="bi bi-heart-pulse fs-4 text-muted opacity-50 mb-2 d-block"></i>
                    No blood activities or transfusion cycles logged for this patient.
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-sm table-borderless align-middle mb-0">
                      <thead>
                        <tr className="border-bottom small text-muted">
                          <th className="py-1">Group</th>
                          <th className="py-1">Units (Bags)</th>
                          <th className="py-1 text-end">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activities
                          .filter(act => act.type === 'Usage' && act.donor?.toLowerCase() === selectedPatient.name?.toLowerCase())
                          .map((act) => (
                            <tr key={act.id} className="small border-bottom-subtle">
                              <td className="py-2 fw-bold text-danger"><i className="bi bi-droplet-fill me-1"></i>{act.group}</td>
                              <td className="py-2 fw-semibold text-dark" style={{ fontVariantNumeric: 'tabular-nums' }}>{act.units} Bags</td>
                              <td className="py-2 text-muted text-end" style={{ fontVariantNumeric: 'tabular-nums' }}>{act.date}</td>
                            </tr>
                          ))
                        }
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="d-flex gap-2 mt-5">
              <button type="button" className="btn btn-glass w-100 py-2" onClick={() => { setIsProfileModalOpen(false); setSelectedPatient(null); }}>Close Profile</button>
            </div>
          </div>
        )}
      </Modal>
    </main>
  );
};

export default Patients;
