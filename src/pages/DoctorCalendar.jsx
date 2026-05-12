import React, { useState, useMemo } from 'react';
import { useApp, mapAppointmentFromApi } from '../context/AppContext';
import { useCrud } from '../hooks/useCrud';
import { appointmentsApi } from '../lib/api';
import Modal from '../components/UI/Modal';
import { Skeleton } from 'boneyard-js/react';

const DoctorCalendar = () => {
  const { user } = useApp();
  const { data: appointments, loading } = useCrud(appointmentsApi, mapAppointmentFromApi);
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateAppointments, setSelectedDateAppointments] = useState(null);

  // Calendar Helpers
  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const getDateKey = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const totalDays = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);
    
    const days = [];
    // Padding for previous month
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    // Days of current month
    for (let i = 1; i <= totalDays; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  }, [currentDate]);

  const appointmentsByDate = useMemo(() => {
    const map = {};
    appointments.forEach(app => {
      if (app.appointmentDate) {
        const dateObj = new Date(app.appointmentDate);
        const dateKey = app.appointmentDate.includes('T') 
          ? getDateKey(dateObj)
          : app.appointmentDate.split('T')[0]; 
        
        if (!map[dateKey]) map[dateKey] = [];
        map[dateKey].push(app);
      }
    });
    return map;
  }, [appointments]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const year = currentDate.getFullYear();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <main className="doctor-calendar-page p-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-5">
        <div>
          <h2 className="fw-bold mb-1" style={{ letterSpacing: '-0.5px' }}>Appointment Calendar</h2>
          <p className="text-muted mb-0 small text-uppercase fw-bold opacity-75" style={{ letterSpacing: '1px' }}>
            Clinical Schedule & Slot Management
          </p>
        </div>
        
        <div className="d-flex gap-2 align-items-center">
          <button 
            className="btn btn-glass border px-3 py-2 small fw-bold" 
            onClick={handleToday}
            style={{ borderRadius: '12px' }}
          >
            Today
          </button>
          <div className="d-flex align-items-center bg-white border rounded-3 p-1 shadow-sm">
            <button className="btn btn-sm btn-link text-dark p-2 hover-bg-light rounded-2" onClick={handlePrevMonth}>
              <i className="bi bi-chevron-left"></i>
            </button>
            <span className="fw-bold px-3 text-nowrap text-center" style={{ minWidth: '140px', fontSize: '0.95rem' }}>
              {monthName} {year}
            </span>
            <button className="btn btn-sm btn-link text-dark p-2 hover-bg-light rounded-2" onClick={handleNextMonth}>
              <i className="bi bi-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>

      <div className="calendar-container glass-card p-0 border shadow-sm" style={{ borderRadius: '20px', overflow: 'hidden', backgroundColor: '#fff' }}>
        {/* Unified Grid Container */}
        <div className="calendar-grid-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {/* Calendar Header / Days of Week */}
          {weekDays.map(day => (
            <div key={day} className="text-center py-3 fw-bold text-muted extra-small text-uppercase bg-light bg-opacity-50" style={{ letterSpacing: '1.5px', fontSize: '0.65rem' }}>
              {day}
            </div>
          ))}
          
          {/* Calendar Body / Dates Grid */}
          {loading ? (
            <Skeleton name="calendar-grid-loading" count={35} containerStyle={{ display: 'contents' }}>
              {Array(35).fill(null).map((_, i) => (
                <div key={i} className="bg-light bg-opacity-25" style={{ minHeight: '140px' }}></div>
              ))}
            </Skeleton>
          ) : (
            calendarData.map((date, idx) => {
              if (!date) return (
                <div key={`empty-${idx}`} className="calendar-cell empty-cell bg-light bg-opacity-10" style={{ minHeight: '140px' }}></div>
              );
              
              const dateKey = getDateKey(date);
              const dateAppointments = appointmentsByDate[dateKey] || [];
              const isToday = getDateKey(new Date()) === dateKey;
              const isWeekend = date.getDay() === 0 || date.getDay() === 6;

              return (
                <div 
                  key={dateKey} 
                  className={`calendar-cell p-2 position-relative ${isToday ? 'today-cell' : ''} ${isWeekend ? 'weekend-cell' : ''}`}
                  onClick={() => dateAppointments.length > 0 && setSelectedDateAppointments(dateAppointments)}
                >
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className={`date-number ${isToday ? 'active' : ''}`}>
                      {date.getDate()}
                    </span>
                    {dateAppointments.length > 0 && (
                      <span className="appt-count-indicator">
                        {dateAppointments.length}
                      </span>
                    )}
                  </div>
                  
                  <div className="appt-mini-cards-container custom-scrollbar">
                    {dateAppointments.map((app, appIdx) => (
                      <div key={appIdx} className="appt-mini-card shadow-sm border">
                        <div className="d-flex align-items-center gap-1 mb-1">
                          <i className="bi bi-person-fill text-primary" style={{ fontSize: '10px' }}></i>
                          <span className="doctor-name text-truncate">{app.doctor || 'Unassigned'}</span>
                        </div>
                        <div className="d-flex align-items-center gap-1 opacity-75">
                          <i className="bi bi-clock-fill" style={{ fontSize: '10px' }}></i>
                          <span className="time-slot">{app.timeSlot || 'Anytime'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modern Appointment Details Modal */}
      <Modal 
        isOpen={!!selectedDateAppointments} 
        onClose={() => setSelectedDateAppointments(null)}
        title={`Daily Schedule: ${selectedDateAppointments?.[0] ? new Date(selectedDateAppointments[0].appointmentDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : ''}`}
      >
        <div className="modal-content-scroll custom-scrollbar pe-2" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {selectedDateAppointments?.map((app, idx) => (
            <div key={idx} className="appointment-detail-card border rounded-4 p-4 mb-3 shadow-sm bg-white position-relative overflow-hidden">
              <div className="status-stripe" style={{ backgroundColor: app.status === 'Scheduled' ? '#00bf83' : '#007aff' }}></div>
              
              <div className="d-flex justify-content-between align-items-start mb-4">
                <div className="d-flex align-items-center gap-3">
                  <div className="patient-avatar bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px', fontSize: '1.2rem', fontWeight: 'bold' }}>
                    {app.patient.charAt(0)}
                  </div>
                  <div>
                    <h5 className="fw-bold mb-0">{app.patient}</h5>
                    <div className="d-flex align-items-center gap-2 mt-1">
                      <span className="badge rounded-pill bg-light text-dark border small">{app.type}</span>
                      <span className="text-muted small">•</span>
                      <span className="text-primary small fw-bold">{app.status}</span>
                    </div>
                  </div>
                </div>
                <div className="text-end">
                  <div className="d-flex align-items-center gap-2 justify-content-end text-primary fw-bold">
                    <i className="bi bi-clock"></i>
                    <span>{app.timeSlot}</span>
                  </div>
                </div>
              </div>
              
              <div className="row g-4 pt-3 border-top">
                <div className="col-md-6 col-lg-4">
                  <div className="detail-item">
                    <label className="detail-label">Assigned Physician</label>
                    <div className="detail-value d-flex align-items-center gap-2">
                      <i className="bi bi-person-badge text-muted"></i>
                      {app.doctor || 'TBD'}
                    </div>
                  </div>
                </div>
                <div className="col-md-6 col-lg-4">
                  <div className="detail-item">
                    <label className="detail-label">Specialty / Department</label>
                    <div className="detail-value d-flex align-items-center gap-2">
                      <i className="bi bi-building text-muted"></i>
                      {app.department || 'General Practice'}
                    </div>
                  </div>
                </div>
                <div className="col-md-6 col-lg-4">
                  <div className="detail-item">
                    <label className="detail-label">Demographics</label>
                    <div className="detail-value d-flex align-items-center gap-2 text-nowrap">
                      <i className="bi bi-info-circle text-muted"></i>
                      {app.patientAge || '—'} Yrs • {app.patientGender} • {app.bloodGroup || '—'}
                    </div>
                  </div>
                </div>
                <div className="col-md-6 col-lg-4">
                  <div className="detail-item">
                    <label className="detail-label">Date of Birth</label>
                    <div className="detail-value d-flex align-items-center gap-2">
                      <i className="bi bi-calendar3 text-muted"></i>
                      {app.patientDateOfBirth || '—'}
                    </div>
                  </div>
                </div>
                <div className="col-md-6 col-lg-4">
                  <div className="detail-item">
                    <label className="detail-label">Phone Number</label>
                    <div className="detail-value d-flex align-items-center gap-2">
                      <i className="bi bi-telephone text-muted"></i>
                      {app.phoneNumber || '—'}
                    </div>
                  </div>
                </div>
                <div className="col-md-6 col-lg-4">
                  <div className="detail-item">
                    <label className="detail-label">Email Address</label>
                    <div className="detail-value d-flex align-items-center gap-2 text-truncate">
                      <i className="bi bi-envelope text-muted"></i>
                      {app.patientEmail || '—'}
                    </div>
                  </div>
                </div>
                <div className="col-md-6 col-lg-4">
                  <div className="detail-item">
                    <label className="detail-label">Emergency Contact 1</label>
                    <div className="detail-value d-flex align-items-center gap-2">
                      <i className="bi bi-telephone-outbound text-muted"></i>
                      {app.emergencyContact || '—'}
                    </div>
                  </div>
                </div>
                <div className="col-md-6 col-lg-4">
                  <div className="detail-item">
                    <label className="detail-label">Emergency Contact 2</label>
                    <div className="detail-value d-flex align-items-center gap-2">
                      <i className="bi bi-telephone-outbound text-muted"></i>
                      {app.emergencyContact2 || '—'}
                    </div>
                  </div>
                </div>
                {app.patientAddress && (
                  <div className="col-12">
                    <div className="detail-item">
                      <label className="detail-label">Primary Address</label>
                      <div className="detail-value d-flex align-items-center gap-2">
                        <i className="bi bi-geo-alt text-muted"></i>
                        {app.patientAddress}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="d-flex gap-2 mt-4">
          <button className="btn btn-primary w-100 py-2 rounded-3 fw-bold" onClick={() => setSelectedDateAppointments(null)}>
            Dismiss Details
          </button>
        </div>
      </Modal>

      <style dangerouslySetInnerHTML={{ __html: `
        .calendar-grid-container > div {
          border-right: 1px solid #dee2e6;
          border-bottom: 1px solid #dee2e6;
        }
        /* Remove right border for every 7th element (last column) */
        .calendar-grid-container > div:nth-child(7n) {
          border-right: none !important;
        }
        .calendar-cell {
          min-height: 140px;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          background-color: #fff;
          cursor: pointer;
        }
        .calendar-cell:hover {
          background-color: var(--accents-1) !important;
          z-index: 2;
          box-shadow: inset 0 0 0 2px var(--bs-primary);
        }
        .empty-cell {
          cursor: default;
        }
        .empty-cell:hover {
          box-shadow: none !important;
          background-color: rgba(0,0,0,0.02) !important;
        }
        .weekend-cell {
          background-color: #fcfcfc;
        }
        .today-cell {
          background-color: rgba(var(--bs-primary-rgb), 0.03);
        }
        
        .date-number {
          font-weight: 800;
          font-size: 0.9rem;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          color: #1a1a1a;
          transition: all 0.2s;
        }
        .date-number.active {
          background-color: var(--bs-primary);
          color: #fff;
          box-shadow: 0 4px 12px rgba(var(--bs-primary-rgb), 0.3);
        }
        
        .appt-count-indicator {
          background-color: rgba(var(--bs-primary-rgb), 0.1);
          color: var(--bs-primary);
          padding: 2px 8px;
          border-radius: 6px;
          font-size: 0.7rem;
          font-weight: 700;
        }
        
        .appt-mini-cards-container {
          max-height: 100px;
          overflow-y: auto;
          padding-right: 2px;
        }
        
        .appt-mini-card {
          background: #fff;
          border-radius: 8px;
          padding: 6px 8px;
          margin-bottom: 6px;
          font-size: 0.7rem;
          line-height: 1.3;
          border-left: 3px solid var(--bs-primary) !important;
          transition: transform 0.1s;
        }
        .appt-mini-card:hover {
          transform: translateX(2px);
        }
        .doctor-name {
          font-weight: 700;
          color: #2d3748;
        }
        .time-slot {
          font-weight: 600;
          color: #718096;
        }
        
        .appointment-detail-card {
          border-color: #edf2f7 !important;
        }
        .status-stripe {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 6px;
        }
        .detail-label {
          display: block;
          font-size: 0.65rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #a0aec0;
          margin-bottom: 4px;
        }
        .detail-value {
          font-weight: 700;
          color: #2d3748;
          font-size: 0.9rem;
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0,0,0,0.1);
          border-radius: 10px;
        }

        @media (max-width: 768px) {
          .calendar-header-grid, .calendar-dates-grid {
            grid-template-columns: repeat(7, 1fr);
          }
          .calendar-cell {
            min-height: 100px;
            padding: 4px !important;
          }
          .date-number {
            width: 24px;
            height: 24px;
            font-size: 0.75rem;
          }
          .appt-mini-card {
            padding: 3px 5px;
            font-size: 0.6rem;
          }
          .doctor-name, .time-slot {
            display: none;
          }
          .appt-mini-card::after {
            content: '●';
            color: var(--bs-primary);
          }
        }
      `}} />
    </main>
  );
};

export default DoctorCalendar;
