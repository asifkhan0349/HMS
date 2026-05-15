import React, { useMemo, useState } from 'react';
import { useApp, mapAppointmentFromApi, mapPatientFromApi, mapStaffFromApi, createCode, parseDisplayTime } from '../context/AppContext';
import { useCrud } from '../hooks/useCrud';
import { appointmentsApi, patientsApi, staffApi } from '../lib/api';
import Modal from '../components/UI/Modal';
import EmptyState from '../components/UI/EmptyState';
import DeleteConfirmation from '../components/UI/DeleteConfirmation';
import Pagination from '../components/UI/Pagination';
import { Skeleton } from 'boneyard-js/react';
import { usePagination } from '../hooks/usePagination';

const APPOINTMENT_TYPE_OPTIONS = ['New Consultation', 'Follow-up', 'Routine Check-up'];
const GENDER_OPTIONS = ['Male', 'Female', 'Other'];
const DEFAULT_APPOINTMENT_TIME = '09:00 AM';

const calculateAge = (dob) => {
  if (!dob) return '';
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= 0 ? age.toString() : '0';
};

const createEmptyAppointmentForm = () => ({
  patient: '',
  dateOfBirth: '',
  age: '',
  gender: 'Male',
  address: '',
  appointment_date: new Date().toISOString().split('T')[0],
  type: 'New Consultation',
  phoneNumber: '',
  email: '',
  bloodGroup: 'O+',
  emergencyContact: '',
  emergencyContact2: '',
  timeSlot: '',
  department: '',
  doctor: '',
});

const Appointments = () => {
  const { showToast, user } = useApp();
  const isDoctor = user?.role === 'Doctor';
  const isNurse = user?.role === 'Nurse';
  const isReception = user?.role === 'Reception';
  const isPatient = user?.role?.toLowerCase() === 'patient';
  const { 
    data: appointments, 
    loading, 
    addData: addAppointment, 
    updateData: updateAppointment,
    removeData: deleteAppointment
  } = useCrud(appointmentsApi, mapAppointmentFromApi);

  const [searchTerm, setSearchTerm] = useState('');

  const filteredAppointments = appointments.filter(app => 
    app.patient.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.appointmentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.id.toString().includes(searchTerm)
  );

  const {
    paginatedData: paginatedAppointments,
    currentPage,
    totalPages,
    rowsPerPage,
    totalItems,
    onPageChange,
    onRowsPerPageChange
  } = usePagination(filteredAppointments);
  
  const { data: patients } = useCrud(patientsApi, mapPatientFromApi);
  const { data: staff } = useCrud(staffApi, mapStaffFromApi);
  const departmentOptions = [
    'General Medicine',
    'Cardiology',
    'Orthopedics',
    'Dermatology',
    'Pediatrics',
    'Gynecology',
    'ENT (Ear, Nose, Throat)',
    'Neurology',
    'Psychiatry',
    'Emergency / Casualty'
  ];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState(null);
  const [deletingApp, setDeletingApp] = useState(null);

  // Status-action modals
  const [scheduledModalApp, setScheduledModalApp] = useState(null);
  const [scheduledLaterModalApp, setScheduledLaterModalApp] = useState(null);
  const [scheduledDoctorName, setScheduledDoctorName] = useState('');
  const [scheduledLaterDate, setScheduledLaterDate] = useState('');
  const [scheduledLaterTimeSlot, setScheduledLaterTimeSlot] = useState('');
  const [scheduledLaterDoctor, setScheduledLaterDoctor] = useState('');

  const [formData, setFormData] = useState(createEmptyAppointmentForm);
  const [validationErrors, setValidationErrors] = useState({});

  const [editFormData, setEditFormData] = useState({
    patient: '',
    dateOfBirth: '',
    age: '',
    gender: 'Male',
    address: '',
    appointment_date: '',
    type: 'New Consultation',
    phoneNumber: '',
    email: '',
    bloodGroup: 'O+',
    emergencyContact: '',
    emergencyContact2: '',
    timeSlot: '',
    department: '',
    doctor: '',
  });

  const syncPatientDetails = (name, currentData) => {
    const matchedPatient = patients.find((patient) => patient.name.toLowerCase() === name.trim().toLowerCase());

    if (!matchedPatient) {
      return { ...currentData, patient: name };
    }

    return {
      ...currentData,
      patient: name,
      age: matchedPatient.age?.toString() ?? currentData.age,
      gender: matchedPatient.gender || currentData.gender,
      phoneNumber: matchedPatient.phoneNumber || currentData.phoneNumber,
      email: matchedPatient.email || currentData.email,
      bloodGroup: matchedPatient.bloodGroup || currentData.bloodGroup,
      emergencyContact: matchedPatient.emergencyContact1 || currentData.emergencyContact,
      emergencyContact2: matchedPatient.emergencyContact2 || currentData.emergencyContact2,
    };
  };

  const buildAppointmentPayload = (
    appointmentData
  ) => {
    const selectedStaff = staff.find(s => s.name === appointmentData.doctor?.trim());
    // Use userStaffId (User.staff_id) as doctor_id — matches the backend appointment filter.
    // Fall back to staff_code only if no linked user account exists.
    const doctorId = selectedStaff?.userStaffId || selectedStaff?.id || null;
    return {
      patient_name: appointmentData.patient.trim(),
      patient_date_of_birth: appointmentData.dateOfBirth || null,
      patient_age: appointmentData.age ? Number(appointmentData.age) : null,
      patient_gender: appointmentData.gender,
      patient_address: appointmentData.address.trim() || null,
      appointment_date: appointmentData.appointment_date,
      appointment_type: appointmentData.type,
      phone_number: appointmentData.phoneNumber.trim() || null,
      patient_email: appointmentData.email?.trim() || null,
      blood_group: appointmentData.bloodGroup || null,
      emergency_contact: appointmentData.emergencyContact.trim() || null,
      emergency_contact_2: appointmentData.emergencyContact2?.trim() || null,
      time_slot: appointmentData.timeSlot.trim() || null,
      department: appointmentData.department.trim() || null,
      doctor_name: appointmentData.doctor?.trim() || null,
      doctor_id: doctorId,
    };
  };

  const appointmentSummary = useMemo(
    () => ({
      todayCount: appointments.length,
    }),
    [appointments]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!formData.patient.trim()) errors.patient = true;
    if (!formData.dateOfBirth && !formData.age) {
      errors.dateOfBirth = true;
      errors.age = true;
    }
    if (!formData.appointment_date) errors.appointment_date = true;
    if (!formData.department) errors.department = true;
    if (!formData.gender) errors.gender = true;
    if (!formData.type) errors.type = true;
    if (!formData.bloodGroup) errors.bloodGroup = true;
    if (!formData.timeSlot) errors.timeSlot = true;
    if (!formData.phoneNumber.trim()) errors.phoneNumber = true;
    if (!formData.emergencyContact.trim()) errors.emergencyContact = true;
    if (!formData.address.trim()) errors.address = true;

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      showToast('Please fill in all mandatory fields highlighted in red.', 'warning');
      return;
    }
    setValidationErrors({});

    try {
      const payload = buildAppointmentPayload(
        formData
      );
      const created = await addAppointment(payload);
      const apptId = created?.bookingId || '';
      showToast(`Appointment booked! Appointment ID: ${apptId || 'generated'}`);
      setIsModalOpen(false);
      setFormData(createEmptyAppointmentForm());
    } catch (error) {
      showToast(error.message || 'Unable to schedule the appointment.', 'error');
    }
  };

  const openEditModal = (app) => {
    setEditingApp(app);
    setEditFormData({
      patient: app.patient,
      dateOfBirth: app.patientDateOfBirth || '',
      age: app.patientAge?.toString() || '',
      gender: app.patientGender || 'Male',
      address: app.patientAddress || '',
      appointment_date: app.appointmentDate || '',
      type: app.type,
      phoneNumber: app.phoneNumber || '',
      email: app.patientEmail || '',
      bloodGroup: app.bloodGroup || 'O+',
      emergencyContact: app.emergencyContact || '',
      emergencyContact2: app.emergencyContact2 || '',
      timeSlot: app.timeSlot || '',
      department: app.department || '',
      doctor: app.doctor || '',
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!editFormData.patient.trim()) errors.patient = true;
    if (!editFormData.dateOfBirth && !editFormData.age) {
      errors.dateOfBirth = true;
      errors.age = true;
    }
    if (!editFormData.appointment_date) errors.appointment_date = true;
    if (!editFormData.department) errors.department = true;
    if (!editFormData.gender) errors.gender = true;
    if (!editFormData.type) errors.type = true;
    if (!editFormData.bloodGroup) errors.bloodGroup = true;
    if (!editFormData.timeSlot) errors.timeSlot = true;
    if (!editFormData.doctor) errors.doctor = true;
    if (!editFormData.phoneNumber.trim()) errors.phoneNumber = true;
    if (!editFormData.emergencyContact.trim()) errors.emergencyContact = true;
    if (!editFormData.address.trim()) errors.address = true;

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      showToast('Please fill in all mandatory fields highlighted in red.', 'warning');
      return;
    }
    setValidationErrors({});

    try {
      const payload = buildAppointmentPayload(
        editFormData
      );
      await updateAppointment(editingApp.apiId, payload);
      showToast(`Appointment for ${editFormData.patient} updated successfully.`);
      setIsEditModalOpen(false);
      setEditingApp(null);
    } catch (error) {
      showToast(error.message || 'Unable to update the appointment.', 'error');
    }
  };

  const handleStatusUpdate = async (app, newStatus, extra = {}) => {
    try {
      await updateAppointment(app.apiId, { status: newStatus, ...extra });
      showToast(`Appointment for ${app.patient} has been ${newStatus.toLowerCase()}.`);
    } catch (error) {
      showToast(error.message || `Unable to ${newStatus.toLowerCase()} the appointment.`, 'error');
    }
  };

  const handleConfirmScheduled = async () => {
    if (!scheduledDoctorName.trim()) {
      showToast('Please enter the doctor name.', 'warning');
      return;
    }
    const selectedStaff = staff.find(s => s.name === scheduledDoctorName.trim());
    // Use userStaffId (User.staff_id) as doctor_id — this is what the backend
    // appointment filter reads. Fall back to staff_code only if no user account linked.
    const doctorId = selectedStaff?.userStaffId || selectedStaff?.id || null;
    await handleStatusUpdate(scheduledModalApp, 'Scheduled', { 
      doctor_name: scheduledDoctorName.trim(),
      doctor_id: doctorId
    });
    setScheduledModalApp(null);
    setScheduledDoctorName('');
  };

  const handleConfirmScheduledLater = async () => {
    if (!scheduledLaterDate) {
      showToast('Please select an appointment date.', 'warning');
      return;
    }
    const selectedStaff = staff.find(s => s.name === scheduledLaterDoctor?.trim());
    // Use userStaffId (User.staff_id) as doctor_id — this is what the backend
    // appointment filter reads. Fall back to staff_code only if no user account linked.
    const doctorId = selectedStaff?.userStaffId || selectedStaff?.id || null;
    await handleStatusUpdate(scheduledLaterModalApp, 'Scheduled Later', { 
      appointment_date: scheduledLaterDate,
      time_slot: scheduledLaterTimeSlot || null,
      doctor_name: scheduledLaterDoctor || null,
      doctor_id: doctorId
    });
    setScheduledLaterModalApp(null);
    setScheduledLaterDate('');
    setScheduledLaterTimeSlot('');
    setScheduledLaterDoctor('');
  };

  const handleDelete = async () => {
    try {
      await deleteAppointment(deletingApp.apiId);
      showToast(`Appointment for ${deletingApp.patient} deleted successfully.`);
      setIsDeleteModalOpen(false);
      setDeletingApp(null);
    } catch (error) {
      showToast(error.message || 'Unable to delete the appointment.', 'error');
    }
  };

  return (
    <main className="appointments-page p-4">
      <div className="d-flex justify-content-between align-items-center mb-5">
        <div>
          <h2 className="fw-bold mb-1">Clinic Schedule</h2>
          <p className="text-muted mb-0">Manage patient appointments and clinical slots.</p>
        </div>
        <div className="d-flex gap-2">
          <button
            className="btn btn-glass px-4 py-2 border"
            onClick={() => showToast(`${appointmentSummary.todayCount} appointments loaded from the backend.`)}
          >
            <i className="bi bi-calendar3 me-2" aria-hidden="true"></i>
            Today {appointmentSummary.todayCount}
          </button>
          <button className="btn btn-primary px-4 py-2" onClick={() => setIsModalOpen(true)}>
            <i className="bi bi-calendar-plus me-2" aria-hidden="true"></i>
            Book Appointment
          </button>
        </div>
      </div>

      <div className="glass-card p-0 overflow-hidden border">
        <div
          className="p-4 border-bottom d-flex justify-content-between align-items-center"
          style={{ background: 'var(--accents-1)' }}
        >
          <h6 className="fw-bold mb-0">Daily Queue</h6>
          <div className="d-flex gap-3 align-items-center">
            <div className="input-group input-group-sm" style={{ width: '250px' }}>
              <span className="input-group-text bg-transparent border-end-0 border-accents-2 opacity-50"><i className="bi bi-search" aria-hidden="true"></i></span>
              <input 
                type="text" 
                className="form-control border-start-0 ps-0" 
                placeholder="Search appointments…" 
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  onPageChange(1);
                }}
              />
            </div>
            <div className="btn-group border rounded-2" style={{ overflow: 'hidden' }}>
              <button className="btn btn-sm px-3 bg-white text-black fw-bold">Active {appointmentSummary.todayCount}</button>
            </div>
          </div>
        </div>
        <Skeleton name="appointments-table" loading={loading}>
          <div className="table-responsive">
            <table className="table table-hover mb-0 align-middle">
            <thead>
              <tr>
                <th className="px-4 py-3">Appointment ID</th>
                <th className="px-4 py-3">Patient Name</th>
                <th className="py-3">Appt Date / Time</th>
                <th className="py-3">Age / Gender</th>
                <th className="py-3">Department</th>
                <th className="py-3">Doctor</th>
                <th className="py-3">Visit Type</th>
                <th className="py-3">Status</th>
                {!(isPatient || isDoctor || isNurse || isReception) && <th className="px-4 py-3 text-end">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {appointments.length === 0 ? (
                              <tr>
                  <td colSpan={user?.role === 'Admin' ? 9 : 8} className="p-0">
                    <EmptyState
                      icon="bi-calendar-event"
                      title="No Appointments"
                      description="The daily clinical schedule is clear. You can book a new appointment for any registered patient."
                      actionText="Book Appointment"
                      onAction={() => setIsModalOpen(true)}
                    />
                  </td>
                </tr>
              ) : paginatedAppointments.length === 0 ? (
                              <tr>
                  <td colSpan={user?.role === 'Admin' ? 9 : 8} className="p-0">
                    <EmptyState 
                      icon="bi-search"
                      title="No matching appointments"
                      description={`We couldn't find any appointments matching "${searchTerm}".`}
                      actionText="Clear Search"
                      onAction={() => { setSearchTerm(''); onPageChange(1); }}
                    />
                  </td>
                </tr>
              ) : paginatedAppointments.map((app) => (
                <tr key={app.id}>
                  <td className="px-4 py-4">
                    {app.appointmentId ? (
                      <span
                        className="badge fw-semibold font-monospace"
                        style={{
                          background: 'rgba(99, 102, 241, 0.1)',
                          color: '#6366f1',
                          border: '1px solid rgba(99, 102, 241, 0.25)',
                          fontSize: '0.75rem',
                          letterSpacing: '0.03em',
                        }}
                      >
                        <i className="bi bi-ticket-perforated me-1" aria-hidden="true"></i>
                        {app.appointmentId}
                      </span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="fw-bold">{app.patient}</div>
                    <small className="text-muted">{app.phoneNumber || '—'}</small>
                  </td>
                  <td className="py-4 text-nowrap">
                    <div className="fw-bold">{app.appointmentDate ? new Date(app.appointmentDate).toLocaleDateString() : '—'}</div>
                    <small className="text-muted">{app.timeSlot || 'Anytime'}</small>
                  </td>
                  <td className="py-4">
                    {app.patientAge || '—'} / {app.patientGender}
                  </td>
                  <td className="py-4 text-truncate" style={{ maxWidth: '150px' }}>
                    <span className="badge bg-light text-dark border">{app.department || 'General'}</span>
                  </td>
                  <td className="py-4">
                    <span className="fw-medium">{app.doctor || 'Not Assigned'}</span>
                  </td>
                  <td className="py-4">
                    <span
                      className="badge rounded-pill"
                      style={{
                        background: 'var(--accents-1)',
                        color: 'var(--geist-foreground)',
                        border: '1px solid var(--accents-2)',
                      }}
                    >
                      {app.type}
                    </span>
                  </td>
                  <td className="py-4">
                    <span 
                      className="badge rounded-pill px-3 py-2 fw-medium"
                      style={{
                        backgroundColor: app.status === 'Scheduled' ? 'rgba(0, 191, 131, 0.1)' : 
                                       app.status === 'Scheduled Later' ? 'rgba(0, 122, 255, 0.1)' : 
                                       'rgba(255, 159, 10, 0.1)',
                        color: app.status === 'Scheduled' ? '#00bf83' : 
                               app.status === 'Scheduled Later' ? '#007aff' : 
                               '#ff9f0a',
                        border: `1px solid ${app.status === 'Scheduled' ? 'rgba(0, 191, 131, 0.2)' : 
                                            app.status === 'Scheduled Later' ? 'rgba(0, 122, 255, 0.2)' : 
                                            'rgba(255, 159, 10, 0.2)'}`
                      }}
                    >
                      <i className={`bi bi-${app.status === 'Scheduled' ? 'check-circle' : app.status === 'Scheduled Later' ? 'calendar-event' : 'clock-history'} me-2`}></i>
                      {app.status || 'Pending'}
                    </span>
                  </td>
                  {!(isPatient || isDoctor || isNurse || isReception) && (
                    <td className="px-4 py-4 text-end">
                      {app.status === 'Pending' && (
                        <div className="d-inline-flex gap-2 me-3 pe-3 border-end">
                          <button
                            className="btn btn-sm btn-glass p-0 text-success"
                            style={{ width: '32px', height: '32px', border: '1px solid rgba(0, 191, 131, 0.2)' }}
                            onClick={() => { setScheduledDoctorName(''); setScheduledModalApp(app); }}
                            disabled={loading}
                            title="Set to Scheduled"
                          >
                            <i className="bi bi-calendar-check" aria-hidden="true"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-glass p-0 text-primary"
                            style={{ width: '32px', height: '32px', border: '1px solid rgba(0, 122, 255, 0.2)' }}
                            onClick={() => { 
                              setScheduledLaterDate(app.appointmentDate || ''); 
                              setScheduledLaterTimeSlot(app.timeSlot || '');
                              setScheduledLaterDoctor(app.doctor || '');
                              setScheduledLaterModalApp(app); 
                            }}
                            disabled={loading}
                            title="Set to Scheduled Later"
                          >
                            <i className="bi bi-clock" aria-hidden="true"></i>
                          </button>
                        </div>
                      )}
                      <button
                        className="btn btn-sm btn-glass p-0 me-2"
                        style={{ width: '32px', height: '32px', border: '1px solid var(--accents-2)' }}
                        onClick={() => openEditModal(app)}
                        aria-label={`Edit appointment for ${app.patient}`}
                        title="Edit appointment"
                      >
                        <i className="bi bi-pencil-square" aria-hidden="true"></i>
                      </button>
                      <button
                        className="btn btn-sm btn-glass p-0 text-danger"
                        style={{ width: '32px', height: '32px', border: '1px solid var(--accents-2)' }}
                        onClick={() => {
                          setDeletingApp(app);
                          setIsDeleteModalOpen(true);
                        }}
                        aria-label={`Delete appointment for ${app.patient}`}
                        title="Delete appointment"
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
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={onRowsPerPageChange}
          totalItems={totalItems}
        />
      </div>

      {/* Book Appointment Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Schedule Appointment">
        <form onSubmit={handleSubmit}>
          <div style={{ maxHeight: '65vh', overflowY: 'auto', overflowX: 'hidden', paddingRight: '10px' }}>
            <div className="mb-4">
              <h6 className="fw-bold mb-3">Patient Details</h6>
              <div className="row g-3">
                <div className="col-md-6">
                  <label htmlFor="appointment-patient" className="form-label text-muted fw-bold small text-uppercase mb-2 required-label">Full Name</label>
                  <input
                    id="appointment-patient"
                    type="text"
                    className={`form-control ${validationErrors.patient ? 'is-invalid' : ''}`}
                    value={formData.patient}
                    onChange={(e) => setFormData((current) => syncPatientDetails(e.target.value, current))}
                    list="patient-options"
                    placeholder="Search or enter patient name"
                  />
                  <datalist id="patient-options">
                    {patients.map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.id}
                      </option>
                    ))}
                  </datalist>
                </div>
                <div className="col-md-3">
                  <label htmlFor="appointment-dob" className="form-label text-muted fw-bold small text-uppercase mb-2 required-label">Date of Birth</label>
                  <input
                    id="appointment-dob"
                    type="date"
                    className={`form-control ${validationErrors.dateOfBirth ? 'is-invalid' : ''}`}
                    value={formData.dateOfBirth}
                    onChange={(e) => {
                      const dob = e.target.value;
                      const age = calculateAge(dob);
                      setFormData({ ...formData, dateOfBirth: dob, age: age || formData.age });
                    }}
                  />
                </div>
                <div className="col-md-3">
                  <label htmlFor="appointment-age" className="form-label text-muted fw-bold small text-uppercase mb-2 required-label">Age</label>
                  <input
                    id="appointment-age"
                    type="number"
                    min="0"
                    className={`form-control ${validationErrors.age ? 'is-invalid' : ''}`}
                    placeholder="If DOB not available"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  />
                </div>
                <div className="col-md-12">
                  <label htmlFor="appointment-gender" className="form-label text-muted fw-bold small text-uppercase mb-2 required-label">Gender</label>
                  <select
                    id="appointment-gender"
                    className={`form-select ${validationErrors.gender ? 'is-invalid' : ''}`}
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  >
                    {GENDER_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </div>
                <div className="col-12">
                  <label htmlFor="appointment-address" className="form-label text-muted fw-bold small text-uppercase mb-2 required-label">Address</label>
                  <textarea
                    id="appointment-address"
                    className={`form-control ${validationErrors.address ? 'is-invalid' : ''}`}
                    rows="2"
                    placeholder="Physical Address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <div className="col-12">
                  <div className="p-3 rounded-3" style={{ background: 'rgba(99, 102, 241, 0.05)', border: '1px dashed rgba(99, 102, 241, 0.3)' }}>
                    <div className="d-flex align-items-center">
                      <i className="bi bi-magic text-primary me-2" aria-hidden="true"></i>
                      <small className="text-muted fw-medium">
                        A unique <span className="text-primary fw-bold">Appointment ID</span> will be automatically generated upon confirmation.
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mb-4">
              <h6 className="fw-bold mb-3">Appointment Details</h6>
              <div className="row g-3">
                <div className="col-md-6">
                  <label htmlFor="appointment-date" className="form-label text-muted fw-bold small text-uppercase mb-2 required-label">Appointment Date</label>
                  <input
                    id="appointment-date"
                    type="date"
                    className={`form-control ${validationErrors.appointment_date ? 'is-invalid' : ''}`}
                    value={formData.appointment_date}
                    onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label htmlFor="appointment-type" className="form-label text-muted fw-bold small text-uppercase mb-2 required-label">Appointment Type</label>
                  <select
                    id="appointment-type"
                    className={`form-select ${validationErrors.type ? 'is-invalid' : ''}`}
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    {APPOINTMENT_TYPE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </div>
                <div className="col-md-6">
                  <label htmlFor="appointment-phone" className="form-label text-muted fw-bold small text-uppercase mb-2 required-label">Phone Number</label>
                  <input
                    id="appointment-phone"
                    type="tel"
                    className={`form-control ${validationErrors.phoneNumber ? 'is-invalid' : ''}`}
                    placeholder="e.g. +1 234 567 8900"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  />
                </div>
                <div className="col-md-6">
                  <label htmlFor="appointment-email" className="form-label text-muted fw-bold small text-uppercase mb-2">Email Address</label>
                  <input
                    id="appointment-email"
                    type="email"
                    className="form-control"
                    placeholder="patient@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="col-md-6">
                  <label htmlFor="appointment-blood" className="form-label text-muted fw-bold small text-uppercase mb-2 required-label">Blood Group</label>
                  <select
                    id="appointment-blood"
                    className={`form-select ${validationErrors.bloodGroup ? 'is-invalid' : ''}`}
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                  >
                    <option>A+</option><option>A-</option>
                    <option>B+</option><option>B-</option>
                    <option>O+</option><option>O-</option>
                    <option>AB+</option><option>AB-</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label htmlFor="appointment-emergency-contact" className="form-label text-muted fw-bold small text-uppercase mb-2 required-label">Emergency Contact 1</label>
                  <input
                    id="appointment-emergency-contact"
                    type="tel"
                    className={`form-control ${validationErrors.emergencyContact ? 'is-invalid' : ''}`}
                    placeholder="Primary Contact Number"
                    value={formData.emergencyContact}
                    onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                  />
                </div>
                <div className="col-md-6">
                  <label htmlFor="appointment-emergency-contact-2" className="form-label text-muted fw-bold small text-uppercase mb-2">Emergency Contact 2</label>
                  <input
                    id="appointment-emergency-contact-2"
                    type="tel"
                    className="form-control"
                    placeholder="Secondary Contact Number"
                    value={formData.emergencyContact2}
                    onChange={(e) => setFormData({ ...formData, emergencyContact2: e.target.value })}
                  />
                </div>
                <div className="col-md-6">
                  <label htmlFor="appointment-timeslot" className="form-label text-muted fw-bold small text-uppercase mb-2 required-label">Time Slot</label>
                  <select
                    id="appointment-timeslot"
                    className={`form-select ${validationErrors.timeSlot ? 'is-invalid' : ''}`}
                    value={formData.timeSlot}
                    onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
                  >
                    <option value="">Select Time Slot</option>
                    <option value="10:00 AM">10:00 AM</option>
                    <option value="10:30 AM">10:30 AM</option>
                    <option value="11:00 AM">11:00 AM</option>
                    <option value="11:30 AM">11:30 AM</option>
                    <option value="12:00 PM">12:00 PM</option>
                    <option value="12:30 PM">12:30 PM</option>
                    <option value="1:00 PM">1:00 PM</option>
                    <option value="1:30 PM">1:30 PM</option>
                    <option value="2:00 PM">2:00 PM</option>
                    <option value="2:30 PM">2:30 PM</option>
                    <option value="3:00 PM">3:00 PM</option>
                    <option value="3:30 PM">3:30 PM</option>
                    <option value="4:00 PM">4:00 PM</option>
                    <option value="4:30 PM">4:30 PM</option>
                    <option value="5:00 PM">5:00 PM</option>
                  </select>
                </div>
                <div className="col-md-12">
                  <label htmlFor="appointment-dept" className="form-label text-muted fw-bold small text-uppercase mb-2 required-label">Department</label>
                  <select
                    id="appointment-dept"
                    className={`form-select ${validationErrors.department ? 'is-invalid' : ''}`}
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  >
                    <option value="">Select Department</option>
                    {departmentOptions.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Doctor assignment removed from Schedule form as per request */}

              </div>
            </div>
          </div>
          <div className="d-flex gap-2 mt-5">
            <button type="button" className="btn btn-glass w-100 py-2" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary w-100 py-2">
              Confirm Appointment
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Appointment Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Update Appointment Details">
        {editingApp && (
          <form onSubmit={handleEditSubmit}>
            <div style={{ maxHeight: '65vh', overflowY: 'auto', overflowX: 'hidden', paddingRight: '10px' }}>
              <div className="mb-4">
                <h6 className="fw-bold mb-3">Patient Details</h6>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label htmlFor="edit-appointment-patient" className="form-label text-muted fw-bold small text-uppercase mb-2 required-label">Full Name</label>
                    <input
                      id="edit-appointment-patient"
                      type="text"
                      className={`form-control ${validationErrors.patient ? 'is-invalid' : ''}`}
                      value={editFormData.patient}
                      onChange={(e) => setEditFormData((current) => syncPatientDetails(e.target.value, current))}
                      list="patient-options"
                      placeholder="Search or enter patient name"
                    />
                  </div>
                  <div className="col-md-3">
                    <label htmlFor="edit-appointment-dob" className="form-label text-muted fw-bold small text-uppercase mb-2 required-label">Date of Birth</label>
                    <input
                      id="edit-appointment-dob"
                      type="date"
                      className={`form-control ${validationErrors.dateOfBirth ? 'is-invalid' : ''}`}
                      value={editFormData.dateOfBirth}
                      onChange={(e) => {
                        const dob = e.target.value;
                        const age = calculateAge(dob);
                        setEditFormData({ ...editFormData, dateOfBirth: dob, age: age || editFormData.age });
                      }}
                    />
                  </div>
                  <div className="col-md-3">
                    <label htmlFor="edit-appointment-age" className="form-label text-muted fw-bold small text-uppercase mb-2 required-label">Age</label>
                    <input
                      id="edit-appointment-age"
                      type="number"
                      min="0"
                      className={`form-control ${validationErrors.age ? 'is-invalid' : ''}`}
                      value={editFormData.age}
                      onChange={(e) => setEditFormData({ ...editFormData, age: e.target.value })}
                    />
                  </div>
                    <div className="col-md-12">
                      <label htmlFor="edit-appointment-gender" className="form-label text-muted fw-bold small text-uppercase mb-2 required-label">Gender</label>
                      <select
                        id="edit-appointment-gender"
                        className={`form-select ${validationErrors.gender ? 'is-invalid' : ''}`}
                        value={editFormData.gender}
                        onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value })}
                      >
                        {GENDER_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                      </select>
                    </div>
                  <div className="col-12">
                    <label htmlFor="edit-appointment-address" className="form-label text-muted fw-bold small text-uppercase mb-2 required-label">Address</label>
                    <textarea
                      id="edit-appointment-address"
                      className={`form-control ${validationErrors.address ? 'is-invalid' : ''}`}
                      rows="2"
                      value={editFormData.address}
                      onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                    />
                  </div>
                  {editingApp?.appointmentId && (
                    <div className="col-12">
                      <div className="p-2 px-3 rounded-2 bg-light border d-flex justify-content-between align-items-center">
                        <span className="small text-muted fw-bold text-uppercase">Appointment Reference</span>
                        <span className="font-monospace fw-bold text-primary">{editingApp.appointmentId}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
                <div className="mb-4">
                  <h6 className="fw-bold mb-3">Appointment Details</h6>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label htmlFor="edit-appointment-date" className="form-label text-muted fw-bold small text-uppercase mb-2 required-label">Appointment Date</label>
                      <input
                        id="edit-appointment-date"
                        type="date"
                        className={`form-control ${validationErrors.appointment_date ? 'is-invalid' : ''}`}
                        value={editFormData.appointment_date}
                        onChange={(e) => setEditFormData({ ...editFormData, appointment_date: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="edit-appointment-type" className="form-label text-muted fw-bold small text-uppercase mb-2 required-label">Appointment Type</label>
                      <select
                        id="edit-appointment-type"
                        className={`form-select ${validationErrors.type ? 'is-invalid' : ''}`}
                        value={editFormData.type}
                        onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value })}
                      >
                        {APPOINTMENT_TYPE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="edit-appointment-phone" className="form-label text-muted fw-bold small text-uppercase mb-2 required-label">Phone Number</label>
                      <input
                        id="edit-appointment-phone"
                        type="tel"
                        className={`form-control ${validationErrors.phoneNumber ? 'is-invalid' : ''}`}
                        placeholder="e.g. +1 234 567 8900"
                        value={editFormData.phoneNumber}
                        onChange={(e) => setEditFormData({ ...editFormData, phoneNumber: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="edit-appointment-email" className="form-label text-muted fw-bold small text-uppercase mb-2">Email Address</label>
                      <input
                        id="edit-appointment-email"
                        type="email"
                        className="form-control"
                        placeholder="patient@example.com"
                        value={editFormData.email}
                        onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="edit-appointment-blood" className="form-label text-muted fw-bold small text-uppercase mb-2 required-label">Blood Group</label>
                      <select
                        id="edit-appointment-blood"
                        className={`form-select ${validationErrors.bloodGroup ? 'is-invalid' : ''}`}
                        value={editFormData.bloodGroup}
                        onChange={(e) => setEditFormData({ ...editFormData, bloodGroup: e.target.value })}
                      >
                        <option>A+</option><option>A-</option>
                        <option>B+</option><option>B-</option>
                        <option>O+</option><option>O-</option>
                        <option>AB+</option><option>AB-</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="edit-appointment-emergency-contact" className="form-label text-muted fw-bold small text-uppercase mb-2 required-label">Emergency Contact 1</label>
                      <input
                        id="edit-appointment-emergency-contact"
                        type="tel"
                        className={`form-control ${validationErrors.emergencyContact ? 'is-invalid' : ''}`}
                        placeholder="Primary Contact Number"
                        value={editFormData.emergencyContact}
                        onChange={(e) => setEditFormData({ ...editFormData, emergencyContact: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="edit-appointment-emergency-contact-2" className="form-label text-muted fw-bold small text-uppercase mb-2">Emergency Contact 2</label>
                      <input
                        id="edit-appointment-emergency-contact-2"
                        type="tel"
                        className="form-control"
                        placeholder="Secondary Contact Number"
                        value={editFormData.emergencyContact2}
                        onChange={(e) => setEditFormData({ ...editFormData, emergencyContact2: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="edit-appointment-timeslot" className="form-label text-muted fw-bold small text-uppercase mb-2 required-label">Time Slot</label>
                      <select
                        id="edit-appointment-timeslot"
                        className={`form-select ${validationErrors.timeSlot ? 'is-invalid' : ''}`}
                        value={editFormData.timeSlot}
                        onChange={(e) => setEditFormData({ ...editFormData, timeSlot: e.target.value })}
                      >
                        <option value="">Select Time Slot</option>
                        <option value="10:00 AM">10:00 AM</option>
                        <option value="10:30 AM">10:30 AM</option>
                        <option value="11:00 AM">11:00 AM</option>
                        <option value="11:30 AM">11:30 AM</option>
                        <option value="12:00 PM">12:00 PM</option>
                        <option value="12:30 PM">12:30 PM</option>
                        <option value="1:00 PM">1:00 PM</option>
                        <option value="1:30 PM">1:30 PM</option>
                        <option value="2:00 PM">2:00 PM</option>
                        <option value="2:30 PM">2:30 PM</option>
                        <option value="3:00 PM">3:00 PM</option>
                        <option value="3:30 PM">3:30 PM</option>
                        <option value="4:00 PM">4:00 PM</option>
                        <option value="4:30 PM">4:30 PM</option>
                        <option value="5:00 PM">5:00 PM</option>
                      </select>
                    </div>
                    <div className="col-md-12">
                      <label htmlFor="edit-appointment-dept" className="form-label text-muted fw-bold small text-uppercase mb-2 required-label">Department</label>
                      <select
                        id="edit-appointment-dept"
                        className={`form-select ${validationErrors.department ? 'is-invalid' : ''}`}
                        value={editFormData.department}
                        onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                      >
                        <option value="">Select Department</option>
                        {departmentOptions.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-12">
                      <label htmlFor="edit-appointment-doctor" className="form-label text-muted fw-bold small text-uppercase mb-2 required-label">Assign Doctor</label>
                      <select
                        id="edit-appointment-doctor"
                        className={`form-select ${validationErrors.doctor ? 'is-invalid' : ''}`}
                        value={editFormData.doctor}
                        onChange={(e) => setEditFormData({ ...editFormData, doctor: e.target.value })}
                      >
                        <option value="">{editFormData.department ? 'Select a Doctor' : 'Please select department first'}</option>
                        {staff
                          .filter(s => s.role === 'Doctor' && (!editFormData.department || s.dept === editFormData.department))
                          .map((s) => (
                            <option key={s.id} value={s.name}>
                              {s.name} ({s.id})
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                </div>
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
        itemName={deletingApp?.patient}
        itemType="Appointment"
      />

      {/* ── Scheduled: Doctor Name Dialog ── */}
      {!!scheduledModalApp && (
        <div
          style={{
            position: 'fixed', inset: 0,
            backgroundColor: 'rgba(2, 6, 23, 0.80)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            zIndex: 4000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            animation: 'fadeIn 0.2s ease',
          }}
          onClick={() => setScheduledModalApp(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="sched-dialog-title"
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '440px',
              boxShadow: '0 32px 80px rgba(0,0,0,0.35), 0 0 0 1px rgba(0,191,131,0.25)',
              overflow: 'hidden',
              animation: 'slideUp 0.25s cubic-bezier(0.34,1.56,0.64,1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #00bf83 0%, #00a372 100%)',
              padding: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
            }}>
              <div style={{
                width: '48px', height: '48px',
                borderRadius: '14px',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <i className="bi bi-calendar-check-fill" style={{ fontSize: '1.4rem', color: '#fff' }} />
              </div>
              <div>
                <h5 id="sched-dialog-title" style={{ margin: 0, fontWeight: 700, color: '#fff', fontSize: '1.1rem' }}>
                  Confirm Scheduled
                </h5>
                <p style={{ margin: 0, color: 'rgba(255,255,255,0.8)', fontSize: '0.82rem', marginTop: '2px' }}>
                  Assign a doctor to this appointment
                </p>
              </div>
              <button
                type="button"
                onClick={() => setScheduledModalApp(null)}
                style={{
                  marginLeft: 'auto', background: 'rgba(255,255,255,0.2)',
                  border: 'none', borderRadius: '50%',
                  width: '32px', height: '32px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: '#fff', flexShrink: 0,
                  transition: 'background 0.2s',
                }}
                aria-label="Close"
              >
                <i className="bi bi-x-lg" style={{ fontSize: '0.85rem' }} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '1.5rem' }}>
              <div style={{
                background: 'rgba(0,191,131,0.07)',
                border: '1px solid rgba(0,191,131,0.18)',
                borderRadius: '12px',
                padding: '0.75rem 1rem',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
              }}>
                <i className="bi bi-person-circle" style={{ color: '#00bf83', fontSize: '1rem', flexShrink: 0 }} />
                <span style={{ fontSize: '0.88rem', color: '#374151' }}>
                  Patient: <strong>{scheduledModalApp?.patient}</strong>
                </span>
              </div>

              <label
                htmlFor="schedule-doctor-name"
                style={{ display: 'block', fontWeight: 700, fontSize: '0.75rem',
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                  color: '#6b7280', marginBottom: '0.5rem' }}
                className="required-label"
              >
                Doctor Name
              </label>
              <div style={{ position: 'relative' }}>
                <i className="bi bi-person-badge"
                  style={{ position: 'absolute', left: '12px', top: '50%',
                    transform: 'translateY(-50%)', color: '#00bf83', pointerEvents: 'none' }}
                />
                <select
                  id="schedule-doctor-name"
                  className="form-select"
                  value={scheduledDoctorName}
                  onChange={(e) => setScheduledDoctorName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleConfirmScheduled()}
                  autoFocus
                  style={{
                    paddingLeft: '36px',
                    borderRadius: '12px',
                    border: '2px solid #e5e7eb',
                    fontSize: '0.95rem',
                    transition: 'border-color 0.2s',
                    appearance: 'none',
                    backgroundColor: '#fff',
                  }}
                >
                  <option value="" disabled>Select a Doctor</option>
                  {staff
                    .filter(s => s.role === 'Doctor' && (!scheduledModalApp?.department || s.dept === scheduledModalApp.department))
                    .map((s) => <option key={s.id} value={s.name}>{s.name} ({s.id})</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setScheduledModalApp(null)}
                  style={{
                    flex: 1, padding: '0.65rem 1rem',
                    border: '2px solid #e5e7eb', borderRadius: '12px',
                    background: '#fff', color: '#374151', fontWeight: 600,
                    fontSize: '0.9rem', cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmScheduled}
                  disabled={loading || !scheduledDoctorName.trim()}
                  style={{
                    flex: 1, padding: '0.65rem 1rem',
                    border: 'none', borderRadius: '12px',
                    background: scheduledDoctorName.trim()
                      ? 'linear-gradient(135deg, #00bf83 0%, #00a372 100%)'
                      : '#d1fae5',
                    color: scheduledDoctorName.trim() ? '#fff' : '#6ee7b7',
                    fontWeight: 700, fontSize: '0.9rem', cursor: scheduledDoctorName.trim() ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                  }}
                >
                  <i className="bi bi-calendar-check-fill" />
                  Confirm Scheduled
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Schedule Later: Reason Dialog ── */}
      {!!scheduledLaterModalApp && (
        <div
          style={{
            position: 'fixed', inset: 0,
            backgroundColor: 'rgba(2, 6, 23, 0.80)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            zIndex: 4000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            animation: 'fadeIn 0.2s ease',
          }}
          onClick={() => setScheduledLaterModalApp(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="sched-later-dialog-title"
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '440px',
              boxShadow: '0 32px 80px rgba(0,0,0,0.35), 0 0 0 1px rgba(0,122,255,0.25)',
              overflow: 'hidden',
              animation: 'slideUp 0.25s cubic-bezier(0.34,1.56,0.64,1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #007aff 0%, #0055cc 100%)',
              padding: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
            }}>
              <div style={{
                width: '48px', height: '48px',
                borderRadius: '14px',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <i className="bi bi-clock-history" style={{ fontSize: '1.4rem', color: '#fff' }} />
              </div>
              <div>
                <h5 id="sched-later-dialog-title" style={{ margin: 0, fontWeight: 700, color: '#fff', fontSize: '1.1rem' }}>
                  Schedule Later
                </h5>
                <p style={{ margin: 0, color: 'rgba(255,255,255,0.8)', fontSize: '0.82rem', marginTop: '2px' }}>
                  Provide a reason for deferring
                </p>
              </div>
              <button
                type="button"
                onClick={() => setScheduledLaterModalApp(null)}
                style={{
                  marginLeft: 'auto', background: 'rgba(255,255,255,0.2)',
                  border: 'none', borderRadius: '50%',
                  width: '32px', height: '32px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: '#fff', flexShrink: 0,
                  transition: 'background 0.2s',
                }}
                aria-label="Close"
              >
                <i className="bi bi-x-lg" style={{ fontSize: '0.85rem' }} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '1.5rem' }}>
              <div style={{
                background: 'rgba(0,122,255,0.07)',
                border: '1px solid rgba(0,122,255,0.18)',
                borderRadius: '12px',
                padding: '0.75rem 1rem',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
              }}>
                <i className="bi bi-person-circle" style={{ color: '#007aff', fontSize: '1rem', flexShrink: 0 }} />
                <span style={{ fontSize: '0.88rem', color: '#374151' }}>
                  Patient: <strong>{scheduledLaterModalApp?.patient}</strong>
                </span>
              </div>

              <div className="row g-3">
                <div className="col-md-12">
                  <label
                    htmlFor="schedule-later-date"
                    style={{ display: 'block', fontWeight: 700, fontSize: '0.75rem',
                      textTransform: 'uppercase', letterSpacing: '0.06em',
                      color: '#6b7280', marginBottom: '0.5rem' }}
                  >
                    Appointment Date
                  </label>
                  <input
                    id="schedule-later-date"
                    type="date"
                    className="form-control"
                    value={scheduledLaterDate}
                    onChange={(e) => setScheduledLaterDate(e.target.value)}
                    required
                    style={{
                      borderRadius: '12px',
                      border: '2px solid #e5e7eb',
                      fontSize: '0.95rem',
                      transition: 'border-color 0.2s',
                    }}
                  />
                </div>

                <div className="col-md-6">
                  <label
                    htmlFor="schedule-later-timeslot"
                    style={{ display: 'block', fontWeight: 700, fontSize: '0.75rem',
                      textTransform: 'uppercase', letterSpacing: '0.06em',
                      color: '#6b7280', marginBottom: '0.5rem' }}
                  >
                    Time Slot
                  </label>
                  <select
                    id="schedule-later-timeslot"
                    className="form-select"
                    value={scheduledLaterTimeSlot}
                    onChange={(e) => setScheduledLaterTimeSlot(e.target.value)}
                    style={{
                      borderRadius: '12px',
                      border: '2px solid #e5e7eb',
                      fontSize: '0.95rem',
                    }}
                  >
                    <option value="">Select Time Slot</option>
                    <option value="10:00 AM">10:00 AM</option>
                    <option value="10:30 AM">10:30 AM</option>
                    <option value="11:00 AM">11:00 AM</option>
                    <option value="11:30 AM">11:30 AM</option>
                    <option value="12:00 PM">12:00 PM</option>
                    <option value="12:30 PM">12:30 PM</option>
                    <option value="1:00 PM">1:00 PM</option>
                    <option value="1:30 PM">1:30 PM</option>
                    <option value="2:00 PM">2:00 PM</option>
                    <option value="2:30 PM">2:30 PM</option>
                    <option value="3:00 PM">3:00 PM</option>
                    <option value="3:30 PM">3:30 PM</option>
                    <option value="4:00 PM">4:00 PM</option>
                    <option value="4:30 PM">4:30 PM</option>
                    <option value="5:00 PM">5:00 PM</option>
                  </select>
                </div>

                <div className="col-md-6">
                  <label
                    htmlFor="schedule-later-doctor"
                    style={{ display: 'block', fontWeight: 700, fontSize: '0.75rem',
                      textTransform: 'uppercase', letterSpacing: '0.06em',
                      color: '#6b7280', marginBottom: '0.5rem' }}
                  >
                    Doctor Name
                  </label>
                  <select
                    id="schedule-later-doctor"
                    className="form-select"
                    value={scheduledLaterDoctor}
                    onChange={(e) => setScheduledLaterDoctor(e.target.value)}
                    style={{
                      borderRadius: '12px',
                      border: '2px solid #e5e7eb',
                      fontSize: '0.95rem',
                    }}
                  >
                    <option value="">Not Assigned</option>
                    {staff
                      .filter(s => s.role === 'Doctor' && (!scheduledLaterModalApp?.department || s.dept === scheduledLaterModalApp.department))
                      .map((s) => <option key={s.id} value={s.name}>{s.name} ({s.id})</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setScheduledLaterModalApp(null)}
                  style={{
                    flex: 1, padding: '0.65rem 1rem',
                    border: '2px solid #e5e7eb', borderRadius: '12px',
                    background: '#fff', color: '#374151', fontWeight: 600,
                    fontSize: '0.9rem', cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmScheduledLater}
                  disabled={loading || !scheduledLaterDate}
                  style={{
                    flex: 1, padding: '0.65rem 1rem',
                    border: 'none', borderRadius: '12px',
                    background: scheduledLaterDate
                      ? 'linear-gradient(135deg, #007aff 0%, #0055cc 100%)'
                      : '#dbeafe',
                    color: scheduledLaterDate ? '#fff' : '#93c5fd',
                    fontWeight: 700, fontSize: '0.9rem', cursor: scheduledLaterDate ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                  }}
                >
                  <i className="bi bi-clock-fill" />
                  Confirm Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default Appointments;
