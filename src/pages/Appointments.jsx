import React, { useMemo, useState } from 'react';
import { useApp, mapAppointmentFromApi, mapPatientFromApi, mapStaffFromApi, createCode, parseDisplayTime } from '../context/AppContext';
import { useCrud } from '../hooks/useCrud';
import { appointmentsApi, patientsApi, staffApi } from '../lib/api';
import Modal from '../components/UI/Modal';
import EmptyState from '../components/UI/EmptyState';
import DeleteConfirmation from '../components/UI/DeleteConfirmation';

const STATUS_OPTIONS = ['Scheduled', 'In Progress', 'Completed', 'Cancelled'];

const Appointments = () => {
  const { showToast } = useApp();
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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState(null);
  const [deletingApp, setDeletingApp] = useState(null);

  const [formData, setFormData] = useState({
    time: '14:30 PM',
    patient: '',
    doctor: '',
    type: 'Checkup',
  });

  const [editFormData, setEditFormData] = useState({
    time: '',
    patient: '',
    doctor: '',
    type: 'Checkup',
    status: 'Scheduled'
  });

  const appointmentSummary = useMemo(
    () => ({
      todayCount: appointments.length,
      completedCount: appointments.filter((appointment) => appointment.status === 'Completed').length,
    }),
    [appointments]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patient) {
      showToast('Please select a patient for the appointment.', 'warning');
      return;
    }
    try {
      const payload = {
        patient_name: formData.patient,
        doctor_name: formData.doctor,
        scheduled_time: parseDisplayTime(formData.time),
        appointment_type: formData.type,
        appointment_code: createCode('A'),
        status: 'Scheduled'
      };
      await addAppointment(payload);
      showToast(`Appointment for ${formData.patient} scheduled successfully.`);
      setIsModalOpen(false);
      setFormData({ time: '14:30 PM', patient: '', doctor: '', type: 'Checkup' });
    } catch (error) {
      showToast(error.message || 'Unable to schedule the appointment.', 'error');
    }
  };

  const openEditModal = (app) => {
    setEditingApp(app);
    setEditFormData({
      time: app.time,
      patient: app.patient,
      doctor: app.doctor,
      type: app.type,
      status: app.status
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        patient_name: editFormData.patient,
        doctor_name: editFormData.doctor,
        scheduled_time: parseDisplayTime(editFormData.time),
        appointment_type: editFormData.type,
        status: editFormData.status
      };
      await updateAppointment(editingApp.apiId, payload);
      showToast(`Appointment for ${editFormData.patient} updated successfully.`);
      setIsEditModalOpen(false);
      setEditingApp(null);
    } catch (error) {
      showToast(error.message || 'Unable to update the appointment.', 'error');
    }
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
            <button className="btn btn-sm px-3 bg-white text-black fw-bold">Today {appointmentSummary.todayCount}</button>
            <button className="btn btn-sm px-3 text-muted">Completed {appointmentSummary.completedCount}</button>
          </div>
        </div>
        <div className="table-responsive">
          <table className="table table-hover mb-0 align-middle">
            <thead>
              <tr>
                <th className="px-4 py-3">Slot Time</th>
                <th className="py-3">Patient Name</th>
                <th className="py-3">Attending Doctor</th>
                <th className="py-3">Visit Type</th>
                <th className="py-3 text-center">Status</th>
                <th className="px-4 py-3 text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="text-center py-5"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div></td></tr>
              ) : appointments.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-0">
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
                  <td className="px-4 py-4 fw-bold" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {app.time}
                  </td>
                  <td className="py-4 fw-bold">{app.patient}</td>
                  <td className="py-4 text-muted small">{app.doctor}</td>
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
                  <td className="py-4 text-center">
                    <span
                      className="badge rounded-pill px-3 py-1 border"
                      style={{
                        background:
                          app.status === 'Completed'
                            ? 'rgba(16, 185, 129, 0.1)'
                            : app.status === 'In Progress'
                              ? 'rgba(0, 112, 243, 0.1)'
                              : app.status === 'Cancelled'
                                ? 'rgba(238, 0, 0, 0.1)'
                                : 'rgba(245, 166, 35, 0.1)',
                        color:
                          app.status === 'Completed' || app.status === 'In Progress'
                            ? 'var(--geist-success)'
                            : app.status === 'Cancelled'
                              ? 'var(--geist-error)'
                              : 'var(--geist-warning)',
                        borderColor:
                          app.status === 'Cancelled'
                            ? 'rgba(238, 0, 0, 0.2)'
                            : app.status === 'Completed'
                              ? 'rgba(16, 185, 129, 0.2)'
                              : app.status === 'In Progress'
                                ? 'rgba(0, 112, 243, 0.2)'
                                : 'rgba(245, 166, 35, 0.2)',
                        fontSize: '0.75rem',
                      }}
                    >
                      <span className="pulsing-dot me-2" aria-hidden="true" style={{ width: '6px', height: '6px' }}></span>
                      {app.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-end">
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Book Appointment Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Schedule Appointment">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="appointment-patient" className="form-label text-muted fw-bold small text-uppercase mb-2">Select Patient</label>
            <select
              id="appointment-patient"
              className="form-select"
              value={formData.patient}
              onChange={(e) => setFormData({ ...formData, patient: e.target.value })}
            >
              <option value="">Select a registered patient...</option>
              {patients.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name} ({p.id})
                </option>
              ))}
            </select>
          </div>
          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <label htmlFor="appointment-doctor" className="form-label text-muted fw-bold small text-uppercase mb-2">Doctor</label>
              <input
                id="appointment-doctor"
                type="text"
                className="form-control"
                value={formData.doctor}
                onChange={(e) => setFormData({ ...formData, doctor: e.target.value })}
                list="doctor-options"
                placeholder="Enter doctor name"
              />
              <datalist id="doctor-options">
                {doctorOptions.map((doctor) => (
                  <option key={doctor} value={doctor} />
                ))}
              </datalist>
            </div>
            <div className="col-md-6">
              <label htmlFor="appointment-type" className="form-label text-muted fw-bold small text-uppercase mb-2">Visit Type</label>
              <select
                id="appointment-type"
                className="form-select"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option>Checkup</option>
                <option>Follow-up</option>
                <option>Consultation</option>
                <option>Emergency</option>
              </select>
            </div>
          </div>
          <div className="mb-4">
            <label htmlFor="appointment-time" className="form-label text-muted fw-bold small text-uppercase mb-2">Time Slot</label>
            <input
              id="appointment-time"
              type="text"
              className="form-control"
              placeholder="e.g. 10:30 AM"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
            />
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
            <div className="mb-4">
              <label htmlFor="edit-appointment-patient" className="form-label text-muted fw-bold small text-uppercase mb-2">Select Patient</label>
              <select
                id="edit-appointment-patient"
                className="form-select"
                value={editFormData.patient}
                onChange={(e) => setEditFormData({ ...editFormData, patient: e.target.value })}
              >
                <option value="">Select a registered patient...</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name} ({p.id})
                  </option>
                ))}
              </select>
            </div>
            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <label htmlFor="edit-appointment-doctor" className="form-label text-muted fw-bold small text-uppercase mb-2">Doctor</label>
                <input
                  id="edit-appointment-doctor"
                  type="text"
                  className="form-control"
                  value={editFormData.doctor}
                  onChange={(e) => setEditFormData({ ...editFormData, doctor: e.target.value })}
                  list="doctor-options"
                  placeholder="Enter doctor name"
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="edit-appointment-type" className="form-label text-muted fw-bold small text-uppercase mb-2">Visit Type</label>
                <select
                  id="edit-appointment-type"
                  className="form-select"
                  value={editFormData.type}
                  onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value })}
                >
                  <option>Checkup</option>
                  <option>Follow-up</option>
                  <option>Consultation</option>
                  <option>Emergency</option>
                </select>
              </div>
            </div>
            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <label htmlFor="edit-appointment-time" className="form-label text-muted fw-bold small text-uppercase mb-2">Time Slot</label>
                <input
                  id="edit-appointment-time"
                  type="text"
                  className="form-control"
                  placeholder="e.g. 10:30 AM"
                  value={editFormData.time}
                  onChange={(e) => setEditFormData({ ...editFormData, time: e.target.value })}
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="edit-status" className="form-label text-muted fw-bold small text-uppercase mb-2">Status</label>
                <select
                  id="edit-status"
                  className="form-select"
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                >
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
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
    </main>
  );
};

export default Appointments;
