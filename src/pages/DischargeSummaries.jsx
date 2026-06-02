import React, { useMemo, useState } from 'react';
import { useApp, mapDischargeFromApi, mapPatientFromApi, mapStaffFromApi } from '../context/AppContext';
import { useCrud } from '../hooks/useCrud';
import { dischargeSummariesApi, patientsApi, staffApi } from '../lib/api';
import Modal from '../components/UI/Modal';
import EmptyState from '../components/UI/EmptyState';
import DeleteConfirmation from '../components/UI/DeleteConfirmation';
import Pagination from '../components/UI/Pagination';
import { Skeleton } from 'boneyard-js/react';
import { usePagination } from '../hooks/usePagination';

const DischargeSummaries = () => {
  const createDraftSummary = () => ({
    patient_name: '',
    admission_date: '',
    discharge_date: '',
    attending_doctor: '',
    diagnosis: '',
    hospital_course: '',
    discharge_medications: '',
    discharge_condition: 'Stable',
    follow_up_instructions: '',
  });

  const { showToast, user } = useApp();
  const isAdmin = user?.role === 'Admin';
  const isDoctor = user?.role === 'Doctor';
  const isNurse = user?.role === 'Nurse';
  const isPatient = user?.role?.toLowerCase() === 'patient';
  const canCreate = isDoctor || isNurse || isAdmin;
  const canEditDelete = isAdmin;
  const canReadStaff = true;

  const {
    data: summaries,
    loading,
    addData: addSummary,
    updateData: updateSummary,
    removeData: deleteSummary
  } = useCrud(dischargeSummariesApi, mapDischargeFromApi);

  const {
    data: patients
  } = useCrud(patientsApi, mapPatientFromApi);

  const { data: staff } = useCrud(staffApi, mapStaffFromApi, { enabled: canReadStaff });
  
  const doctorOptions = useMemo(() => {
    return [
      ...new Set([
        ...staff.filter((s) => s.role === 'Doctor').map((s) => s.name),
        ...(user?.role === 'Doctor' ? [user.name] : []),
      ].filter(Boolean)),
    ];
  }, [staff, user]);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const filteredSummaries = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return summaries;
    return summaries.filter((s) =>
      s.patient.toLowerCase().includes(term) ||
      s.dischargeCode.toLowerCase().includes(term) ||
      (s.doctor && s.doctor.toLowerCase().includes(term))
    );
  }, [summaries, searchTerm]);

  const {
    paginatedData: paginatedSummaries,
    totalPages,
    totalItems,
    onPageChange,
    onRowsPerPageChange
  } = usePagination(filteredSummaries);

  // Telemetry Metrics Calculation
  const metrics = useMemo(() => {
    const total = summaries.length;
    const stableCount = summaries.filter(s => s.dischargeCondition === 'Stable' || s.dischargeCondition === 'Recovered').length;
    const recoveredRate = total > 0 ? Math.round((stableCount / total) * 100) : 0;
    
    // Calculate average stay length
    let totalStayDays = 0;
    let stayCount = 0;
    summaries.forEach(s => {
      if (s.rawAdmissionDate && s.rawDischargeDate) {
        const adDate = new Date(s.rawAdmissionDate);
        const disDate = new Date(s.rawDischargeDate);
        const diffTime = Math.abs(disDate - adDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (!isNaN(diffDays)) {
          totalStayDays += diffDays;
          stayCount++;
        }
      }
    });
    const avgStay = stayCount > 0 ? Math.round((totalStayDays / stayCount) * 10) / 10 : 0;

    // Simulate reviews pending signature or clearances
    const pendingReview = summaries.filter(s => !s.doctor).length;

    return {
      total,
      recoveredRate,
      avgStay: avgStay || 'N/A',
      pendingReview
    };
  }, [summaries]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const [editingSummary, setEditingSummary] = useState(null);
  const [deletingSummary, setDeletingSummary] = useState(null);
  const [viewingSummary, setViewingSummary] = useState(null);

  const [formData, setFormData] = useState(createDraftSummary);
  const [editFormData, setEditFormData] = useState({});
  const [validationErrors, setValidationErrors] = useState({});
  const [creationStep, setCreationStep] = useState(1);
  const [isPatientSuggestionsVisible, setPatientSuggestionsVisible] = useState(false);

  const filteredPatients = useMemo(() => {
    const query = formData.patient_name.trim().toLowerCase();
    if (!query) return patients.slice(0, 8);
    return patients.filter((p) =>
      p.name.toLowerCase().includes(query) ||
      p.id.toString().toLowerCase().includes(query)
    ).slice(0, 8);
  }, [patients, formData.patient_name]);

  const handlePatientSelect = (patient) => {
    setFormData({
      ...formData,
      patient_name: patient.name,
      attending_doctor: patient.doctorName || formData.attending_doctor,
      admission_date: patient.rawLastVisit || formData.admission_date,
    });
    setPatientSuggestionsVisible(false);
  };

  const handleNextStep = () => {
    const errors = {};
    if (creationStep === 1) {
      if (!formData.patient_name.trim()) errors.patient_name = true;
      if (!formData.admission_date) errors.admission_date = true;
      if (!formData.discharge_date) errors.discharge_date = true;
    } else if (creationStep === 2) {
      if (!formData.diagnosis.trim()) errors.diagnosis = true;
      if (!formData.hospital_course.trim()) errors.hospital_course = true;
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      showToast('Please fill in all mandatory fields.', 'warning');
      return;
    }
    setValidationErrors({});
    setCreationStep((prev) => prev + 1);
  };

  const handlePrevStep = () => {
    setCreationStep((prev) => prev - 1);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!formData.attending_doctor.trim()) errors.attending_doctor = true;
    if (!formData.discharge_medications.trim()) errors.discharge_medications = true;

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      showToast('Please fill in all mandatory fields.', 'warning');
      return;
    }
    setValidationErrors({});

    try {
      await addSummary(formData);
      showToast('Discharge Summary created successfully.');
      setIsModalOpen(false);
      setFormData(createDraftSummary());
      setCreationStep(1);
    } catch (err) {
      showToast(err.message || 'Failed to create Discharge Summary.', 'error');
    }
  };

  const openViewModal = (summary) => {
    setViewingSummary(summary);
    setIsViewModalOpen(true);
  };

  const openEditModal = (summary) => {
    setEditingSummary(summary);
    setEditFormData({
      patient_name: summary.patient,
      admission_date: summary.rawAdmissionDate || '',
      discharge_date: summary.rawDischargeDate || '',
      attending_doctor: summary.doctor || '',
      diagnosis: summary.diagnosis || '',
      hospital_course: summary.hospitalCourse || '',
      discharge_medications: summary.dischargeMedications || '',
      discharge_condition: summary.dischargeCondition || 'Stable',
      follow_up_instructions: summary.followUpInstructions || '',
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!editFormData.patient_name.trim()) errors.patient_name = true;
    if (!editFormData.admission_date) errors.admission_date = true;
    if (!editFormData.discharge_date) errors.discharge_date = true;
    if (!editFormData.diagnosis.trim()) errors.diagnosis = true;
    if (!editFormData.hospital_course.trim()) errors.hospital_course = true;
    if (!editFormData.attending_doctor.trim()) errors.attending_doctor = true;
    if (!editFormData.discharge_medications.trim()) errors.discharge_medications = true;

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      showToast('Please fill in all mandatory fields.', 'warning');
      return;
    }
    setValidationErrors({});

    try {
      await updateSummary(editingSummary.apiId, editFormData);
      showToast('Discharge Summary updated successfully.');
      setIsEditModalOpen(false);
      setEditingSummary(null);
    } catch (err) {
      showToast(err.message || 'Failed to update Discharge Summary.', 'error');
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteSummary(deletingSummary.apiId);
      showToast('Discharge Summary removed from repository.');
      setIsDeleteModalOpen(false);
      setDeletingSummary(null);
    } catch (err) {
      showToast(err.message || 'Failed to delete Discharge Summary.', 'error');
    }
  };

  const handleExportPDF = async (summary) => {
    try {
      const { jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      const doc = new jsPDF();

      // Premium styling colors
      const docHeaderColor = [160, 0, 0]; // Maroon theme matching HMS
      const docTextColor = [40, 40, 40];

      // Header Letterhead
      doc.setFontSize(22);
      doc.setTextColor(docHeaderColor[0], docHeaderColor[1], docHeaderColor[2]);
      doc.text('HMS ELITE HOSPITAL', 14, 20);

      doc.setFontSize(10);
      doc.setTextColor(120);
      doc.text('Healthcare Excellence Premium Services | 123 Health Ave, Suite 100', 14, 26);
      doc.text('Phone: +91 98765 43210 | Web: www.hms-elite.com', 14, 31);
      
      doc.setDrawColor(docHeaderColor[0], docHeaderColor[1], docHeaderColor[2]);
      doc.setLineWidth(1.5);
      doc.line(14, 35, 196, 35);

      // Report Title
      doc.setFontSize(16);
      doc.setTextColor(50);
      doc.text('PATIENT DISCHARGE SUMMARY', 14, 45);

      // Metadata Table
      autoTable(doc, {
        startY: 50,
        head: [['Patient Details', 'Stay Info']],
        body: [
          [
            `Name: ${summary.patient}\nDischarge ID: ${summary.dischargeCode}`,
            `Attending Doctor: ${summary.doctor}\nAdmission Date: ${summary.admissionDate}\nDischarge Date: ${summary.dischargeDate}`
          ]
        ],
        theme: 'plain',
        styles: { fontSize: 10, cellPadding: 3 },
        columnStyles: { 0: { cellWidth: 90 }, 1: { cellWidth: 90 } },
        lineColor: [220, 220, 220],
        lineWidth: 0.5,
      });

      const startYContent = doc.lastAutoTable.finalY + 10;

      // Primary Sections
      doc.setFontSize(12);
      doc.setTextColor(docHeaderColor[0], docHeaderColor[1], docHeaderColor[2]);
      doc.text('Clinical Diagnosis', 14, startYContent);
      doc.setFontSize(10);
      doc.setTextColor(docTextColor[0]);
      doc.text(summary.diagnosis, 14, startYContent + 6);

      doc.setFontSize(12);
      doc.setTextColor(docHeaderColor[0], docHeaderColor[1], docHeaderColor[2]);
      doc.text('Hospital Course & Interventions', 14, startYContent + 20);
      doc.setFontSize(10);
      doc.setTextColor(docTextColor[0]);
      const courseLines = doc.splitTextToSize(summary.hospitalCourse, 182);
      doc.text(courseLines, 14, startYContent + 26);

      const postCourseY = startYContent + 26 + (courseLines.length * 5) + 5;

      doc.setFontSize(12);
      doc.setTextColor(docHeaderColor[0], docHeaderColor[1], docHeaderColor[2]);
      doc.text('Discharge Medications Plan', 14, postCourseY);
      doc.setFontSize(10);
      doc.setTextColor(docTextColor[0]);
      const medLines = doc.splitTextToSize(summary.dischargeMedications, 182);
      doc.text(medLines, 14, postCourseY + 6);

      const postMedY = postCourseY + 6 + (medLines.length * 5) + 5;

      doc.setFontSize(12);
      doc.setTextColor(docHeaderColor[0], docHeaderColor[1], docHeaderColor[2]);
      doc.text('Discharge Condition & Follow-up Instructions', 14, postMedY);
      doc.setFontSize(10);
      doc.setTextColor(docTextColor[0]);
      doc.text(`Condition at Discharge: ${summary.dischargeCondition}`, 14, postMedY + 6);
      
      const followUpLines = doc.splitTextToSize(summary.followUpInstructions || 'No specific follow-up instructions provided.', 182);
      doc.text(followUpLines, 14, postMedY + 12);

      const postFollowY = postMedY + 12 + (followUpLines.length * 5) + 15;

      // Sign-off
      doc.setDrawColor(200);
      doc.setLineWidth(0.5);
      doc.line(14, postFollowY, 70, postFollowY);
      doc.line(136, postFollowY, 192, postFollowY);

      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text('Patient Signature', 14, postFollowY + 5);
      doc.text('Attending Clinician Signature', 136, postFollowY + 5);
      doc.text(`Dr. ${summary.doctor}`, 136, postFollowY + 10);

      // Save document
      doc.save(`DischargeSummary_${summary.dischargeCode}.pdf`);
      showToast('✓ Discharge Summary PDF downloaded!');
    } catch (err) {
      console.error(err);
      showToast('Failed to export PDF summary.', 'error');
    }
  };

  return (
    <div className="discharge-summaries-page">
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-5">
        <div>
          <h2 className="fw-bold mb-1">Discharge Registry</h2>
          <p className="text-muted mb-0">Monitor inpatient release protocols, medical summaries, and care transitions.</p>
        </div>
        {canCreate && (
          <button 
            className="btn btn-primary px-4 py-2.5 rounded-3 shadow-sm d-flex align-items-center gap-2 hover-scale-sm" 
            onClick={() => setIsModalOpen(true)}
          >
            <i className="bi bi-file-earmark-plus fs-5"></i>
            <span>New Summary Protocol</span>
          </button>
        )}
      </div>

      {/* Telemetry Metrics cards */}
      <div className="row g-4 mb-5">
        <div className="col-md-3">
          <div className="glass-card p-4 transition-all hover-translate-y h-100 border border-white border-opacity-10 shadow-lg position-relative overflow-hidden">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <span className="text-muted small fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>Total Releases</span>
              <div className="rounded bg-primary bg-opacity-10 p-2 text-primary">
                <i className="bi bi-file-earmark-check fs-4"></i>
              </div>
            </div>
            <h2 className="fw-bold mb-1" style={{ fontVariantNumeric: 'tabular-nums' }}>{metrics.total}</h2>
            <p className="small text-muted mb-0">Total logged discharge reports</p>
          </div>
        </div>

        <div className="col-md-3">
          <div className="glass-card p-4 transition-all hover-translate-y h-100 border border-white border-opacity-10 shadow-lg position-relative overflow-hidden">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <span className="text-muted small fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>Recovered Rate</span>
              <div className="rounded bg-success bg-opacity-10 p-2 text-success">
                <i className="bi bi-heart-pulse fs-4"></i>
              </div>
            </div>
            <h2 className="fw-bold mb-1" style={{ fontVariantNumeric: 'tabular-nums' }}>{metrics.recoveredRate}%</h2>
            <p className="small text-muted mb-0">Stable or fully recovered outcomes</p>
          </div>
        </div>

        <div className="col-md-3">
          <div className="glass-card p-4 transition-all hover-translate-y h-100 border border-white border-opacity-10 shadow-lg position-relative overflow-hidden">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <span className="text-muted small fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>Avg Stay Length</span>
              <div className="rounded bg-info bg-opacity-10 p-2 text-info">
                <i className="bi bi-calendar-range fs-4"></i>
              </div>
            </div>
            <h2 className="fw-bold mb-1" style={{ fontVariantNumeric: 'tabular-nums' }}>{metrics.avgStay} Days</h2>
            <p className="small text-muted mb-0">Average stay of inpatient cases</p>
          </div>
        </div>

        <div className="col-md-3">
          <div className="glass-card p-4 transition-all hover-translate-y h-100 border border-white border-opacity-10 shadow-lg position-relative overflow-hidden">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <span className="text-muted small fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>Awaiting Sign-off</span>
              <div className="rounded bg-warning bg-opacity-10 p-2 text-warning">
                <i className="bi bi-shield-exclamation fs-4"></i>
              </div>
            </div>
            <h2 className="fw-bold mb-1" style={{ fontVariantNumeric: 'tabular-nums' }}>{metrics.pendingReview}</h2>
            <p className="small text-muted mb-0">Summaries with missing signature details</p>
          </div>
        </div>
      </div>

      {/* Control panel & filters */}
      <div className="glass-card mb-4 p-4 border border-white border-opacity-10 shadow-md">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div className="search-box position-relative" style={{ maxWidth: '400px', flexGrow: 1 }}>
            <i className="bi bi-search position-absolute text-muted" style={{ left: '16px', top: '12px' }}></i>
            <input
              type="text"
              className="form-control ps-5 py-2.5 rounded-3"
              placeholder="Search by patient name, discharge code, or doctor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="d-flex align-items-center gap-3 text-muted small">
            <span>Filtered: <strong className="fw-bold">{filteredSummaries.length}</strong> summaries</span>
          </div>
        </div>
      </div>

      {/* Modern Card Grid Listing */}
      <Skeleton name="discharge-summaries-list" loading={loading}>
        {paginatedSummaries.length === 0 ? (
          <div className="glass-card p-5 border border-white border-opacity-10 text-center shadow-lg">
            <EmptyState
              icon="bi-file-earmark-check"
              title="No Summaries Found"
              description="No discharge protocols match the filter criteria or none have been logged."
              actionText={canCreate ? "New Summary Protocol" : undefined}
              onAction={canCreate ? () => setIsModalOpen(true) : undefined}
            />
          </div>
        ) : (
          <div className="row g-4">
            {paginatedSummaries.map((summary) => (
              <div key={summary.id} className="col-12 col-md-6 col-xl-4">
                <div className="glass-card p-4 transition-all hover-translate-y border border-white border-opacity-10 shadow-lg d-flex flex-column h-100 position-relative">
                  <div className="d-flex justify-content-between align-items-start mb-4">
                    <div>
                      <span className="badge bg-white bg-opacity-10 text-accent font-monospace small px-2 py-1 rounded mb-2 d-inline-block">
                        {summary.dischargeCode}
                      </span>
                      <h4 className="fw-bold mb-0 text-truncate" style={{ maxWidth: '180px' }}>
                        {summary.patient}
                      </h4>
                      <small className="text-muted">Physician: Dr. {summary.doctor || 'Unassigned'}</small>
                    </div>
                    <span className={`badge bg-${summary.dischargeCondition === 'Stable' ? 'success' : 
                                       summary.dischargeCondition === 'Recovered' ? 'success' : 
                                       summary.dischargeCondition === 'Improved' ? 'info' : 'warning'} text-white rounded-pill px-3 py-1`}>
                      {summary.dischargeCondition}
                    </span>
                  </div>

                  <div className="mb-4 bg-white bg-opacity-5 p-3 rounded-3 border border-white border-opacity-5 flex-grow-1">
                    <span className="small text-muted d-block mb-1">Primary Diagnosis</span>
                    <p className="small text-muted mb-0 text-truncate-2">
                      {summary.diagnosis || 'No diagnosis logged.'}
                    </p>
                  </div>

                  <div className="d-flex align-items-center justify-content-between pt-3 border-top border-white border-opacity-10 mt-auto">
                    <div className="small text-muted">
                      <i className="bi bi-calendar-check me-2"></i>
                      <span>{summary.dischargeDate}</span>
                    </div>
                    
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-sm btn-glass text-accent"
                        onClick={() => handleExportPDF(summary)}
                        title="Download official PDF report"
                      >
                        <i className="bi bi-file-earmark-pdf fs-6"></i>
                      </button>
                      <button
                        className="btn btn-sm btn-glass"
                        onClick={() => openViewModal(summary)}
                        title="Inspect clinical dossier"
                      >
                        <i className="bi bi-eye fs-6"></i>
                      </button>
                      {canEditDelete && (
                        <>
                          <button
                            className="btn btn-sm btn-glass text-warning"
                            onClick={() => openEditModal(summary)}
                            title="Edit summary draft"
                          >
                            <i className="bi bi-pencil fs-6"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-glass text-danger"
                            onClick={() => {
                              setDeletingSummary(summary);
                              setIsDeleteModalOpen(true);
                            }}
                            title="Delete summary"
                          >
                            <i className="bi bi-trash fs-6"></i>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Skeleton>

      {/* Pagination controls */}
      {filteredSummaries.length > 0 && (
        <div className="mt-5">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={onRowsPerPageChange}
            totalItems={totalItems}
          />
        </div>
      )}

      {/* Creation Modal Wizard with Stepper */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setCreationStep(1); setValidationErrors({}); }} 
        title="Inpatient Discharge Stepper Wizard"
      >
        {/* Stepper indicator bar */}
        <div className="mb-5 bg-white bg-opacity-5 p-3 rounded-4 border">
          <div className="d-flex align-items-center justify-content-between position-relative px-4">
            <div className="d-flex flex-column align-items-center position-relative" style={{ zIndex: 2 }}>
              <div 
                className={`rounded-circle d-flex align-items-center justify-content-center fw-bold transition-all ${
                  creationStep >= 1 ? 'bg-primary text-white scale-up shadow-glow-primary' : 'bg-white bg-opacity-10 text-muted'
                }`}
                style={{ width: '40px', height: '40px' }}
              >
                <i className="bi bi-person-badge"></i>
              </div>
              <span className="small mt-2 fw-medium text-muted" style={{ fontSize: '0.7rem' }}>Demographics</span>
            </div>

            <div className="flex-grow-1 mx-2" style={{ height: '2px', background: creationStep >= 2 ? 'var(--geist-success)' : 'rgba(255, 255, 255, 0.1)' }}></div>

            <div className="d-flex flex-column align-items-center position-relative" style={{ zIndex: 2 }}>
              <div 
                className={`rounded-circle d-flex align-items-center justify-content-center fw-bold transition-all ${
                  creationStep >= 2 ? 'bg-primary text-white scale-up shadow-glow-primary' : 'bg-white bg-opacity-10 text-muted'
                }`}
                style={{ width: '40px', height: '40px' }}
              >
                <i className="bi bi-file-earmark-medical"></i>
              </div>
              <span className="small mt-2 fw-medium text-muted" style={{ fontSize: '0.7rem' }}>Clinical Log</span>
            </div>

            <div className="flex-grow-1 mx-2" style={{ height: '2px', background: creationStep >= 3 ? 'var(--geist-success)' : 'rgba(255, 255, 255, 0.1)' }}></div>

            <div className="d-flex flex-column align-items-center position-relative" style={{ zIndex: 2 }}>
              <div 
                className={`rounded-circle d-flex align-items-center justify-content-center fw-bold transition-all ${
                  creationStep >= 3 ? 'bg-primary text-white scale-up shadow-glow-primary' : 'bg-white bg-opacity-10 text-muted'
                }`}
                style={{ width: '40px', height: '40px' }}
              >
                <i className="bi bi-capsule"></i>
              </div>
              <span className="small mt-2 fw-medium text-muted" style={{ fontSize: '0.7rem' }}>Care Plan</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleCreateSubmit}>
          {creationStep === 1 && (
            <div>
              <div className="mb-4 position-relative">
                <label className="form-label text-accent fw-bold small text-uppercase mb-2 required-label" style={{ letterSpacing: '0.5px' }}>
                  Select Admitted Patient
                </label>
                <input
                  type="text"
                  autoComplete="off"
                  className={`form-control ${validationErrors.patient_name ? 'is-invalid' : ''}`}
                  placeholder="Type to search active patient directory..."
                  value={formData.patient_name}
                  onChange={(e) => {
                    setPatientSuggestionsVisible(true);
                    setFormData({ ...formData, patient_name: e.target.value });
                  }}
                  onFocus={() => setPatientSuggestionsVisible(true)}
                  onBlur={() => setTimeout(() => setPatientSuggestionsVisible(false), 150)}
                />
                {isPatientSuggestionsVisible && filteredPatients.length > 0 && (
                  <div className="list-group position-absolute w-100 shadow-lg" style={{ zIndex: 1050, maxHeight: '200px', overflowY: 'auto' }}>
                    {filteredPatients.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className="list-group-item list-group-item-action text-start"
                        onMouseDown={() => handlePatientSelect(p)}
                      >
                        <div className="fw-bold">{p.name}</div>
                        <small className="text-muted">Status: {p.status} | Bed: {p.id} | Adm. Doc: {p.doctorName || 'None'}</small>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <label className="form-label text-accent fw-bold small text-uppercase mb-2 required-label" style={{ letterSpacing: '0.5px' }}>Admission Date</label>
                  <input
                    type="date"
                    className={`form-control ${validationErrors.admission_date ? 'is-invalid' : ''}`}
                    value={formData.admission_date}
                    onChange={(e) => setFormData({ ...formData, admission_date: e.target.value })}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label text-accent fw-bold small text-uppercase mb-2 required-label" style={{ letterSpacing: '0.5px' }}>Discharge Date</label>
                  <input
                    type="date"
                    className={`form-control ${validationErrors.discharge_date ? 'is-invalid' : ''}`}
                    value={formData.discharge_date}
                    onChange={(e) => setFormData({ ...formData, discharge_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="d-flex justify-content-end mt-5 pt-3 border-top border-white border-opacity-10">
                <button type="button" className="btn btn-primary px-5 py-3 rounded-3 shadow-md hover-scale-sm" onClick={handleNextStep}>
                  Next: Clinical Info <i className="bi bi-arrow-right ms-2"></i>
                </button>
              </div>
            </div>
          )}

          {creationStep === 2 && (
            <div>
              <div className="mb-4">
                <label className="form-label text-accent fw-bold small text-uppercase mb-2 required-label" style={{ letterSpacing: '0.5px' }}>Primary Diagnosis</label>
                <input
                  type="text"
                  className={`form-control ${validationErrors.diagnosis ? 'is-invalid' : ''}`}
                  placeholder="e.g. Acute Respiratory Distress Syndrome"
                  value={formData.diagnosis}
                  onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                />
              </div>

              <div className="mb-4">
                <label className="form-label text-accent fw-bold small text-uppercase mb-2 required-label" style={{ letterSpacing: '0.5px' }}>Hospital Course Summary</label>
                <textarea
                  className={`form-control ${validationErrors.hospital_course ? 'is-invalid' : ''}`}
                  rows="6"
                  placeholder="Details of surgical procedures, supportive therapy, laboratory trends, and recovery progress..."
                  value={formData.hospital_course}
                  onChange={(e) => setFormData({ ...formData, hospital_course: e.target.value })}
                ></textarea>
              </div>

              <div className="d-flex justify-content-between mt-5 pt-3 border-top border-white border-opacity-10">
                <button type="button" className="btn btn-glass px-4 py-3 rounded-3" onClick={handlePrevStep}>
                  <i className="bi bi-arrow-left me-2"></i> Previous
                </button>
                <button type="button" className="btn btn-primary px-5 py-3 rounded-3 hover-scale-sm" onClick={handleNextStep}>
                  Next: Care Plan <i className="bi bi-arrow-right ms-2"></i>
                </button>
              </div>
            </div>
          )}

          {creationStep === 3 && (
            <div>
              <div className="mb-4 bg-white bg-opacity-5 p-3 rounded-4 border">
                <label className="form-label text-accent fw-bold small text-uppercase mb-2 required-label" style={{ letterSpacing: '0.5px' }}>Discharge Medications Plan</label>
                <textarea
                  className={`form-control ${validationErrors.discharge_medications ? 'is-invalid' : ''}`}
                  rows="4"
                  placeholder="Format: [Drug name] - [Dosage] - [Frequency] (e.g. Amoxicillin 500mg - 1 Tab - Thrice Daily for 5 Days)"
                  value={formData.discharge_medications}
                  onChange={(e) => setFormData({ ...formData, discharge_medications: e.target.value })}
                ></textarea>
              </div>

              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <label className="form-label text-accent fw-bold small text-uppercase mb-2 required-label" style={{ letterSpacing: '0.5px' }}>Attending Clinician</label>
                  <input
                    type="text"
                    className={`form-control ${validationErrors.attending_doctor ? 'is-invalid' : ''}`}
                    value={formData.attending_doctor}
                    onChange={(e) => setFormData({ ...formData, attending_doctor: e.target.value })}
                    list="wizard-doctor-options"
                    placeholder="Search or enter clinician..."
                  />
                  <datalist id="wizard-doctor-options">
                    {doctorOptions.map((doc) => (
                      <option key={doc} value={doc} />
                    ))}
                  </datalist>
                </div>
                <div className="col-md-6">
                  <label className="form-label text-accent fw-bold small text-uppercase mb-2" style={{ letterSpacing: '0.5px' }}>Discharge Condition</label>
                  <select
                    className="form-select"
                    value={formData.discharge_condition}
                    onChange={(e) => setFormData({ ...formData, discharge_condition: e.target.value })}
                  >
                    <option value="Stable">Stable</option>
                    <option value="Improved">Improved</option>
                    <option value="Recovered">Recovered</option>
                    <option value="Referred">Referred</option>
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label text-accent fw-bold small text-uppercase mb-2" style={{ letterSpacing: '0.5px' }}>Follow-up Instructions & Warning Signs</label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Review date, physical activity bounds, nutritional limits, and red flag warnings..."
                  value={formData.follow_up_instructions}
                  onChange={(e) => setFormData({ ...formData, follow_up_instructions: e.target.value })}
                ></textarea>
              </div>

              <div className="d-flex justify-content-between mt-5 pt-3 border-top border-white border-opacity-10">
                <button type="button" className="btn btn-glass px-4 py-3 rounded-3" onClick={handlePrevStep}>
                  <i className="bi bi-arrow-left me-2"></i> Previous
                </button>
                <button type="submit" className="btn btn-success px-5 py-3 rounded-3 shadow-glow-success hover-scale-sm">
                  Finalize Summary Protocol
                </button>
              </div>
            </div>
          )}
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal 
        isOpen={isEditModalOpen} 
        onClose={() => { setIsEditModalOpen(false); setEditingSummary(null); setValidationErrors({}); }} 
        title="Modify Discharge Summary Draft"
      >
        {editingSummary && (
          <form onSubmit={handleEditSubmit}>
            <div className="mb-4">
              <label className="form-label text-accent fw-bold small text-uppercase mb-2 required-label">Patient Name</label>
              <input
                type="text"
                className="form-control"
                value={editFormData.patient_name}
                onChange={(e) => setEditFormData({ ...editFormData, patient_name: e.target.value })}
              />
            </div>

            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <label className="form-label text-accent fw-bold small text-uppercase mb-2 required-label">Admission Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={editFormData.admission_date}
                  onChange={(e) => setEditFormData({ ...editFormData, admission_date: e.target.value })}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label text-accent fw-bold small text-uppercase mb-2 required-label">Discharge Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={editFormData.discharge_date}
                  onChange={(e) => setEditFormData({ ...editFormData, discharge_date: e.target.value })}
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label text-accent fw-bold small text-uppercase mb-2 required-label">Primary Diagnosis</label>
              <input
                type="text"
                className="form-control"
                value={editFormData.diagnosis}
                onChange={(e) => setEditFormData({ ...editFormData, diagnosis: e.target.value })}
              />
            </div>

            <div className="mb-4">
              <label className="form-label text-accent fw-bold small text-uppercase mb-2 required-label">Hospital Course Summary</label>
              <textarea
                className="form-control"
                rows="5"
                value={editFormData.hospital_course}
                onChange={(e) => setEditFormData({ ...editFormData, hospital_course: e.target.value })}
              ></textarea>
            </div>

            <div className="mb-4 bg-white bg-opacity-5 p-3 rounded-4 border">
              <label className="form-label text-accent fw-bold small text-uppercase mb-2 required-label">Discharge Medications Plan</label>
              <textarea
                className="form-control"
                rows="4"
                value={editFormData.discharge_medications}
                onChange={(e) => setEditFormData({ ...editFormData, discharge_medications: e.target.value })}
              ></textarea>
            </div>

            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <label className="form-label text-accent fw-bold small text-uppercase mb-2 required-label">Attending Doctor</label>
                <input
                  type="text"
                  className="form-control"
                  value={editFormData.attending_doctor}
                  onChange={(e) => setEditFormData({ ...editFormData, attending_doctor: e.target.value })}
                  list="edit-doctor-options"
                />
                <datalist id="edit-doctor-options">
                  {doctorOptions.map((doc) => (
                    <option key={doc} value={doc} />
                  ))}
                </datalist>
              </div>
              <div className="col-md-6">
                <label className="form-label text-accent fw-bold small text-uppercase mb-2">Discharge Condition</label>
                <select
                  className="form-select"
                  value={editFormData.discharge_condition}
                  onChange={(e) => setEditFormData({ ...editFormData, discharge_condition: e.target.value })}
                >
                  <option value="Stable">Stable</option>
                  <option value="Improved">Improved</option>
                  <option value="Recovered">Recovered</option>
                  <option value="Referred">Referred</option>
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label text-accent fw-bold small text-uppercase mb-2">Follow-up Instructions</label>
              <textarea
                className="form-control"
                rows="3"
                value={editFormData.follow_up_instructions}
                onChange={(e) => setEditFormData({ ...editFormData, follow_up_instructions: e.target.value })}
              ></textarea>
            </div>

            <div className="d-flex gap-3 mt-5 pt-3 border-top border-white border-opacity-10">
              <button type="button" className="btn btn-glass w-100 py-3" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary w-100 py-3">
                Save Draft Modifications
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Clinical Dossier View Modal */}
      <Modal 
        isOpen={isViewModalOpen} 
        onClose={() => { setIsViewModalOpen(false); setViewingSummary(null); }} 
        title="Clinical Discharge Dossier"
      >
        {viewingSummary && (
          <div className="clinical-dossier p-2">
            {/* Dossier header panel */}
            <div className="d-flex justify-content-between align-items-center mb-4 p-4 rounded-4 bg-white bg-opacity-5 border border-white border-opacity-10">
              <div>
                <span className="small text-muted d-block text-uppercase" style={{ letterSpacing: '1px', fontSize: '0.65rem' }}>Dossier ID</span>
                <strong className="fs-5 font-monospace">{viewingSummary.dischargeCode}</strong>
              </div>
              <div className="text-end">
                <span className="small text-muted d-block text-uppercase mb-1" style={{ letterSpacing: '1px', fontSize: '0.65rem' }}>Condition</span>
                <span className={`badge bg-${viewingSummary.dischargeCondition === 'Stable' ? 'success' : 
                                   viewingSummary.dischargeCondition === 'Recovered' ? 'success' : 
                                   viewingSummary.dischargeCondition === 'Improved' ? 'info' : 'warning'} text-white rounded-pill px-3 py-1.5 fw-bold`}>
                  {viewingSummary.dischargeCondition}
                </span>
              </div>
            </div>

            {/* Split metadata panel */}
            <div className="row g-4 mb-4 pb-4 border-bottom">
              <div className="col-md-6">
                <div className="mb-3">
                  <span className="small text-muted d-block text-uppercase" style={{ fontSize: '0.65rem', letterSpacing: '0.5px' }}>Patient Name</span>
                  <strong className="fs-5">{viewingSummary.patient}</strong>
                </div>
                <div>
                  <span className="small text-muted d-block text-uppercase" style={{ fontSize: '0.65rem', letterSpacing: '0.5px' }}>Admission Chronology</span>
                  <span className="text-muted">{viewingSummary.admissionDate}</span>
                </div>
              </div>
              <div className="col-md-6">
                <div className="mb-3">
                  <span className="small text-muted d-block text-uppercase" style={{ fontSize: '0.65rem', letterSpacing: '0.5px' }}>Attending Physician</span>
                  <strong className="fs-5">Dr. {viewingSummary.doctor || 'Unassigned'}</strong>
                </div>
                <div>
                  <span className="small text-muted d-block text-uppercase" style={{ fontSize: '0.65rem', letterSpacing: '0.5px' }}>Discharge Chronology</span>
                  <span className="text-muted">{viewingSummary.dischargeDate}</span>
                </div>
              </div>
            </div>

            {/* Detailed clinical summaries */}
            <div className="mb-4">
              <label className="form-label text-accent fw-bold small text-uppercase mb-2" style={{ letterSpacing: '0.5px' }}>Clinical Diagnosis</label>
              <input
                type="text"
                className="form-control"
                value={viewingSummary.diagnosis}
                readOnly
                disabled
              />
            </div>

            <div className="mb-4">
              <label className="form-label text-accent fw-bold small text-uppercase mb-2" style={{ letterSpacing: '0.5px' }}>Hospital Course & Description</label>
              <textarea
                className="form-control"
                rows="4"
                value={viewingSummary.hospitalCourse}
                readOnly
                disabled
              ></textarea>
            </div>

            <div className="mb-4">
              <label className="form-label text-accent fw-bold small text-uppercase mb-2" style={{ letterSpacing: '0.5px' }}>Home Medications Protocol</label>
              <textarea
                className="form-control"
                rows="3"
                value={viewingSummary.dischargeMedications}
                readOnly
                disabled
              ></textarea>
            </div>

            <div className="mb-4">
              <label className="form-label text-accent fw-bold small text-uppercase mb-2" style={{ letterSpacing: '0.5px' }}>Follow-up Care & Guidelines</label>
              <textarea
                className="form-control"
                rows="3"
                value={viewingSummary.followUpInstructions || 'No specific post-release care instructions logged.'}
                readOnly
                disabled
              ></textarea>
            </div>

            {/* Signatures placeholder visual */}
            <div className="d-flex justify-content-between mt-5 pt-5 border-top text-muted">
              <div>
                <div style={{ height: '1px', width: '120px', background: 'var(--accents-3)' }} className="mb-2"></div>
                <small className="small fw-medium" style={{ fontSize: '0.65rem' }}>Patient Signature</small>
              </div>
              <div className="text-end">
                <div style={{ height: '1px', width: '150px', background: 'var(--accents-3)' }} className="mb-2"></div>
                <small className="small fw-medium d-block" style={{ fontSize: '0.65rem' }}>Attending Physician Signature</small>
                <small className="text-muted" style={{ fontSize: '0.7rem' }}>Dr. {viewingSummary.doctor}</small>
              </div>
            </div>

            {/* Action buttons */}
            <div className="d-flex gap-3 mt-5 pt-3 border-top border-white border-opacity-10">
              <button type="button" className="btn btn-glass w-100 py-3" onClick={() => setIsViewModalOpen(false)}>
                Close Dossier
              </button>
              <button type="button" className="btn btn-primary w-100 py-3 d-flex align-items-center justify-content-center gap-2 hover-scale-sm" onClick={() => handleExportPDF(viewingSummary)}>
                <i className="bi bi-file-earmark-pdf fs-5"></i>
                <span>Download Certified PDF</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmation
        isOpen={isDeleteModalOpen}
        onClose={() => { setIsDeleteModalOpen(false); setDeletingSummary(null); }}
        onConfirm={handleDeleteConfirm}
        itemName={`Discharge Summary for ${deletingSummary?.patient}`}
        itemType="Discharge Summary"
      />
    </div>
  );
};

export default DischargeSummaries;
