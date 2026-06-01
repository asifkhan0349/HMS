import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../lib/api';

const AppContext = createContext();
const WS_RECONNECT_DELAY_MS = 2000;
const WS_HEARTBEAT_MS = 30000;

const getWebSocketUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL || '/api';

  if (apiUrl.startsWith('http://') || apiUrl.startsWith('https://')) {
    return apiUrl
      .replace(/^http/, 'ws')
      .replace(/\/api\/?$/, '/api/ws');
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/api/ws`;
};

export const formatDate = (value, options = { day: '2-digit', month: 'short', year: 'numeric' }) => {
  if (!value) {
    return '-';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  const formatOptions = { ...options };
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    formatOptions.timeZone = 'UTC';
  }

  return new Intl.DateTimeFormat('en-GB', formatOptions).format(parsed);
};


const formatTime = (value) => {
  if (!value) {
    return '-';
  }

  // Ensure string has timezone indicator to avoid naive local interpretation
  let timeStr = value;
  if (typeof timeStr === 'string' && !timeStr.includes('Z') && !timeStr.includes('+')) {
    timeStr = `${timeStr}Z`;
  }

  const parsed = new Date(timeStr);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(parsed);
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));

const toIsoDate = (value) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }
  return parsed.toISOString().slice(0, 10);
};

export const parseDisplayMonth = (value) => {
  const parsed = new Date(`01 ${value}`);
  if (Number.isNaN(parsed.getTime())) {
    const fallback = new Date();
    fallback.setMonth(fallback.getMonth() + 12);
    return fallback.toISOString().slice(0, 10);
  }
  return parsed.toISOString().slice(0, 10);
};

export const parseDisplayTime = (value, baseDate = null) => {
  if (!value) {
    return new Date().toISOString();
  }

  const match = value.trim().match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
  const now = baseDate ? new Date(baseDate) : new Date();
  
  if (!match) {
    return now.toISOString();
  }

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3]?.toUpperCase();

  if (meridiem && hours <= 12) {
    if (meridiem === 'PM' && hours !== 12) {
      hours += 12;
    }
    if (meridiem === 'AM' && hours === 12) {
      hours = 0;
    }
  }

  const parsed = new Date(now);
  parsed.setHours(Math.min(hours, 23), minutes, 0, 0);
  return parsed.toISOString();
};

export const createCode = () => ''; // Backend handles sequential ID generation

export const mapPatientFromApi = (patient) => ({
  id: patient.id,
  patientCode: patient.patient_code,
  apiId: patient.id,
  name: patient.name,
  age: patient.age,
  gender: patient.gender,
  bloodGroup: patient.blood_group,
  phoneNumber: patient.phone_number || '',
  email: patient.email || '',
  emergencyContact1: patient.emergency_contact_1 || '',
  emergencyContact2: patient.emergency_contact_2 || '',
  lastVisit: formatDate(patient.last_visit),
  rawLastVisit: patient.last_visit ? patient.last_visit.split('T')[0] : '',
  status: patient.status,
  bookingId: patient.booking_id || '',
  address: patient.address || '',
  doctorName: patient.doctor_name || '',
  appointmentDate: formatDate(patient.appointment_date),
  rawAppointmentDate: patient.appointment_date ? patient.appointment_date.split('T')[0] : '',
});

export const mapAppointmentFromApi = (appointment) => ({
  id: appointment.id,
  apiId: appointment.id,
  appointmentId: appointment.booking_id || '',
  appointmentCode: appointment.appointment_code || '',
  patient: appointment.patient_name,
  patientDateOfBirth: appointment.patient_date_of_birth || '',
  patientAge: appointment.patient_age ?? '',
  patientGender: appointment.patient_gender || 'Male',
  patientAddress: appointment.patient_address || '',
  appointmentDate: appointment.appointment_date,
  type: appointment.appointment_type,
  status: appointment.status,
  phoneNumber: appointment.phone_number || '',
  patientEmail: appointment.patient_email || '',
  bloodGroup: appointment.blood_group || '',
  emergencyContact: appointment.emergency_contact || '',
  emergencyContact2: appointment.emergency_contact_2 || '',
  timeSlot: appointment.time_slot || '',
  department: appointment.department || '',
  doctor: appointment.doctor_name || '',
  doctorId: appointment.doctor_id || '',
  scheduledLaterReason: appointment.scheduled_later_reason || '',
  symptoms: appointment.symptoms || '',
});

export const mapRecordFromApi = (record) => ({
  id: record.record_code,
  apiId: record.id,
  clinicalId: record.clinical_id,
  date: formatDate(record.record_date),
  rawDate: record.record_date ? record.record_date.split('T')[0] : '',
  patient: record.patient_name,
  doctor: record.doctor_name,
  diagnosis: record.diagnosis,
  prescription: record.prescription,
  description: record.description || '',
});

export const mapInvoiceFromApi = (invoice) => ({
  id: invoice.invoice_code,
  apiId: invoice.id,
  patient: invoice.patient_name,
  date: formatDate(invoice.invoice_date),
  rawDate: invoice.invoice_date ? invoice.invoice_date.split('T')[0] : '',
  amount: formatCurrency(invoice.amount),
  amountValue: Number(invoice.amount),
  amountPaid: Number(invoice.amount_paid || 0),
  dueAmount: Number(invoice.due_amount || 0),
  taxTotal: Number(invoice.tax_total || 0),
  discountTotal: Number(invoice.discount_total || 0),
  cgst: Number(invoice.cgst || 0),
  sgst: Number(invoice.sgst || 0),
  igst: Number(invoice.igst || 0),
  status: invoice.status,
  paymentStatus: invoice.payment_status,
  method: invoice.payment_method,
  billingType: invoice.billing_type,
  insuranceProvider: invoice.insurance_provider || '',
  expectedPaymentDate: invoice.expected_payment_date ? invoice.expected_payment_date.split('T')[0] : '',
});

export const mapMedicineFromApi = (medicine) => ({
  id: medicine.medicine_code,
  apiId: medicine.id,
  name: medicine.name,
  batch: medicine.batch,
  stock: medicine.stock,
  price: formatCurrency(medicine.price ?? 0),
  priceValue: Number(medicine.price ?? 0),
  expiry: formatDate(medicine.expiry_date, { month: 'short', year: 'numeric' }),
  rawExpiry: medicine.expiry_date ? medicine.expiry_date.split('T')[0] : '',
  status: medicine.status,
});

export const mapTestFromApi = (test) => ({
  id: test.test_code,
  apiId: test.id,
  patient: test.patient_name,
  test: test.test_name,
  doctor: test.doctor_name,
  status: test.status,
});

export const mapStaffFromApi = (staffMember) => ({
  id: staffMember.staff_code,
  apiId: staffMember.id,
  name: staffMember.name,
  role: staffMember.role,
  dept: staffMember.department,
  shift: staffMember.shift,
  status: staffMember.status,
  userStaffId: staffMember.user_staff_id || null,  // Linked doctor user's staff_id for appointment filtering
});

export const mapBedFromApi = (bed) => ({
  id: bed.bed_number,
  apiId: bed.id,
  ward: bed.ward_name,
  type: bed.type,
  status: bed.status,
  patientName: bed.patient_name || '',
  allotmentReason: bed.allotment_reason || '',
});

export const mapAmbulanceFromApi = (amb) => ({
  id: amb.ambulance_code,
  apiId: amb.id,
  vehicleNumber: amb.vehicle_number,
  type: amb.type,
  status: amb.status,
  driverName: amb.driver_name || '',
  driverContact: amb.driver_contact || '',
  paramedicName: amb.paramedic_name || '',
  equipmentChecklist: amb.equipment_checklist || '',
  currentTripPatient: amb.current_trip_patient || '',
  currentTripDestination: amb.current_trip_destination || '',
});


export const mapBloodGroupFromApi = (bg) => ({
  id: bg.blood_group,
  apiId: bg.id,
  type: bg.blood_group,
  units: bg.units,
  status: bg.status,
  trend: bg.trend,
});

export const mapActivityFromApi = (act) => ({
  id: act.id,
  apiId: act.id,
  type: act.type,
  group: act.blood_group,
  units: act.units,
  donor: act.donor_name,
  hospital: act.donor_name,
  date: formatDate(act.date),
  rawDate: act.date ? act.date.split('T')[0] : '',
  sampleId: act.sample_id || '',
});

export const mapInventoryFromApi = (inv) => ({
  id: inv.item_code,
  apiId: inv.id,
  name: inv.name,
  category: inv.category,
  stock: inv.stock,
  unit: inv.unit,
  status: inv.status,
});

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = sessionStorage.getItem('hms_user_data');
      if (savedUser) {
        return JSON.parse(savedUser);
      }
      return null;
    } catch {
      return null;
    }
  });

  const [notifications, setNotifications] = useState([]);
  const [theme, setTheme] = useState(() => localStorage.getItem('hms_theme') || 'light');
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [globalRefreshTime, setGlobalRefreshTime] = useState(() => Date.now());
  const navigate = useNavigate();

  useEffect(() => {
    if (!user?.id) {
      return undefined;
    }

    let ws;
    let reconnectTimeout;
    let heartbeatInterval;
    let disposed = false;

    const clearTimers = () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
      }
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
      }
    };

    const connectWebSocket = () => {
      clearTimers();
      ws = new WebSocket(getWebSocketUrl());

      ws.onopen = () => {
        heartbeatInterval = setInterval(() => {
          if (ws?.readyState === WebSocket.OPEN) {
            ws.send('ping');
          }
        }, WS_HEARTBEAT_MS);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.event === 'data_updated') {
            setGlobalRefreshTime(Date.now());
          }
        } catch (e) {
          console.error('WebSocket message parse error:', e);
        }
      };

      ws.onclose = () => {
        clearTimers();
        if (!disposed) {
          reconnectTimeout = setTimeout(connectWebSocket, WS_RECONNECT_DELAY_MS);
        }
      };

      ws.onerror = () => {
        if (ws?.readyState === WebSocket.OPEN || ws?.readyState === WebSocket.CONNECTING) {
          ws.close();
        }
      };
    };

    connectWebSocket();

    return () => {
      disposed = true;
      clearTimers();
      if (ws) ws.close();
    };
  }, [user?.id]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('hms_theme', theme);
  }, [theme]);

  useEffect(() => {
    let active = true;

    if (!user?.id) {
      setIsAppLoading(false);
      return () => {
        active = false;
      };
    }

    setIsAppLoading(true);

    const checkAuth = async () => {
      // Simulate quick auth check
      setTimeout(() => {
        if (active) {
          setIsAppLoading(false);
        }
      }, 300);
    };

    checkAuth();

    return () => {
      active = false;
    };
  }, [user]);

  const toggleTheme = () => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));

  const persistUser = (apiUser, token) => {
    const normalizedUser = {
      id: apiUser.id,
      name: apiUser.full_name,
      username: apiUser.username,
      email: apiUser.email,
      role: apiUser.role,
      staff_id: apiUser.staff_id,
    };
    // Store the signed JWT for use in Authorization: Bearer headers
    sessionStorage.setItem('hms_token', token);
    sessionStorage.setItem('hms_user_data', JSON.stringify(normalizedUser));
    setUser(normalizedUser);
    return normalizedUser;
  };

  const login = async (username, password) => {
    const response = await authApi.login({ username, password });
    return persistUser(response.user, response.token);
  };

  const signup = async ({ fullName, username, email, password, role }) => {
    const response = await authApi.signup({
      full_name: fullName,
      username,
      email,
      password,
      role,
    });
    return persistUser(response.user, response.token);
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('hms_token');
    sessionStorage.removeItem('hms_user_data');
    window.location.href = '/';
  };

  const showToast = React.useCallback((message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const triggerGlobalRefresh = React.useCallback(() => {
    setGlobalRefreshTime(Date.now());
  }, []);

  const value = {
    user,
    setUser,
    login,
    signup,
    logout,
    theme,
    setTheme,
    toggleTheme,
    notifications,
    setNotifications,
    toast,
    showToast,
    isAppLoading,
    globalRefreshTime,
    triggerGlobalRefresh,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
