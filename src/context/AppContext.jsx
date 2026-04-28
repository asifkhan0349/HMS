import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../lib/api';

const AppContext = createContext();

const formatDate = (value, options = { day: '2-digit', month: 'short', year: 'numeric' }) => {
  if (!value) {
    return '-';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-GB', options).format(parsed);
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

export const createCode = (prefix) => `${prefix}-${Date.now().toString().slice(-6)}`;

export const mapPatientFromApi = (patient) => ({
  id: patient.id,
  patientCode: patient.patient_code,
  apiId: patient.id,
  name: patient.name,
  age: patient.age,
  gender: patient.gender,
  bloodGroup: patient.blood_group,
  lastVisit: formatDate(patient.last_visit),
  rawLastVisit: patient.last_visit ? patient.last_visit.split('T')[0] : '',
  status: patient.status,
});

export const mapAppointmentFromApi = (appointment) => ({
  id: appointment.id,
  apiId: appointment.id,
  patient: appointment.patient_name,
  patientDateOfBirth: appointment.patient_date_of_birth || '',
  patientAge: appointment.patient_age ?? '',
  patientGender: appointment.patient_gender || 'Male',
  patientAddress: appointment.patient_address || '',
  appointmentDate: appointment.appointment_date,
  type: appointment.appointment_type,
  status: appointment.status,
  phoneNumber: appointment.phone_number || '',
  timeSlot: appointment.time_slot || '',
  department: appointment.department || '',
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
});

export const mapInvoiceFromApi = (invoice) => ({
  id: invoice.invoice_code,
  apiId: invoice.id,
  patient: invoice.patient_name,
  date: formatDate(invoice.invoice_date),
  rawDate: invoice.invoice_date ? invoice.invoice_date.split('T')[0] : '',
  amount: formatCurrency(invoice.amount),
  amountValue: Number(invoice.amount),
  status: invoice.status,
  method: invoice.payment_method,
});

export const mapMedicineFromApi = (medicine) => ({
  id: medicine.medicine_code,
  apiId: medicine.id,
  name: medicine.name,
  batch: medicine.batch,
  stock: medicine.stock,
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
});

export const mapBedFromApi = (bed) => ({
  id: bed.bed_number,
  apiId: bed.id,
  ward: bed.ward_name,
  type: bed.type,
  status: bed.status,
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
  const navigate = useNavigate();

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
