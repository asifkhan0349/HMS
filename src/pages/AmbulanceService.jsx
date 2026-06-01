import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useApp, mapAmbulanceFromApi, formatDate } from '../context/AppContext';
import { useCrud } from '../hooks/useCrud';
import { ambulancesApi } from '../lib/api';
import Modal from '../components/UI/Modal';
import EmptyState from '../components/UI/EmptyState';
import DeleteConfirmation from '../components/UI/DeleteConfirmation';
import Pagination from '../components/UI/Pagination';
import { Skeleton } from 'boneyard-js/react';
import { usePagination } from '../hooks/usePagination';

const AmbulanceService = () => {
  const { showToast, user, globalRefreshTime } = useApp();
  const isAdmin = user?.role === 'Admin';

  const [trips, setTrips] = useState([]);
  const [loadingTrips, setLoadingTrips] = useState(true);

  const loadTrips = useCallback(async () => {
    setLoadingTrips(true);
    try {
      const data = await ambulancesApi.listTrips();
      setTrips(data);
    } catch (error) {
      showToast(error.message || 'Failed to load completed trips', 'error');
    } finally {
      setLoadingTrips(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadTrips();
  }, [loadTrips, globalRefreshTime]);
  
  const {
    data: ambulances = [],
    loading,
    addData: addAmbulance,
    updateData: updateAmbulance,
    removeData: deleteAmbulance
  } = useCrud(ambulancesApi, mapAmbulanceFromApi);

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Filtered list of ambulances
  const filteredAmbulances = useMemo(() => {
    return ambulances.filter(amb => {
      const matchSearch = 
        amb.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        amb.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (amb.driverName && amb.driverName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (amb.paramedicName && amb.paramedicName.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchType = typeFilter === 'All' || amb.type === typeFilter;
      const matchStatus = statusFilter === 'All' || amb.status === statusFilter;

      return matchSearch && matchType && matchStatus;
    });
  }, [ambulances, searchTerm, typeFilter, statusFilter]);

  const {
    paginatedData: paginatedAmbulances,
    currentPage,
    totalPages,
    rowsPerPage,
    totalItems,
    onPageChange,
    onRowsPerPageChange
  } = usePagination(filteredAmbulances);

  // Modals state
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Selected item state
  const [selectedAmbulance, setSelectedAmbulance] = useState(null);
  const [deletingAmbulance, setDeletingAmbulance] = useState(null);

  // Validation state
  const [validationErrors, setValidationErrors] = useState({});

  // Form states
  const [registerFormData, setRegisterFormData] = useState({
    vehicle_number: '',
    type: 'ALS',
    status: 'Available',
    driver_name: '',
    driver_contact: '',
    paramedic_name: '',
    equipment_checklist: 'Oxygen, AED, First Aid kit'
  });

  const [editFormData, setEditFormData] = useState({
    vehicle_number: '',
    type: 'ALS',
    status: 'Available',
    driver_name: '',
    driver_contact: '',
    paramedic_name: '',
    equipment_checklist: '',
    current_trip_patient: '',
    current_trip_destination: ''
  });

  const [dispatchFormData, setDispatchFormData] = useState({
    patient_name: '',
    destination: '',
    driver_name: '',
    driver_contact: '',
    paramedic_name: '',
    equipment_checklist: ''
  });

  // Calculate statistics
  const stats = useMemo(() => {
    const total = ambulances.length;
    const available = ambulances.filter(a => a.status === 'Available').length;
    const dispatched = ambulances.filter(a => a.status === 'Dispatched').length;
    const maintenance = ambulances.filter(a => a.status === 'Maintenance' || a.status === 'Out of Service').length;
    return { total, available, dispatched, maintenance };
  }, [ambulances]);

  // Handle register submit
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!registerFormData.vehicle_number.trim()) errors.vehicle_number = true;
    if (!registerFormData.type) errors.type = true;

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      showToast('Please fill in all mandatory fields highlighted in red.', 'warning');
      return;
    }
    setValidationErrors({});

    try {
      await addAmbulance({
        ...registerFormData,
        current_trip_patient: null,
        current_trip_destination: null
      });
      showToast(`Ambulance ${registerFormData.vehicle_number} registered successfully.`);
      setIsRegisterModalOpen(false);
      setRegisterFormData({
        vehicle_number: '',
        type: 'ALS',
        status: 'Available',
        driver_name: '',
        driver_contact: '',
        paramedic_name: '',
        equipment_checklist: 'Oxygen, AED, First Aid kit'
      });
    } catch (err) {
      showToast(err.message || 'Unable to register vehicle.', 'error');
    }
  };

  // Open Edit Modal
  const openEditModal = (amb) => {
    setSelectedAmbulance(amb);
    setEditFormData({
      vehicle_number: amb.vehicleNumber,
      type: amb.type,
      status: amb.status,
      driver_name: amb.driverName,
      driver_contact: amb.driverContact,
      paramedic_name: amb.paramedicName,
      equipment_checklist: amb.equipmentChecklist,
      current_trip_patient: amb.currentTripPatient || '',
      current_trip_destination: amb.currentTripDestination || ''
    });
    setIsEditModalOpen(true);
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!editFormData.vehicle_number.trim()) errors.vehicle_number = true;
    if (!editFormData.type) errors.type = true;

    if (editFormData.status === 'Dispatched') {
      if (!editFormData.current_trip_patient || !editFormData.current_trip_patient.trim()) {
        errors.current_trip_patient = true;
      }
      if (!editFormData.current_trip_destination || !editFormData.current_trip_destination.trim()) {
        errors.current_trip_destination = true;
      }
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      showToast('Please fill in all mandatory fields highlighted in red.', 'warning');
      return;
    }
    setValidationErrors({});

    try {
      const payload = {
        ...editFormData,
        current_trip_patient: editFormData.status === 'Dispatched' ? editFormData.current_trip_patient : null,
        current_trip_destination: editFormData.status === 'Dispatched' ? editFormData.current_trip_destination : null
      };

      await updateAmbulance(selectedAmbulance.apiId, payload);
      showToast(`Ambulance ${selectedAmbulance.id} updated successfully.`);
      setIsEditModalOpen(false);
      setSelectedAmbulance(null);
      await loadTrips();
    } catch (err) {
      showToast(err.message || 'Unable to update vehicle.', 'error');
    }
  };

  // Open Dispatch Modal
  const openDispatchModal = (amb) => {
    setSelectedAmbulance(amb);
    setDispatchFormData({
      patient_name: '',
      destination: '',
      driver_name: amb.driverName || '',
      driver_contact: amb.driverContact || '',
      paramedic_name: amb.paramedicName || '',
      equipment_checklist: amb.equipmentChecklist || 'Oxygen, AED, First Aid kit'
    });
    setIsDispatchModalOpen(true);
  };

  // Handle Dispatch Submit
  const handleDispatchSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!dispatchFormData.patient_name.trim()) errors.patient_name = true;
    if (!dispatchFormData.destination.trim()) errors.destination = true;
    if (!dispatchFormData.driver_name.trim()) errors.driver_name = true;
    if (!dispatchFormData.paramedic_name.trim()) errors.paramedic_name = true;

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      showToast('Please fill in all required dispatch details.', 'warning');
      return;
    }
    setValidationErrors({});

    try {
      const payload = {
        status: 'Dispatched',
        driver_name: dispatchFormData.driver_name,
        driver_contact: dispatchFormData.driver_contact,
        paramedic_name: dispatchFormData.paramedic_name,
        equipment_checklist: dispatchFormData.equipment_checklist,
        current_trip_patient: dispatchFormData.patient_name,
        current_trip_destination: dispatchFormData.destination
      };

      await updateAmbulance(selectedAmbulance.apiId, payload);
      showToast(`Ambulance ${selectedAmbulance.id} dispatched successfully to ${dispatchFormData.destination}.`);
      setIsDispatchModalOpen(false);
      setSelectedAmbulance(null);
    } catch (err) {
      showToast(err.message || 'Unable to dispatch vehicle.', 'error');
    }
  };

  // Complete Trip (marks as Available)
  const handleCompleteTrip = async (amb) => {
    try {
      const payload = {
        status: 'Available',
        current_trip_patient: null,
        current_trip_destination: null
      };
      await updateAmbulance(amb.apiId, payload);
      showToast(`Ambulance ${amb.id} is now available.`);
      await loadTrips();
    } catch (err) {
      showToast(err.message || 'Failed to complete trip.', 'error');
    }
  };

  // Handle Delete
  const handleDeleteConfirm = async () => {
    try {
      await deleteAmbulance(deletingAmbulance.apiId);
      showToast(`Ambulance ${deletingAmbulance.id} deleted successfully.`);
      setIsDeleteModalOpen(false);
      setDeletingAmbulance(null);
    } catch (err) {
      showToast(err.message || 'Unable to delete vehicle.', 'error');
    }
  };

  // Mock Active Trip coordinates for map pins
  const activeTripsWithCoordinates = useMemo(() => {
    const dispatchedAmbulances = ambulances.filter(a => a.status === 'Dispatched');
    const mockCoordinates = [
      { lat: 40.7128, lng: -74.0060, addr: 'Broadway & Wall St' },
      { lat: 40.7589, lng: -73.9851, addr: 'Times Square Central' },
      { lat: 40.7061, lng: -73.9969, addr: 'Brooklyn Bridge Entry' },
      { lat: 40.7829, lng: -73.9654, addr: 'Central Park East' },
      { lat: 40.7484, lng: -73.9857, addr: 'Empire State Medical Center' }
    ];

    return dispatchedAmbulances.map((amb, index) => {
      const coords = mockCoordinates[index % mockCoordinates.length];
      return {
        ...amb,
        lat: coords.lat,
        lng: coords.lng,
        address: amb.currentTripDestination || coords.addr
      };
    });
  }, [ambulances]);

  return (
    <main className="ambulance-service-page p-4">
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-5">
        <div>
          <h2 className="fw-bold mb-1">Ambulance Service Dashboard</h2>
          <p className="text-muted mb-0">Manage emergency fleet response, crew logistics, and telemetry tracking.</p>
        </div>
        <button
          className="btn btn-primary px-4 py-2 d-flex align-items-center"
          onClick={() => setIsRegisterModalOpen(true)}
        >
          <i className="bi bi-plus-lg me-2" aria-hidden="true"></i>
          Register Vehicle
        </button>
      </div>

      {/* KPI Cards */}
      <div className="row g-4 mb-5">
        <div className="col-12 col-sm-6 col-md-3">
          <div className="glass-card p-4 transition-all hover-translate-y d-flex align-items-center justify-content-between">
            <div>
              <small className="text-muted fw-bold text-uppercase d-block mb-1" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Total Fleet</small>
              <h3 className="fw-bold mb-0 text-dark" style={{ fontVariantNumeric: 'tabular-nums' }}>{stats.total}</h3>
            </div>
            <div className="rounded-circle d-flex align-items-center justify-content-center bg-primary bg-opacity-10 border text-primary" style={{ width: '48px', height: '48px', borderColor: 'rgba(0, 112, 243, 0.2)' }}>
              <i className="bi bi-truck fs-4"></i>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-md-3">
          <div className="glass-card p-4 transition-all hover-translate-y d-flex align-items-center justify-content-between">
            <div>
              <small className="text-muted fw-bold text-uppercase d-block mb-1" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Available</small>
              <h3 className="fw-bold mb-0 text-success" style={{ fontVariantNumeric: 'tabular-nums' }}>{stats.available}</h3>
            </div>
            <div className="rounded-circle d-flex align-items-center justify-content-center bg-success bg-opacity-10 border text-success" style={{ width: '48px', height: '48px', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
              <i className="bi bi-shield-check fs-4"></i>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-md-3">
          <div className="glass-card p-4 transition-all hover-translate-y d-flex align-items-center justify-content-between">
            <div>
              <small className="text-muted fw-bold text-uppercase d-block mb-1" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Dispatched</small>
              <h3 className="fw-bold mb-0 text-primary" style={{ fontVariantNumeric: 'tabular-nums' }}>{stats.dispatched}</h3>
            </div>
            <div className="rounded-circle d-flex align-items-center justify-content-center bg-info bg-opacity-10 border text-primary" style={{ width: '48px', height: '48px', borderColor: 'rgba(0, 112, 243, 0.2)' }}>
              <i className="bi bi-broadcast fs-4 pulsing-dot" style={{ animation: 'pulse 1.5s infinite' }}></i>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-md-3">
          <div className="glass-card p-4 transition-all hover-translate-y d-flex align-items-center justify-content-between">
            <div>
              <small className="text-muted fw-bold text-uppercase d-block mb-1" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>In Maintenance</small>
              <h3 className="fw-bold mb-0 text-warning" style={{ fontVariantNumeric: 'tabular-nums' }}>{stats.maintenance}</h3>
            </div>
            <div className="rounded-circle d-flex align-items-center justify-content-center bg-warning bg-opacity-10 border text-warning" style={{ width: '48px', height: '48px', borderColor: 'rgba(245, 158, 11, 0.2)' }}>
              <i className="bi bi-wrench fs-4"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Dispatch telemetry layout */}
      <div className="row g-4 mb-5">
        {/* Completed Trips Log Panel */}
        <div className="col-lg-7">
          <div className="glass-card h-100 p-0 border overflow-hidden d-flex flex-column" style={{ minHeight: '400px' }}>
            <div className="p-4 border-bottom bg-light d-flex justify-content-between align-items-center">
              <div>
                <h5 className="fw-bold mb-0 text-dark">Completed Trips Log</h5>
                <small className="text-muted">Audit log of all emergency runs and patient transports</small>
              </div>
              <span className="badge bg-success bg-opacity-10 border border-success-subtle text-success rounded-pill px-3 py-1 font-monospace" style={{ fontSize: '0.72rem' }}>
                <i className="bi bi-shield-check me-1"></i>PERSISTED
              </span>
            </div>
            
            <Skeleton name="trips-table" loading={loadingTrips}>
              <div className="flex-grow-1 p-0 overflow-y-auto" style={{ maxHeight: '310px' }}>
                {trips.length === 0 ? (
                  <div className="d-flex flex-column align-items-center justify-content-center h-100 py-5 text-center">
                    <div className="bg-light rounded-circle p-3 mb-3 border">
                      <i className="bi bi-journal-text text-muted fs-3"></i>
                    </div>
                    <h6 className="fw-bold mb-1 text-dark">No Completed Trips</h6>
                    <p className="text-muted small mb-0 px-4">Trips will automatically populate here after ambulances return and complete their runs.</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table mb-0 align-middle table-hover" style={{ fontSize: '0.82rem' }}>
                      <thead className="table-light">
                        <tr>
                          <th className="px-4 py-3" style={{ fontSize: '0.72rem' }}>Trip ID</th>
                          <th className="py-3" style={{ fontSize: '0.72rem' }}>Ambulance Unit</th>
                          <th className="py-3" style={{ fontSize: '0.72rem' }}>Patient Name</th>
                          <th className="py-3" style={{ fontSize: '0.72rem' }}>Destination</th>
                          <th className="px-4 py-3 text-end" style={{ fontSize: '0.72rem' }}>Completed At</th>
                        </tr>
                      </thead>
                      <tbody>
                        {trips.map((trip) => (
                          <tr key={trip.id}>
                            <td className="px-4 font-monospace fw-bold text-primary">TRP-{trip.id}</td>
                            <td>
                              <div className="fw-bold text-dark">{trip.ambulance_code}</div>
                              <div className="text-muted font-monospace" style={{ fontSize: '0.72rem' }}>{trip.vehicle_number}</div>
                            </td>
                            <td>
                              <div className="fw-semibold text-dark">{trip.patient_name}</div>
                              <div className="text-muted" style={{ fontSize: '0.72rem' }}>Crew: {trip.driver_name || 'N/A'}</div>
                            </td>
                            <td className="text-truncate" style={{ maxWidth: '160px' }} title={trip.destination}>
                              {trip.destination}
                            </td>
                            <td className="px-4 text-end text-muted font-monospace" style={{ fontSize: '0.75rem' }}>
                              {formatDate(trip.completed_at, {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true
                              })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </Skeleton>
          </div>
        </div>

        {/* Active Dispatches List */}
        <div className="col-lg-5">
          <div className="glass-card h-100 p-4 border d-flex flex-column">
            <h5 className="fw-bold mb-1 text-dark">Active Responding Trips</h5>
            <p className="text-muted small mb-4">Complete active emergency runs once the team returns.</p>
            
            <div className="flex-grow-1 overflow-y-auto" style={{ maxHeight: '310px' }}>
              {ambulances.filter(a => a.status === 'Dispatched').length === 0 ? (
                <div className="d-flex flex-column align-items-center justify-content-center h-100 py-5 text-center">
                  <div className="bg-light rounded-circle p-3 mb-3 border">
                    <i className="bi bi-send-check text-muted fs-3"></i>
                  </div>
                  <h6 className="fw-bold mb-1">System Standby</h6>
                  <p className="text-muted small mb-0 px-4">All available ambulance units are currently on standby at the bay.</p>
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {ambulances.filter(a => a.status === 'Dispatched').map((amb) => (
                    <div key={amb.id} className="p-3 border rounded-3 bg-light bg-opacity-50 hover-translate-y transition-all">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <span className="badge bg-primary text-white font-monospace mb-1">{amb.id}</span>
                          <span className="small text-muted d-block font-monospace">{amb.vehicleNumber}</span>
                        </div>
                        <span className="badge rounded-pill bg-danger bg-opacity-10 border border-danger-subtle text-danger px-2.5 py-1 small fw-bold font-monospace">
                          DISPATCHED
                        </span>
                      </div>
                      <div className="row g-2 mb-3">
                        <div className="col-6">
                          <small className="text-muted d-block" style={{ fontSize: '0.65rem' }}>PATIENT</small>
                          <span className="small fw-semibold">{amb.currentTripPatient || 'N/A'}</span>
                        </div>
                        <div className="col-6">
                          <small className="text-muted d-block" style={{ fontSize: '0.65rem' }}>DESTINATION</small>
                          <span className="small fw-semibold text-truncate d-block" title={amb.currentTripDestination}>{amb.currentTripDestination || 'N/A'}</span>
                        </div>
                      </div>
                      <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                        <small className="text-muted font-monospace" style={{ fontSize: '0.65rem' }}>Crew: {amb.driverName}</small>
                        <button
                          className="btn btn-sm btn-outline-success px-3 py-1 font-monospace"
                          style={{ fontSize: '0.7rem' }}
                          onClick={() => handleCompleteTrip(amb)}
                        >
                          <i className="bi bi-check2-circle me-1"></i>Complete Trip
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Inventory & Fleet Management Table */}
      <div className="glass-card mb-4 border overflow-hidden">
        {/* Table Filter Actions */}
        <div className="p-4 border-bottom bg-white">
          <div className="row g-3 align-items-center">
            <div className="col-md-4">
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0 text-muted">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 ps-0"
                  placeholder="Search fleet (Code, License, Crew)..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="col-md-3">
              <select 
                className="form-select"
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
              >
                <option value="All">All Vehicle Types</option>
                <option value="ALS">Advanced Life Support (ALS)</option>
                <option value="BLS">Basic Life Support (BLS)</option>
                <option value="Patient Transport">Patient Transport</option>
                <option value="Critical Care">Critical Care Transport</option>
              </select>
            </div>

            <div className="col-md-3">
              <select 
                className="form-select"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="All">All Statuses</option>
                <option value="Available">Available</option>
                <option value="Dispatched">Dispatched</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Out of Service">Out of Service</option>
              </select>
            </div>

            <div className="col-md-2 text-md-end">
              <small className="text-muted font-monospace" style={{ fontSize: '0.75rem' }}>
                Found: {filteredAmbulances.length} Units
              </small>
            </div>
          </div>
        </div>

        {/* Fleet Table */}
        <Skeleton name="ambulance-table" loading={loading}>
          <div className="table-responsive">
            <table className="table mb-0 align-middle">
              <thead>
                <tr>
                  <th className="px-4">Unit Code</th>
                  <th>License Number</th>
                  <th>Type</th>
                  <th>Crew Assigned</th>
                  <th>Checklist Status</th>
                  <th>Status</th>
                  <th className="px-4 text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAmbulances.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-0">
                      <EmptyState
                        icon="bi-truck-flatbed"
                        title="No Vehicles Found"
                        description="There are no registered emergency vehicles matching your filters."
                        actionText="Register Vehicle"
                        onAction={() => setIsRegisterModalOpen(true)}
                      />
                    </td>
                  </tr>
                ) : (
                  paginatedAmbulances.map((amb) => (
                    <tr key={amb.id}>
                      <td className="px-4 font-monospace fw-bold">{amb.id}</td>
                      <td className="font-monospace text-muted">{amb.vehicleNumber}</td>
                      <td>
                        <span className="badge bg-light text-dark border px-2.5 py-1 small fw-semibold">
                          {amb.type}
                        </span>
                      </td>
                      <td>
                        {amb.driverName ? (
                          <div className="small">
                            <div className="fw-semibold text-dark">{amb.driverName} (Driver)</div>
                            {amb.paramedicName && <div className="text-muted" style={{ fontSize: '0.7rem' }}>{amb.paramedicName} (EMT)</div>}
                          </div>
                        ) : (
                          <span className="text-muted small italic">No crew assigned</span>
                        )}
                      </td>
                      <td>
                        <div className="small text-truncate" style={{ maxWidth: '180px' }} title={amb.equipmentChecklist}>
                          <i className="bi bi-card-checklist text-muted me-1"></i>
                          {amb.equipmentChecklist || <span className="text-muted italic">None</span>}
                        </div>
                      </td>
                      <td>
                        <span
                          className="px-2.5 py-1 rounded-pill small fw-bold font-monospace"
                          style={{
                            fontSize: '0.65rem',
                            background: 
                              amb.status === 'Available' ? 'rgba(16, 185, 129, 0.12)' :
                              amb.status === 'Dispatched' ? 'rgba(59, 130, 246, 0.12)' :
                              amb.status === 'Maintenance' ? 'rgba(245, 158, 11, 0.12)' :
                              'rgba(107, 114, 128, 0.12)',
                            color: 
                              amb.status === 'Available' ? '#10b981' :
                              amb.status === 'Dispatched' ? '#3b82f6' :
                              amb.status === 'Maintenance' ? '#f59e0b' :
                              '#6b7280',
                            border: `1px solid ${
                              amb.status === 'Available' ? 'rgba(16, 185, 129, 0.25)' :
                              amb.status === 'Dispatched' ? 'rgba(59, 130, 246, 0.25)' :
                              amb.status === 'Maintenance' ? 'rgba(245, 158, 11, 0.25)' :
                              'rgba(107, 114, 128, 0.25)'
                            }`
                          }}
                        >
                          {amb.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 text-end">
                        <div className="d-flex justify-content-end gap-1.5">
                          {amb.status === 'Available' && (
                            <button
                              className="btn btn-sm btn-outline-primary px-3 py-1 font-monospace"
                              style={{ fontSize: '0.7rem' }}
                              onClick={() => openDispatchModal(amb)}
                            >
                              Dispatch
                            </button>
                          )}
                          <button
                            className="btn btn-sm btn-glass px-2"
                            onClick={() => openEditModal(amb)}
                            title="Edit Vehicle"
                          >
                            <i className="bi bi-pencil-square" aria-hidden="true"></i>
                          </button>
                          {isAdmin && (
                            <button
                              className="btn btn-sm btn-glass text-danger px-2"
                              onClick={() => {
                                setDeletingAmbulance(amb);
                                setIsDeleteModalOpen(true);
                              }}
                              title="Delete Vehicle"
                            >
                              <i className="bi bi-trash3" aria-hidden="true"></i>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Skeleton>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={onRowsPerPageChange}
        totalItems={totalItems}
      />

      {/* Register Vehicle Modal */}
      <Modal isOpen={isRegisterModalOpen} onClose={() => setIsRegisterModalOpen(false)} title="Register Emergency Vehicle">
        <form onSubmit={handleRegisterSubmit}>
          <div className="mb-4">
            <label htmlFor="reg-license" className="form-label text-muted fw-bold small text-uppercase mb-2 required-label">License Plate Number</label>
            <input
              id="reg-license"
              type="text"
              className={`form-control ${validationErrors.vehicle_number ? 'is-invalid' : ''}`}
              placeholder="e.g. NY-723-AMB"
              value={registerFormData.vehicle_number}
              onChange={e => setRegisterFormData({ ...registerFormData, vehicle_number: e.target.value })}
            />
          </div>

          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <label htmlFor="reg-type" className="form-label text-muted fw-bold small text-uppercase mb-2 required-label">Vehicle Service Type</label>
              <select
                id="reg-type"
                className="form-select"
                value={registerFormData.type}
                onChange={e => setRegisterFormData({ ...registerFormData, type: e.target.value })}
              >
                <option value="ALS">Advanced Life Support (ALS)</option>
                <option value="BLS">Basic Life Support (BLS)</option>
                <option value="Patient Transport">Patient Transport</option>
                <option value="Critical Care">Critical Care Transport</option>
              </select>
            </div>
            <div className="col-md-6">
              <label htmlFor="reg-status" className="form-label text-muted fw-bold small text-uppercase mb-2 required-label">Initial Status</label>
              <select
                id="reg-status"
                className="form-select"
                value={registerFormData.status}
                onChange={e => setRegisterFormData({ ...registerFormData, status: e.target.value })}
              >
                <option value="Available">Available</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Out of Service">Out of Service</option>
              </select>
            </div>
          </div>

          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <label htmlFor="reg-driver" className="form-label text-muted fw-bold small text-uppercase mb-2">Driver Name</label>
              <input
                id="reg-driver"
                type="text"
                className="form-control"
                placeholder="Driver Name"
                value={registerFormData.driver_name}
                onChange={e => setRegisterFormData({ ...registerFormData, driver_name: e.target.value })}
              />
            </div>
            <div className="col-md-6">
              <label htmlFor="reg-contact" className="form-label text-muted fw-bold small text-uppercase mb-2">Driver Contact Number</label>
              <input
                id="reg-contact"
                type="text"
                className="form-control"
                placeholder="Driver Phone"
                value={registerFormData.driver_contact}
                onChange={e => setRegisterFormData({ ...registerFormData, driver_contact: e.target.value })}
              />
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="reg-paramedic" className="form-label text-muted fw-bold small text-uppercase mb-2">Lead EMT / Paramedic Name</label>
            <input
              id="reg-paramedic"
              type="text"
              className="form-control"
              placeholder="EMT Name"
              value={registerFormData.paramedic_name}
              onChange={e => setRegisterFormData({ ...registerFormData, paramedic_name: e.target.value })}
            />
          </div>

          <div className="mb-4">
            <label htmlFor="reg-checklist" className="form-label text-muted fw-bold small text-uppercase mb-2">On-board Equipment Checklist</label>
            <textarea
              id="reg-checklist"
              className="form-control"
              rows="2"
              placeholder="e.g. Oxygen Tank, Defibrillator, Trauma Kit"
              value={registerFormData.equipment_checklist}
              onChange={e => setRegisterFormData({ ...registerFormData, equipment_checklist: e.target.value })}
            />
            <small className="text-muted">Comma-separated list of certified active tools inside the vehicle.</small>
          </div>

          <div className="d-flex gap-2 mt-5">
            <button type="button" className="btn btn-glass w-100 py-2 border text-dark" onClick={() => setIsRegisterModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary w-100 py-2">Register Vehicle</button>
          </div>
        </form>
      </Modal>

      {/* Edit Vehicle Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Update Emergency Vehicle">
        {selectedAmbulance && (
          <form onSubmit={handleEditSubmit}>
            <div className="mb-4">
              <label htmlFor="edit-license" className="form-label text-muted fw-bold small text-uppercase mb-2 required-label">License Plate Number</label>
              <input
                id="edit-license"
                type="text"
                className={`form-control ${validationErrors.vehicle_number ? 'is-invalid' : ''}`}
                value={editFormData.vehicle_number}
                onChange={e => setEditFormData({ ...editFormData, vehicle_number: e.target.value })}
              />
            </div>

            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <label htmlFor="edit-type" className="form-label text-muted fw-bold small text-uppercase mb-2 required-label">Vehicle Service Type</label>
                <select
                  id="edit-type"
                  className="form-select"
                  value={editFormData.type}
                  onChange={e => setEditFormData({ ...editFormData, type: e.target.value })}
                >
                  <option value="ALS">Advanced Life Support (ALS)</option>
                  <option value="BLS">Basic Life Support (BLS)</option>
                  <option value="Patient Transport">Patient Transport</option>
                  <option value="Critical Care">Critical Care Transport</option>
                </select>
              </div>
              <div className="col-md-6">
                <label htmlFor="edit-status" className="form-label text-muted fw-bold small text-uppercase mb-2 required-label">Vehicle Status</label>
                <select
                  id="edit-status"
                  className="form-select"
                  value={editFormData.status}
                  onChange={e => setEditFormData({ ...editFormData, status: e.target.value })}
                >
                  <option value="Available">Available</option>
                  <option value="Dispatched">Dispatched</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Out of Service">Out of Service</option>
                </select>
              </div>
            </div>

            {editFormData.status === 'Dispatched' && (
              <div className="row g-3 mb-4 p-3 rounded bg-danger bg-opacity-10 border border-danger-subtle">
                <div className="col-md-6">
                  <label htmlFor="edit-patient" className="form-label text-muted fw-bold small text-uppercase mb-2 required-label">Trip Patient</label>
                  <input
                    id="edit-patient"
                    type="text"
                    className={`form-control ${validationErrors.current_trip_patient ? 'is-invalid' : ''}`}
                    placeholder="Patient Name"
                    value={editFormData.current_trip_patient}
                    onChange={e => setEditFormData({ ...editFormData, current_trip_patient: e.target.value })}
                  />
                </div>
                <div className="col-md-6">
                  <label htmlFor="edit-dest" className="form-label text-muted fw-bold small text-uppercase mb-2 required-label">Trip Destination</label>
                  <input
                    id="edit-dest"
                    type="text"
                    className={`form-control ${validationErrors.current_trip_destination ? 'is-invalid' : ''}`}
                    placeholder="Destination address"
                    value={editFormData.current_trip_destination}
                    onChange={e => setEditFormData({ ...editFormData, current_trip_destination: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <label htmlFor="edit-driver" className="form-label text-muted fw-bold small text-uppercase mb-2">Driver Name</label>
                <input
                  id="edit-driver"
                  type="text"
                  className="form-control"
                  value={editFormData.driver_name}
                  onChange={e => setEditFormData({ ...editFormData, driver_name: e.target.value })}
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="edit-contact" className="form-label text-muted fw-bold small text-uppercase mb-2">Driver Contact Number</label>
                <input
                  id="edit-contact"
                  type="text"
                  className="form-control"
                  value={editFormData.driver_contact}
                  onChange={e => setEditFormData({ ...editFormData, driver_contact: e.target.value })}
                />
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="edit-paramedic" className="form-label text-muted fw-bold small text-uppercase mb-2">Lead EMT / Paramedic Name</label>
              <input
                id="edit-paramedic"
                type="text"
                className="form-control"
                value={editFormData.paramedic_name}
                onChange={e => setEditFormData({ ...editFormData, paramedic_name: e.target.value })}
              />
            </div>

            <div className="mb-4">
              <label htmlFor="edit-checklist" className="form-label text-muted fw-bold small text-uppercase mb-2">On-board Equipment Checklist</label>
              <textarea
                id="edit-checklist"
                className="form-control"
                rows="2"
                value={editFormData.equipment_checklist}
                onChange={e => setEditFormData({ ...editFormData, equipment_checklist: e.target.value })}
              />
            </div>

            <div className="d-flex gap-2 mt-5">
              <button type="button" className="btn btn-glass w-100 py-2 border text-dark" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary w-100 py-2">Save Changes</button>
            </div>
          </form>
        )}
      </Modal>

      {/* Dispatch Ambulance Modal */}
      <Modal isOpen={isDispatchModalOpen} onClose={() => setIsDispatchModalOpen(false)} title={`Emergency Dispatch: ${selectedAmbulance?.id}`}>
        {selectedAmbulance && (
          <form onSubmit={handleDispatchSubmit}>
            <div className="p-3 mb-4 rounded bg-light border">
              <div className="small font-monospace text-muted mb-1">VEHICLE DETAILS</div>
              <div className="fw-bold text-dark">{selectedAmbulance.vehicleNumber} ({selectedAmbulance.type})</div>
              <div className="small text-muted mt-1">Status: {selectedAmbulance.status}</div>
            </div>

            <div className="mb-4">
              <label htmlFor="disp-patient" className="form-label text-muted fw-bold small text-uppercase mb-2 required-label">Patient Name</label>
              <input
                id="disp-patient"
                type="text"
                className={`form-control ${validationErrors.patient_name ? 'is-invalid' : ''}`}
                placeholder="Patient Full Name"
                value={dispatchFormData.patient_name}
                onChange={e => setDispatchFormData({ ...dispatchFormData, patient_name: e.target.value })}
              />
            </div>

            <div className="mb-4">
              <label htmlFor="disp-dest" className="form-label text-muted fw-bold small text-uppercase mb-2 required-label">Emergency Destination / Address</label>
              <input
                id="disp-dest"
                type="text"
                className={`form-control ${validationErrors.destination ? 'is-invalid' : ''}`}
                placeholder="Pickup Location Address"
                value={dispatchFormData.destination}
                onChange={e => setDispatchFormData({ ...dispatchFormData, destination: e.target.value })}
              />
            </div>

            <h6 className="fw-bold mt-4 mb-3 border-bottom pb-2 text-dark">Crew Verification</h6>
            
            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <label htmlFor="disp-driver" className="form-label text-muted fw-bold small text-uppercase mb-2 required-label">Driver Name</label>
                <input
                  id="disp-driver"
                  type="text"
                  className={`form-control ${validationErrors.driver_name ? 'is-invalid' : ''}`}
                  value={dispatchFormData.driver_name}
                  onChange={e => setDispatchFormData({ ...dispatchFormData, driver_name: e.target.value })}
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="disp-contact" className="form-label text-muted fw-bold small text-uppercase mb-2">Driver Contact Number</label>
                <input
                  id="disp-contact"
                  type="text"
                  className="form-control"
                  value={dispatchFormData.driver_contact}
                  onChange={e => setDispatchFormData({ ...dispatchFormData, driver_contact: e.target.value })}
                />
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="disp-paramedic" className="form-label text-muted fw-bold small text-uppercase mb-2 required-label">EMT / Paramedic Name</label>
              <input
                id="disp-paramedic"
                type="text"
                className={`form-control ${validationErrors.paramedic_name ? 'is-invalid' : ''}`}
                value={dispatchFormData.paramedic_name}
                onChange={e => setDispatchFormData({ ...dispatchFormData, paramedic_name: e.target.value })}
              />
            </div>

            <div className="mb-4">
              <label htmlFor="disp-checklist" className="form-label text-muted fw-bold small text-uppercase mb-2">Confirm On-board Checklist</label>
              <textarea
                id="disp-checklist"
                className="form-control"
                rows="2"
                value={dispatchFormData.equipment_checklist}
                onChange={e => setDispatchFormData({ ...dispatchFormData, equipment_checklist: e.target.value })}
              />
            </div>

            <div className="d-flex gap-2 mt-5">
              <button type="button" className="btn btn-glass w-100 py-2 border text-dark" onClick={() => setIsDispatchModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-danger w-100 py-2">Confirm Dispatch</button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Vehicle Modal */}
      <DeleteConfirmation
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        itemName={deletingAmbulance?.id}
        itemType="Emergency Vehicle"
      />
    </main>
  );
};

export default AmbulanceService;
