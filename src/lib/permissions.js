export const ROLES = Object.freeze({
  ADMIN: 'Admin',
  DOCTOR: 'Doctor',
  NURSE: 'Nurse',
  RECEPTION: 'Reception',
  PATIENT: 'Patient',
});

export const MODULES = Object.freeze({
  COMMAND_CENTER: 'command_center',
  PATIENT_DIRECTORY: 'patient_directory',
  SCHEDULING: 'scheduling',
  MEDICAL_RECORDS: 'medical_records',
  REVENUE_CYCLE: 'revenue_cycle',
  PHARMACY: 'pharmacy',
  DIAGNOSTICS_LAB: 'diagnostics_lab',
  FACILITY_MANAGEMENT: 'facility_management',
  HUMAN_CAPITAL: 'human_capital',
  INTELLIGENCE: 'intelligence',
  HOSPITAL_LOGISTICS: 'hospital_logistics',
  EMERGENCY_BLOOD_BANK: 'emergency_blood_bank',
  ACCOUNT_SETTINGS: 'account_settings',
});

export const MODULE_PERMISSIONS = Object.freeze({
  [MODULES.COMMAND_CENTER]: [ROLES.ADMIN],
  [MODULES.PATIENT_DIRECTORY]: [ROLES.ADMIN, ROLES.DOCTOR, ROLES.NURSE, ROLES.PATIENT],
  [MODULES.SCHEDULING]: [ROLES.ADMIN, ROLES.PATIENT],
  [MODULES.MEDICAL_RECORDS]: [ROLES.ADMIN, ROLES.DOCTOR, ROLES.NURSE, ROLES.PATIENT],
  [MODULES.REVENUE_CYCLE]: [ROLES.ADMIN, ROLES.RECEPTION, ROLES.PATIENT],
  [MODULES.PHARMACY]: [ROLES.ADMIN, ROLES.RECEPTION],
  [MODULES.DIAGNOSTICS_LAB]: [ROLES.ADMIN, ROLES.DOCTOR, ROLES.NURSE, ROLES.PATIENT],
  [MODULES.FACILITY_MANAGEMENT]: [ROLES.ADMIN, ROLES.NURSE],
  [MODULES.HUMAN_CAPITAL]: [ROLES.ADMIN],
  [MODULES.INTELLIGENCE]: [ROLES.ADMIN],
  [MODULES.HOSPITAL_LOGISTICS]: [ROLES.ADMIN, ROLES.RECEPTION],
  [MODULES.EMERGENCY_BLOOD_BANK]: [ROLES.ADMIN, ROLES.DOCTOR, ROLES.NURSE, ROLES.RECEPTION],
  [MODULES.ACCOUNT_SETTINGS]: Object.values(ROLES),
});

export const RESOURCE_PERMISSIONS = MODULE_PERMISSIONS;

export const ROUTE_MODULES = Object.freeze({
  '/dashboard': MODULES.COMMAND_CENTER,
  '/patients': MODULES.PATIENT_DIRECTORY,
  '/appointments': MODULES.SCHEDULING,
  '/emr': MODULES.MEDICAL_RECORDS,
  '/billing': MODULES.REVENUE_CYCLE,
  '/pharmacy': MODULES.PHARMACY,
  '/lab': MODULES.DIAGNOSTICS_LAB,
  '/beds': MODULES.FACILITY_MANAGEMENT,
  '/staff': MODULES.HUMAN_CAPITAL,
  '/reports': MODULES.INTELLIGENCE,
  '/inventory': MODULES.HOSPITAL_LOGISTICS,
  '/blood-bank': MODULES.EMERGENCY_BLOOD_BANK,
  '/settings': MODULES.ACCOUNT_SETTINGS,
});

export const getAllowedRoles = (moduleName) => MODULE_PERMISSIONS[moduleName] || [];

export const isAuthorized = (userRole, moduleName) => {
  if (!userRole || !moduleName) return false;
  return getAllowedRoles(moduleName).some(
    (role) => role.toLowerCase() === userRole.toLowerCase()
  );
};
