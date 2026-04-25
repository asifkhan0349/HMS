/**
 * Centralized Role-Permission Mapping
 * Defines which roles have access to which resource/module
 */

export const RESOURCE_PERMISSIONS = {
  dashboard: ['Admin'],
  patients: ['Admin', 'Doctor', 'Nurse', 'Patient'],
  appointments: ['Admin'],
  emr: ['Admin', 'Doctor', 'Nurse', 'Patient'],
  billing: ['Admin', 'Reception', 'Patient'],
  pharmacy: ['Admin', 'Reception'],
  lab: ['Admin', 'Doctor', 'Nurse', 'Patient'],
  beds: ['Admin', 'Nurse'],
  staff: ['Admin'],
  reports: ['Admin'],
  inventory: ['Admin', 'Reception'],
  blood_bank: ['Admin', 'Reception'],
  settings: ['Admin', 'Reception'],
};

/**
 * Check if a user role is authorized for a specific resource
 * @param {string} userRole 
 * @param {string} resourceName 
 * @returns {boolean}
 */
export const isAuthorized = (userRole, resourceName) => {
  if (!userRole || !resourceName) return false;
  const allowedRoles = RESOURCE_PERMISSIONS[resourceName] || [];
  return allowedRoles.some(role => role.toLowerCase() === userRole.toLowerCase());
};
