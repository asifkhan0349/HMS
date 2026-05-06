import React, { useMemo, useState } from 'react';
import { useApp, mapAppointmentFromApi, mapPatientFromApi, mapStaffFromApi, createCode, parseDisplayTime } from '../context/AppContext';
import { useCrud } from '../hooks/useCrud';
import { appointmentsApi, patientsApi, staffApi } from '../lib/api';
import Modal from '../components/UI/Modal';
import EmptyState from '../components/UI/EmptyState';
import DeleteConfirmation from '../components/UI/DeleteConfirmation';
import { Skeleton } from 'boneyard-js/react';

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
  timeSlot: '',
  department: '',
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
  
  const { data: patients } = useCrud(patientsApi, mapPatientFromApi);
  const { data: staff } = useCrud(staffApi, mapStaffFromApi);
  const doctorOptions = [...new Set(staff.filter(s => s.role === 'Doctor').map(s => s.name))];
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
  const [scheduledLaterReason, setScheduledLaterReason] = useState('');

  const [formData, setFormData] = useState(createEmptyAppointmentForm);

  const [editFormData, setEditFormData] = useState({
    patient: '',
    dateOfBirth: '',
    age: '',
    gender: 'Male',
    address: '',
    appointment_date: '',
    type: 'New Consultation',
    phoneNumber: '',
    timeSlot: '',
    department: '',
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
    };
  };

  const buildAppointmentPayload = (
    appointmentData
  ) => ({
    patient_name: appointmentData.patient.trim(),
    patient_date_of_birth: appointmentData.dateOfBirth || null,
    patient_age: appointmentData.age ? Number(appointmentData.age) : null,
    patient_gender: appointmentData.gender,
    patient_address: appointmentData.address.trim() || null,
    appointment_date: appointmentData.appointment_date,
    appointment_type: appointmentData.type,
    phone_number: appointmentData.phoneNumber.trim() || null,
    time_slot: appointmentData.timeSlot.trim() || null,
    department: appointmentData.department.trim() || null,
  });

  const appointmentSummary = useMemo(
    () => ({
      todayCount: appointments.length,
    }),
    [appointments]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patient.trim()) {
      showToast('Please enter the patient full name.', 'warning');
      return;
    }
    if (!formData.dateOfBirth && !formData.age) {
      showToast('Please provide either date of birth or age.', 'warning');
      return;
    }

    try {
      const payload = buildAppointmentPayload(
        formData
      );
      await addAppointment(payload);
      showToast(`Appointment for ${formData.patient} scheduled successfully.`);
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
      timeSlot: app.timeSlot || '',
      department: app.department || '',
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editFormData.patient.trim()) {
      showToast('Please enter the patient full name.', 'warning');
      return;
    }
    if (!editFormData.dateOfBirth && !editFormData.age) {
      showToast('Please provide either date of birth or age.', 'warning');
      return;
    }

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
    await handleStatusUpdate(scheduledModalApp, 'Scheduled', { doctor_name: scheduledDoctorName.trim() });
    setScheduledModalApp(null);
    setScheduledDoctorName('');
  };

  const handleConfirmScheduledLater = async () => {
    if (!scheduledLaterReason.trim()) {
      showToast('Please enter the reason.', 'warning');
      return;
    }
    await handleStatusUpdate(scheduledLaterModalApp, 'Scheduled Later', { scheduled_later_reason: scheduledLaterReason.trim() });
    setScheduledLaterModalApp(null);
    setScheduledLaterReason('');
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
          <div className="btn-group border rounded-2" style={{ overflow: 'hidden' }}>
            <button className="btn btn-sm px-3 bg-white text-black fw-bold">Active {appointmentSummary.todayCount}</button>
          </div>
        </div>
        <Skeleton name="appointments-table" loading={loading}>
          <div className="table-responsive">
            <table className="table table-hover mb-0 align-middle">
            <thead>
              <tr>
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
                  <td colSpan={user?.role === 'Admin' ? 8 : 7} className="p-0">
                    <EmptyState
                      icon="bi-calendar-event"
                      title="No Appointments"
                      description="The daily clinical schedule is clear. You can book a new appointment for any registered patient."
                      actionText="Book Appointment"
                      onAction={() => setIsModalOpen(true)}
                    />
                  </td>
                </tr>
              ) : appointments.map((app) => (
                <tr key={app.id}>
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
                            onClick={() => { setScheduledLaterReason(''); setScheduledLaterModalApp(app); }}
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
      </div>

      {/* Book Appointment Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Schedule Appointment">
        <form onSubmit={handleSubmit}>
          <div style={{ maxHeight: '65vh', overflowY: 'auto', overflowX: 'hidden', paddingRight: '10px' }}>
            <div className="mb-4">
              <h6 className="fw-bold mb-3">Patient Details</h6>
              <div className="row g-3">
                <div className="col-md-6">
                  <label htmlFor="appointment-patient" className="form-label text-muted fw-bold small text-uppercase mb-2">Full Name</label>
                  <input
                    id="appointment-patient"
                    type="text"
                    className="form-control"
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
                  <label htmlFor="appointment-dob" className="form-label text-muted fw-bold small text-uppercase mb-2">Date of Birth</label>
                  <input
                    id="appointment-dob"
                    type="date"
                    className="form-control"
                    value={formData.dateOfBirth}
                    onChange={(e) => {
                      const dob = e.target.value;
                      const age = calculateAge(dob);
                      setFormData({ ...formData, dateOfBirth: dob, age: age || formData.age });
                    }}
                  />
                </div>
                <div className="col-md-3">
                  <label htmlFor="appointment-age" className="form-label text-muted fw-bold small text-uppercase mb-2">Age</label>
                  <input
                    id="appointment-age"
                    type="number"
                    min="0"
                    className="form-control"
                    placeholder="If DOB not available"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  />
                </div>
                <div className="col-md-12">
                  <label htmlFor="appointment-gender" className="form-label text-muted fw-bold small text-uppercase mb-2">Gender</label>
                  <select
                    id="appointment-gender"
                    className="form-select"
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  >
                    {GENDER_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </div>
                <div className="col-12">
                  <label htmlFor="appointment-address" className="form-label text-muted fw-bold small text-uppercase mb-2">Address</label>
                  <textarea
                    id="appointment-address"
                    className="form-control"
                    rows="2"
                    placeholder="Optional"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="mb-4">
              <h6 className="fw-bold mb-3">Appointment Details</h6>
              <div className="row g-3">
                <div className="col-md-6">
                  <label htmlFor="appointment-date" className="form-label text-muted fw-bold small text-uppercase mb-2">Appointment Date</label>
                  <input
                    id="appointment-date"
                    type="date"
                    className="form-control"
                    value={formData.appointment_date}
                    onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label htmlFor="appointment-type" className="form-label text-muted fw-bold small text-uppercase mb-2">Appointment Type</label>
                  <select
                    id="appointment-type"
                    className="form-select"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    {APPOINTMENT_TYPE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </div>
                <div className="col-md-6">
                  <label htmlFor="appointment-phone" className="form-label text-muted fw-bold small text-uppercase mb-2">Phone Number</label>
                  <input
                    id="appointment-phone"
                    type="tel"
                    className="form-control"
                    placeholder="e.g. +1 234 567 8900"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  />
                </div>
                <div className="col-md-6">
                  <label htmlFor="appointment-timeslot" className="form-label text-muted fw-bold small text-uppercase mb-2">Time Slot</label>
                  <input
                    id="appointment-timeslot"
                    type="text"
                    className="form-control"
                    placeholder="e.g. 10:30 AM"
                    value={formData.timeSlot}
                    onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
                  />
                </div>
                <div className="col-md-12">
                  <label htmlFor="appointment-dept" className="form-label text-muted fw-bold small text-uppercase mb-2">Department</label>
                  <select
                    id="appointment-dept"
                    className="form-select"
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
                    <label htmlFor="edit-appointment-patient" className="form-label text-muted fw-bold small text-uppercase mb-2">Full Name</label>
                    <input
                      id="edit-appointment-patient"
                      type="text"
                      className="form-control"
                      value={editFormData.patient}
                      onChange={(e) => setEditFormData((current) => syncPatientDetails(e.target.value, current))}
                      list="patient-options"
                      placeholder="Search or enter patient name"
                    />
                  </div>
                  <div className="col-md-3">
                    <label htmlFor="edit-appointment-dob" className="form-label text-muted fw-bold small text-uppercase mb-2">Date of Birth</label>
                    <input
                      id="edit-appointment-dob"
                      type="date"
                      className="form-control"
                      value={editFormData.dateOfBirth}
                      onChange={(e) => {
                        const dob = e.target.value;
                        const age = calculateAge(dob);
                        setEditFormData({ ...editFormData, dateOfBirth: dob, age: age || editFormData.age });
                      }}
                    />
                  </div>
                  <div className="col-md-3">
                    <label htmlFor="edit-appointment-age" className="form-label text-muted fw-bold small text-uppercase mb-2">Age</label>
                    <input
                      id="edit-appointment-age"
                      type="number"
                      min="0"
                      className="form-control"
                      value={editFormData.age}
                      onChange={(e) => setEditFormData({ ...editFormData, age: e.target.value })}
                    />
                  </div>
                    <div className="col-md-12">
                      <label htmlFor="edit-appointment-gender" className="form-label text-muted fw-bold small text-uppercase mb-2">Gender</label>
                      <select
                        id="edit-appointment-gender"
                        className="form-select"
                        value={editFormData.gender}
                        onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value })}
                      >
                        {GENDER_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                      </select>
                    </div>
                  <div className="col-12">
                    <label htmlFor="edit-appointment-address" className="form-label text-muted fw-bold small text-uppercase mb-2">Address</label>
                    <textarea
                      id="edit-appointment-address"
                      className="form-control"
                      rows="2"
                      value={editFormData.address}
                      onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                    />
                  </div>
                </div>
              </div>
                <div className="mb-4">
                  <h6 className="fw-bold mb-3">Appointment Details</h6>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label htmlFor="edit-appointment-date" className="form-label text-muted fw-bold small text-uppercase mb-2">Appointment Date</label>
                      <input
                        id="edit-appointment-date"
                        type="date"
                        className="form-control"
                        value={editFormData.appointment_date}
                        onChange={(e) => setEditFormData({ ...editFormData, appointment_date: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="edit-appointment-type" className="form-label text-muted fw-bold small text-uppercase mb-2">Appointment Type</label>
                      <select
                        id="edit-appointment-type"
                        className="form-select"
                        value={editFormData.type}
                        onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value })}
                      >
                        {APPOINTMENT_TYPE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="edit-appointment-phone" className="form-label text-muted fw-bold small text-uppercase mb-2">Phone Number</label>
                      <input
                        id="edit-appointment-phone"
                        type="tel"
                        className="form-control"
                        placeholder="e.g. +1 234 567 8900"
                        value={editFormData.phoneNumber}
                        onChange={(e) => setEditFormData({ ...editFormData, phoneNumber: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="edit-appointment-timeslot" className="form-label text-muted fw-bold small text-uppercase mb-2">Time Slot</label>
                      <input
                        id="edit-appointment-timeslot"
                        type="text"
                        className="form-control"
                        placeholder="e.g. 10:30 AM"
                        value={editFormData.timeSlot}
                        onChange={(e) => setEditFormData({ ...editFormData, timeSlot: e.target.value })}
                      />
                    </div>
                    <div className="col-md-12">
                      <label htmlFor="edit-appointment-dept" className="form-label text-muted fw-bold small text-uppercase mb-2">Department</label>
                      <select
                        id="edit-appointment-dept"
                        className="form-select"
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
              >
                Doctor Name
              </label>
              <div style={{ position: 'relative' }}>
                <i className="bi bi-person-badge"
                  style={{ position: 'absolute', left: '12px', top: '50%',
                    transform: 'translateY(-50%)', color: '#00bf83', pointerEvents: 'none' }}
                />
                <input
                  id="schedule-doctor-name"
                  type="text"
                  className="form-control"
                  placeholder="e.g. Dr. Ananya Sharma"
                  value={scheduledDoctorName}
                  onChange={(e) => setScheduledDoctorName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleConfirmScheduled()}
                  list="doctor-options-scheduled"
                  autoFocus
                  style={{
                    paddingLeft: '36px',
                    borderRadius: '12px',
                    border: '2px solid #e5e7eb',
                    fontSize: '0.95rem',
                    transition: 'border-color 0.2s',
                  }}
                />
                <datalist id="doctor-options-scheduled">
                  {doctorOptions.map((d) => <option key={d} value={d} />)}
                </datalist>
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

              <label
                htmlFor="schedule-later-reason"
                style={{ display: 'block', fontWeight: 700, fontSize: '0.75rem',
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                  color: '#6b7280', marginBottom: '0.5rem' }}
              >
                Reason for Scheduling Later
              </label>
              <textarea
                id="schedule-later-reason"
                className="form-control"
                rows={3}
                placeholder="e.g. Doctor unavailable, patient requested a later slot…"
                value={scheduledLaterReason}
                onChange={(e) => setScheduledLaterReason(e.target.value)}
                autoFocus
                style={{
                  borderRadius: '12px',
                  border: '2px solid #e5e7eb',
                  fontSize: '0.95rem',
                  resize: 'none',
                  transition: 'border-color 0.2s',
                }}
              />

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
                  disabled={loading || !scheduledLaterReason.trim()}
                  style={{
                    flex: 1, padding: '0.65rem 1rem',
                    border: 'none', borderRadius: '12px',
                    background: scheduledLaterReason.trim()
                      ? 'linear-gradient(135deg, #007aff 0%, #0055cc 100%)'
                      : '#dbeafe',
                    color: scheduledLaterReason.trim() ? '#fff' : '#93c5fd',
                    fontWeight: 700, fontSize: '0.9rem', cursor: scheduledLaterReason.trim() ? 'pointer' : 'not-allowed',
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
