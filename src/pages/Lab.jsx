import React, { useMemo, useState } from 'react';
import { useApp, mapTestFromApi, mapPatientFromApi, mapStaffFromApi, createCode } from '../context/AppContext';
import { useCrud } from '../hooks/useCrud';
import { testsApi, patientsApi, staffApi } from '../lib/api';
import Modal from '../components/UI/Modal';
import EmptyState from '../components/UI/EmptyState';
import DeleteConfirmation from '../components/UI/DeleteConfirmation';
import { Skeleton } from 'boneyard-js/react';

const Lab = () => {
  const { showToast } = useApp();
  const { 
    data: tests, 
    loading, 
    addData: addTest,
    updateData: updateTest,
    removeData: deleteTest
  } = useCrud(testsApi, mapTestFromApi);
  
  const { data: patients, loading: loadingPatients } = useCrud(patientsApi, mapPatientFromApi);
  const { data: staff, loading: loadingStaff } = useCrud(staffApi, mapStaffFromApi);
  
  const doctorOptions = useMemo(() => 
    [...new Set(staff.filter(s => s.role === 'Doctor').map(s => s.name))], 
    [staff]
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
  const [deletingTest, setDeletingTest] = useState(null);

  const [formData, setFormData] = useState({
    patient: '',
    test: '',
    doctor: '',
  });

  const [editFormData, setEditFormData] = useState({
    patient: '',
    test: '',
    doctor: '',
    status: ''
  });

  const labStats = useMemo(
    () => ({
      total: tests.length,
      processing: tests.filter((test) => test.status === 'Processing').length,
    }),
    [tests]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patient || !formData.test) {
      showToast('Please specify patient and diagnostic test type.', 'warning');
      return;
    }
    try {
      await addTest({
        patient_name: formData.patient,
        test_name: formData.test,
        doctor_name: formData.doctor,
        status: 'Pending',
        test_code: createCode('LAB'),
      });
      showToast(`Laboratory Protocol Initiated: ${formData.test} ordered for ${formData.patient}.`);
      setIsModalOpen(false);
      setFormData({ patient: '', test: '', doctor: '' });
    } catch (error) {
      showToast(error.message || 'Unable to place the lab order.', 'error');
    }
  };

  const openEditModal = (test) => {
    setEditingTest(test);
    setEditFormData({
      patient: test.patient,
      test: test.test,
      doctor: test.doctor,
      status: test.status
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateTest(editingTest.apiId, {
        patient_name: editFormData.patient,
        test_name: editFormData.test,
        doctor_name: editFormData.doctor,
        status: editFormData.status
      });
      showToast(`Lab order ${editingTest.id} updated.`);
      setIsEditModalOpen(false);
      setEditingTest(null);
    } catch (error) {
      showToast(error.message || 'Unable to update lab order.', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteTest(deletingTest.apiId);
      showToast(`Lab order ${deletingTest.id} removed.`);
      setIsDeleteModalOpen(false);
      setDeletingTest(null);
    } catch (error) {
      showToast(error.message || 'Unable to delete lab order.', 'error');
    }
  };

  return (
    <div className="lab-page">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-0">Diagnostic Laboratory</h2>
          <p className="text-white opacity-75 mb-0">Monitor clinical pathology and bio-telemetry results.</p>
        </div>
        <button className="btn btn-primary px-4 py-2 rounded-3 shadow-sm" onClick={() => setIsModalOpen(true)}>
          <i className="bi bi-plus-square me-2"></i>Order New Test
        </button>
      </div>

      <div className="glass-card p-0 overflow-hidden shadow-lg border-0">
        <div className="p-4 border-bottom d-flex justify-content-between align-items-center">
          <h5 className="fw-bold mb-0">Active Diagnostic Queue</h5>
          <div className="text-white opacity-75 small">Processing now: {labStats.processing}</div>
        </div>
        <Skeleton name="lab-table" loading={loading}>
        <div className="table-responsive">
          <table className="table table-hover mb-0 align-middle">
            <thead>
              <tr>
                <th className="px-4 py-4">Lab ID</th>
                <th className="py-4">Patient Identity</th>
                <th className="py-4">Diagnostic Test</th>
                <th className="py-4">Ordering Clinician</th>
                <th className="py-4 text-center">Protocol Status</th>
                <th className="px-4 py-4 text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tests.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-0">
                     <EmptyState 
                       icon="bi-thermometer-half"
                       title="No Lab Tests"
                       description="The diagnostic queue is currently empty. Place an order for pathology or radiology tests."
                       actionText="Order New Test"
                       onAction={() => setIsModalOpen(true)}
                     />
                  </td>
                </tr>
              ) : tests.map((test) => (
                <tr key={test.id}>
                  <td className="px-4 py-4 fw-bold gradient-text">{test.id}</td>
                  <td className="py-4 fw-bold text-white">{test.patient}</td>
                  <td className="py-4 text-white opacity-75 small">{test.test}</td>
                  <td className="py-4 text-white-50 small">{test.doctor}</td>
                  <td className="py-4 text-center">
                    <span
                      className={`badge rounded-pill px-4 py-2 border border-opacity-25 ${
                        test.status === 'Completed'
                          ? 'bg-success bg-opacity-10 text-success border-success'
                          : test.status === 'Processing'
                            ? 'bg-primary bg-opacity-10 text-primary border-primary'
                            : 'bg-warning bg-opacity-10 text-warning border-warning'
                      }`}
                      style={{ fontSize: '0.75rem' }}
                    >
                      <span
                        className={`pulsing-dot me-2 bg-${
                          test.status === 'Completed' ? 'success' : test.status === 'Processing' ? 'primary' : 'warning'
                        }`}
                        style={{ width: '6px', height: '6px' }}
                      ></span>
                      {test.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-end">
                    <div className="d-flex justify-content-end gap-2">
                      <button
                        className="btn btn-sm btn-glass text-primary px-3"
                        onClick={() => openEditModal(test)}
                        title="Edit Order"
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button
                        className="btn btn-sm btn-glass text-danger px-3"
                        onClick={() => {
                          setDeletingTest(test);
                          setIsDeleteModalOpen(true);
                        }}
                        title="Cancel/Delete"
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                      <button
                        className="btn btn-sm btn-glass text-white opacity-50 px-3"
                        onClick={() => showToast(`Executing diagnostic processing for Lab ID ${test.id}...`)}
                      >
                        PROCESS
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </Skeleton>
      </div>

      {/* New Test Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Laboratory Test Ordering Protocol">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="lab-patient" className="form-label text-accent fw-bold small text-uppercase mb-2" style={{ letterSpacing: '1px' }}>
              Subject Identity
            </label>
            <select
              id="lab-patient"
              className="form-select"
              value={formData.patient}
              onChange={(e) => setFormData({ ...formData, patient: e.target.value })}
            >
              {loadingPatients ? (
                <option value="">Querying patient database...</option>
              ) : patients.length === 0 ? (
                <option value="">No registered patients found</option>
              ) : (
                <>
                  <option value="">Select a registered patient profile...</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name} ({p.id})
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>
          <div className="mb-4">
            <label htmlFor="lab-test" className="form-label text-accent fw-bold small text-uppercase mb-2" style={{ letterSpacing: '1px' }}>
              Diagnostic Test Classification
            </label>
            <input
              id="lab-test"
              type="text"
              className="form-control"
              placeholder="e.g. Complete Blood Count (CBC) / MRI Brain"
              value={formData.test}
              onChange={(e) => setFormData({ ...formData, test: e.target.value })}
            />
          </div>
          <div className="mb-4">
            <label htmlFor="lab-doctor" className="form-label text-accent fw-bold small text-uppercase mb-2" style={{ letterSpacing: '1px' }}>
              Ordering Physician
            </label>
            <input
              id="lab-doctor"
              type="text"
              className="form-control"
              value={formData.doctor}
              onChange={(e) => setFormData({ ...formData, doctor: e.target.value })}
              list="lab-doctor-options"
              placeholder={loadingStaff ? "Loading clinicians..." : "Enter clinician name"}
            />
            <datalist id="lab-doctor-options">
              {doctorOptions.map((doctor) => (
                <option key={doctor} value={doctor} />
              ))}
            </datalist>
          </div>
          <div className="d-flex gap-3 mt-5">
            <button type="button" className="btn btn-glass w-100 py-3" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary w-100 py-3">
              Finalize Order
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Test Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Diagnostic Order">
        <form onSubmit={handleEditSubmit}>
          <div className="mb-4">
            <label htmlFor="edit-lab-patient" className="form-label text-accent fw-bold small text-uppercase mb-2">Subject Identity</label>
            <select
              id="edit-lab-patient"
              className="form-select"
              value={editFormData.patient}
              onChange={(e) => setEditFormData({ ...editFormData, patient: e.target.value })}
            >
              {patients.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name} ({p.id})
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label htmlFor="edit-lab-test" className="form-label text-accent fw-bold small text-uppercase mb-2">Diagnostic Test</label>
            <input
              id="edit-lab-test"
              type="text"
              className="form-control"
              value={editFormData.test}
              onChange={(e) => setEditFormData({ ...editFormData, test: e.target.value })}
            />
          </div>
          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <label htmlFor="edit-lab-doctor" className="form-label text-accent fw-bold small text-uppercase mb-2">Ordering Physician</label>
              <input
                id="edit-lab-doctor"
                type="text"
                className="form-control"
                value={editFormData.doctor}
                onChange={(e) => setEditFormData({ ...editFormData, doctor: e.target.value })}
                list="edit-lab-doctor-options"
              />
              <datalist id="edit-lab-doctor-options">
                {doctorOptions.map((doctor) => (
                  <option key={doctor} value={doctor} />
                ))}
              </datalist>
            </div>
            <div className="col-md-6">
              <label htmlFor="edit-lab-status" className="form-label text-accent fw-bold small text-uppercase mb-2">Status</label>
              <select
                id="edit-lab-status"
                className="form-select"
                value={editFormData.status}
                onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
              >
                <option>Pending</option>
                <option>Processing</option>
                <option>Completed</option>
              </select>
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
      </Modal>

      {/* Delete Confirmation */}
      <DeleteConfirmation 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        itemName={`Order ${deletingTest?.id} (${deletingTest?.test})`}
        itemType="Diagnostic Order"
      />
    </div>
  );
};

export default Lab;
