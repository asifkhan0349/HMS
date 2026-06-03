import React, { useState } from 'react';
import { useApp, mapStaffFromApi, createCode } from '../context/AppContext';
import { useCrud } from '../hooks/useCrud';
import { staffApi } from '../lib/api';
import Modal from '../components/UI/Modal';
import EmptyState from '../components/UI/EmptyState';
import DeleteConfirmation from '../components/UI/DeleteConfirmation';
import Pagination from '../components/UI/Pagination';
import { Skeleton } from 'boneyard-js/react';
import { usePagination } from '../hooks/usePagination';

const Staff = () => {
  const { showToast, user } = useApp();
  const isDoctor = user?.role === 'Doctor';
  const isNurse = user?.role === 'Nurse';
  const isReception = user?.role === 'Reception';
  const {
    data: staff,
    loading,
    addData: addStaff,
    updateData: updateStaff,
    removeData: deleteStaff
  } = useCrud(staffApi, mapStaffFromApi);

  const staffRoleOptions = [...new Set(staff.map((member) => member.role).filter(Boolean))];
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
  const shiftOptions = [...new Set(staff.map((member) => member.shift).filter(Boolean))];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [deletingStaff, setDeletingStaff] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  const [formData, setFormData] = useState({
    name: '',
    role: '',
    dept: '',
    shift: '',
  });

  const [editFormData, setEditFormData] = useState({
    name: '',
    role: '',
    dept: '',
    shift: '',
    status: 'Active'
  });

  const {
    paginatedData: paginatedStaff,
    currentPage,
    totalPages,
    rowsPerPage,
    totalItems,
    onPageChange,
    onRowsPerPageChange
  } = usePagination(staff);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!formData.name.trim()) errors.name = true;
    if (!formData.role.trim()) errors.role = true;
    if (!formData.dept.trim()) errors.dept = true;

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      showToast('Please fill in all mandatory fields highlighted in red.', 'warning');
      return;
    }
    setValidationErrors({});
    try {
      const payload = {
        name: formData.name,
        role: formData.role,
        department: formData.dept,
        shift: formData.shift,
        staff_code: createCode('S', 4),
        status: 'Active'
      };
      await addStaff(payload);
      showToast(`Personnel Onboarding: ${formData.name} joined the ${formData.dept} department.`);
      setIsModalOpen(false);
      setFormData({
        name: '',
        role: '',
        dept: '',
        shift: '',
      });
    } catch (error) {
      showToast(error.message || 'Unable to add the staff member.', 'error');
    }
  };

  const openEditModal = (s) => {
    setEditingStaff(s);
    setEditFormData({
      name: s.name,
      role: s.role,
      dept: s.dept,
      shift: s.shift,
      status: s.status
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!editFormData.name.trim()) errors.name = true;
    if (!editFormData.role.trim()) errors.role = true;
    if (!editFormData.dept.trim()) errors.dept = true;
    if (!editFormData.shift.trim()) errors.shift = true;
    if (!editFormData.status) errors.status = true;

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      showToast('Please fill in all mandatory fields highlighted in red.', 'warning');
      return;
    }
    setValidationErrors({});
    try {
      const payload = {
        name: editFormData.name,
        role: editFormData.role,
        department: editFormData.dept,
        shift: editFormData.shift,
        status: editFormData.status
      };
      await updateStaff(editingStaff.apiId, payload);
      showToast(`${editFormData.name}'s profile updated successfully.`);
      setIsEditModalOpen(false);
      setEditingStaff(null);
    } catch (error) {
      showToast(error.message || 'Unable to update staff profile.', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteStaff(deletingStaff.apiId);
      showToast(`Staff record for ${deletingStaff.name} removed from registry.`);
      setIsDeleteModalOpen(false);
      setDeletingStaff(null);
    } catch (error) {
      showToast(error.message || 'Unable to delete staff record.', 'error');
    }
  };

  return (
    <div className="staff-page">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-0">Human Resources & Staffing</h2>
          <p className="text-muted mb-0">Monitor clinical personnel deployment and shifts.</p>
        </div>
        <button className="btn btn-primary px-4 py-2 rounded-3 " onClick={() => setIsModalOpen(true)}>
          <i className="bi bi-person-plus-fill me-2"></i>Add Staff Member
        </button>
      </div>

      <div className="glass-card p-0 overflow-hidden  border-0">
        <div className="p-4 border-bottom d-flex justify-content-between align-items-center">
          <h5 className="fw-bold mb-0">Active Personnel Directory</h5>
          <div className="btn-group">
            <button className="btn btn-sm btn-outline-primary active">Departments {departmentOptions.length}</button>
            <button className="btn btn-sm btn-outline-secondary">On Duty {staff.filter((member) => member.status === 'Active').length}</button>
          </div>
        </div>
        <Skeleton name="staff-table" loading={loading}>
          <div className="table-responsive">
            <table className="table table-hover mb-0 align-middle">
              <thead>
                <tr>
                  <th className="px-4 py-4">Staff ID</th>
                  <th className="py-4">Staff Member</th>
                  <th className="py-4">Role Classification</th>
                  <th className="py-4">Clinical Department</th>
                  <th className="py-4 text-center">Active Shift</th>
                  <th className="py-4 text-center">Duty Status</th>
                  {!(isDoctor || isNurse || isReception) && <th className="px-4 py-4 text-end">Electronic Validation</th>}
                </tr>
              </thead>
              <tbody>
                {staff.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-0">
                      <EmptyState
                        icon="bi-person-badge"
                        title="No Staff Onboarded"
                        description="The personnel directory is empty. Add healthcare professionals to manage departments and shifts."
                        actionText="Add Staff Member"
                        onAction={() => setIsModalOpen(true)}
                      />
                    </td>
                  </tr>
                ) : paginatedStaff.map((s) => (
                  <tr key={s.id}>
                    <td className="px-4 py-4">
                      <span className="badge bg-light text-primary border border-primary border-opacity-25 fw-bold px-2 py-1" style={{ fontSize: '0.7rem', fontFamily: 'monospace' }}>
                        {s.id}
                      </span>
                    </td>
                    <td className="py-4">
                      <div className="d-flex align-items-center">
                        <div
                          className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center me-3"
                          style={{ width: '40px', height: '40px' }}
                        >
                          <i className="bi bi-person-workspace"></i>
                        </div>
                        <h6 className="mb-0 fw-bold text-black">{s.name}</h6>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className="badge-soft-primary px-3 py-1 rounded-pill">{s.role}</span>
                    </td>
                    <td className="py-4 text-muted small">{s.dept}</td>
                    <td className="py-4 text-center text-muted">{s.shift}</td>
                    <td className="py-4 text-center">
                      <span
                        className={`badge rounded-pill px-4 py-2 border border-opacity-25 ${s.status === 'Active'
                            ? 'bg-success bg-opacity-10 text-success border-success'
                            : s.status === 'On Leave'
                              ? 'bg-warning bg-opacity-10 text-warning border-warning'
                              : 'bg-danger bg-opacity-10 text-danger border-danger'
                          }`}
                        style={{ fontSize: '0.75rem' }}
                      >
                        <span
                          className={`pulsing-dot me-2 ${s.status === 'Active'
                              ? 'bg-success'
                              : s.status === 'On Leave'
                                ? 'bg-warning'
                                : 'bg-danger'
                            }`}
                          style={{ width: '6px', height: '6px' }}
                        ></span>

                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-end">
                      {!(isDoctor || isNurse || isReception) && (
                        <>
                          <button className="btn btn-sm btn-glass me-1" onClick={() => openEditModal(s)}>
                            <i className="bi bi-pencil-square"></i>
                          </button>
                          <button className="btn btn-sm btn-glass text-danger" onClick={() => {
                            setDeletingStaff(s);
                            setIsDeleteModalOpen(true);
                          }}>
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
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={onRowsPerPageChange}
          totalItems={totalItems}
        />
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Personnel Onboarding Protocol">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="staff-name" className="form-label text-accent fw-bold small text-uppercase mb-2 required-label" style={{ letterSpacing: '1px' }}>
              Full Legal Name
            </label>
            <input
              id="staff-name"
              type="text"
              className={`form-control ${validationErrors.name ? 'is-invalid' : ''}`}
              placeholder="Enter staff member name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <label htmlFor="staff-role" className="form-label text-accent fw-bold small text-uppercase mb-2 required-label" style={{ letterSpacing: '1px' }}>
                Role Classification
              </label>
              <input
                id="staff-role"
                type="text"
                className={`form-control ${validationErrors.role ? 'is-invalid' : ''}`}
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                list="staff-role-options"
                placeholder="Enter role"
              />
              <datalist id="staff-role-options">
                {staffRoleOptions.map((role) => (
                  <option key={role} value={role} />
                ))}
              </datalist>
            </div>
            <div className="col-md-6">
              <label htmlFor="staff-department" className="form-label text-accent fw-bold small text-uppercase mb-2 required-label" style={{ letterSpacing: '1px' }}>
                Clinical Department
              </label>
              <select
                id="staff-department"
                className={`form-select ${validationErrors.dept ? 'is-invalid' : ''}`}
                value={formData.dept}
                onChange={(e) => setFormData({ ...formData, dept: e.target.value })}
              >
                <option value="">Select department</option>
                {departmentOptions.map((department) => (
                  <option key={department} value={department}>{department}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mb-4">
            <label htmlFor="staff-shift" className="form-label text-accent fw-bold small text-uppercase mb-2 required-label" style={{ letterSpacing: '1px' }}>
              Assigned Shift
            </label>
            <input
              id="staff-shift"
              type="text"
              className="form-control"
              value={formData.shift}
              onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
              list="shift-options"
              placeholder="Enter shift"
            />
            <datalist id="shift-options">
              {shiftOptions.map((shift) => (
                <option key={shift} value={shift} />
              ))}
            </datalist>
          </div>
          <div className="d-flex gap-3 mt-5">
            <button type="button" className="btn btn-glass w-100 py-3" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary w-100 py-3">
              Finalize Onboarding
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Staff Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Update Staff Information">
        {editingStaff && (
          <form onSubmit={handleEditSubmit}>
              <div className="row g-3 mb-4">
                <div className="col-md-8">
                  <label htmlFor="edit-staff-name" className="form-label text-accent fw-bold small text-uppercase mb-2 required-label" style={{ letterSpacing: '1px' }}>
                    Full Legal Name
                  </label>
                  <input
                    id="edit-staff-name"
                    type="text"
                    className={`form-control ${validationErrors.name ? 'is-invalid' : ''}`}
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label text-muted fw-bold small text-uppercase mb-2" style={{ letterSpacing: '1px' }}>
                    Staff ID
                  </label>
                  <div className="form-control bg-light border-0 text-muted fw-bold">
                    {editingStaff.id}
                  </div>
                </div>
              </div>
            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <label htmlFor="edit-staff-role" className="form-label text-accent fw-bold small text-uppercase mb-2 required-label" style={{ letterSpacing: '1px' }}>
                  Role Classification
                </label>
                <input
                  id="edit-staff-role"
                  type="text"
                  className={`form-control ${validationErrors.role ? 'is-invalid' : ''}`}
                  value={editFormData.role}
                  onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                  list="staff-role-options"
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="edit-staff-department" className="form-label text-accent fw-bold small text-uppercase mb-2 required-label" style={{ letterSpacing: '1px' }}>
                  Clinical Department
                </label>
                <input
                  id="edit-staff-department"
                  type="text"
                  className={`form-control ${validationErrors.dept ? 'is-invalid' : ''}`}
                  value={editFormData.dept}
                  onChange={(e) => setEditFormData({ ...editFormData, dept: e.target.value })}
                  list="department-options"
                />
              </div>
            </div>
            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <label htmlFor="edit-staff-shift" className="form-label text-accent fw-bold small text-uppercase mb-2 required-label" style={{ letterSpacing: '1px' }}>
                  Assigned Shift
                </label>
                <input
                  id="edit-staff-shift"
                  type="text"
                  className="form-control"
                  value={editFormData.shift}
                  onChange={(e) => setEditFormData({ ...editFormData, shift: e.target.value })}
                  list="shift-options"
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="edit-staff-status" className="form-label text-muted fw-bold small text-uppercase mb-2 required-label">Duty Status</label>
                <select
                  id="edit-staff-status"
                  className="form-select"
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                >
                  <option>Active</option>
                  <option>On Leave</option>
                  <option>Inactive</option>
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
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmation
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        itemName={deletingStaff?.name}
        itemType="Staff Member"
      />
    </div>
  );
};

export default Staff;
