import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { authApi } from '../lib/api';

const Settings = () => {
  const { user, showToast, setUser } = useApp();
  
  // Personal Info State
  const [profileData, setProfileData] = useState({
    fullName: '',
    username: '',
    email: '',
  });
  const [isProfileUpdating, setIsProfileUpdating] = useState(false);

  // Security State
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
   const [isPasswordUpdating, setIsPasswordUpdating] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    if (user) {
      setProfileData({
        fullName: user.name || '',
        username: user.username || '',
        email: user.email || '',
      });
    }
  }, [user]);

  const calculateStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    if (/[^A-Za-z0-9]/.test(password)) strength += 25;
    setPasswordStrength(strength);
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({ ...passwordData, [name]: value });
    if (name === 'newPassword') {
      calculateStrength(value);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!profileData.fullName.trim()) errors.fullName = true;
    if (!profileData.username.trim()) errors.username = true;
    if (!profileData.email.trim()) errors.email = true;

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      showToast('Please fill in all mandatory fields highlighted in red.', 'warning');
      return;
    }
    setValidationErrors({});

    setIsProfileUpdating(true);
    try {
      console.log('Calling authApi.updateProfile with:', {
        full_name: profileData.fullName,
        username: profileData.username,
        email: profileData.email,
      });
      const response = await authApi.updateProfile({
        full_name: profileData.fullName,
        username: profileData.username,
        email: profileData.email,
      });
      console.log('Update profile response:', response);
      
      const updatedUser = {
        ...user,
        id: response.user.id,
        name: response.user.full_name,
        username: response.user.username,
        email: response.user.email,
      };
      
      sessionStorage.setItem('hms_token', response.token);
      sessionStorage.setItem('hms_user_data', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      showToast('Profile updated successfully.', 'success');
    } catch (error) {
      showToast(error.message || 'Failed to update profile.', 'error');
    } finally {
      setIsProfileUpdating(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!passwordData.currentPassword) errors.currentPassword = true;
    if (!passwordData.newPassword) errors.newPassword = true;
    if (!passwordData.confirmPassword) errors.confirmPassword = true;

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      showToast('Please fill in all mandatory fields highlighted in red.', 'warning');
      return;
    }
    setValidationErrors({});

    if (passwordData.newPassword !== passwordData.confirmPassword) {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast('New passwords do not match.', 'error');
      return;
    }
    if (passwordData.newPassword.length < 8) {
      showToast('New password must be at least 8 characters.', 'warning');
      return;
    }

    setIsPasswordUpdating(true);
    try {
      await authApi.changePassword({
        current_password: passwordData.currentPassword,
        new_password: passwordData.newPassword,
      });
      showToast('Password updated successfully.', 'success');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordStrength(0);
    } catch (error) {
      showToast(error.message || 'Failed to change password.', 'error');
    } finally {
      setIsPasswordUpdating(false);
    }
  };

  return (
    <div className="settings-page animate-fade-in">
      <div className="mb-5">
        <div className="d-flex align-items-center mb-2">
           <div className="bg-primary bg-opacity-10 text-primary rounded-pill px-3 py-1 small fw-bold text-uppercase mb-2" style={{ letterSpacing: '1px' }}>
             Control Panel
           </div>
        </div>
        <h1 className="fw-black display-5 mb-2">Account Settings</h1>
        <p className="text-muted fs-5">Configure your profile details and security preferences.</p>
      </div>

      <div className="row g-5">
        {/* Profile Section */}
        <div className="col-xl-7">
          <div className="glass-card p-5 border-0 shadow-sm position-relative overflow-hidden h-100" style={{ background: 'var(--geist-background)', borderRadius: '24px' }}>
            <div className="position-absolute top-0 end-0 p-4 opacity-10">
              <i className="bi bi-person-gear display-1"></i>
            </div>
            
            <div className="d-flex align-items-center mb-5">
              <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-4 shadow-lg" style={{ width: '64px', height: '64px' }}>
                <i className="bi bi-person-vcard fs-2"></i>
              </div>
              <div>
                <h3 className="fw-bold mb-1">Personal Information</h3>
                <p className="text-muted mb-0">Update your public profile information</p>
              </div>
            </div>

            <form onSubmit={handleProfileSubmit} className="position-relative">
              <div className="row g-4">
                <div className="col-md-12">
                  <div className="form-floating mb-3">
                    <input
                      type="text"
                      className={`form-control border-0 bg-light px-4 pt-4 pb-2 fs-5 fw-medium ${validationErrors.fullName ? 'is-invalid' : ''}`}
                      id="fullName"
                      placeholder="John Doe"
                      value={profileData.fullName}
                      onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                      disabled={isProfileUpdating}
                      style={{ borderRadius: '16px', height: '70px' }}
                    />
                    <label htmlFor="fullName" className="px-4 text-muted small fw-bold text-uppercase required-label">Full Name</label>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="form-floating mb-3">
                    <input
                      type="text"
                      className={`form-control border-0 bg-light px-4 pt-4 pb-2 fs-5 fw-medium ${validationErrors.username ? 'is-invalid' : ''}`}
                      id="username"
                      placeholder="username"
                      value={profileData.username}
                      onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                      disabled={isProfileUpdating}
                      style={{ borderRadius: '16px', height: '70px' }}
                    />
                    <label htmlFor="username" className="px-4 text-muted small fw-bold text-uppercase required-label">Username</label>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="form-floating mb-3">
                    <input
                      type="email"
                      className={`form-control border-0 bg-light px-4 pt-4 pb-2 fs-5 fw-medium ${validationErrors.email ? 'is-invalid' : ''}`}
                      id="email"
                      placeholder="name@example.com"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      disabled={isProfileUpdating}
                      style={{ borderRadius: '16px', height: '70px' }}
                    />
                    <label htmlFor="email" className="px-4 text-muted small fw-bold text-uppercase required-label">Email Address</label>
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <button 
                  type="submit" 
                  className="btn btn-primary d-flex align-items-center justify-content-center px-5 py-3 shadow-lg"
                  disabled={isProfileUpdating}
                  style={{ borderRadius: '16px', minWidth: '220px' }}
                >
                  {isProfileUpdating ? (
                    <span className="spinner-border spinner-border-sm me-2"></span>
                  ) : (
                    <i className="bi bi-cloud-arrow-up-fill me-2 fs-5"></i>
                  )}
                  <span className="fw-bold">Save Profile Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Security Section */}
        <div className="col-xl-5">
          <div className="glass-card p-5 border-0 shadow-sm h-100" style={{ background: 'var(--geist-background)', borderRadius: '24px' }}>
            <div className="d-flex align-items-center mb-5">
              <div className="bg-warning text-white rounded-circle d-flex align-items-center justify-content-center me-4 shadow-lg" style={{ width: '64px', height: '64px' }}>
                <i className="bi bi-shield-lock-fill fs-2"></i>
              </div>
              <div>
                <h3 className="fw-bold mb-1">Security</h3>
                <p className="text-muted mb-0">Manage your access credentials</p>
              </div>
            </div>

            <form onSubmit={handlePasswordSubmit}>
              <div className="mb-4">
                <label className="form-label small fw-bold text-muted text-uppercase mb-3 px-1 required-label">Current Password</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-0 px-3" style={{ borderTopLeftRadius: '14px', borderBottomLeftRadius: '14px' }}>
                    <i className="bi bi-key-fill text-muted"></i>
                  </span>
                  <input
                    type="password"
                    name="currentPassword"
                    className={`form-control border-0 bg-light py-3 px-3 ${validationErrors.currentPassword ? 'is-invalid' : ''}`}
                    placeholder="Enter current password"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    disabled={isPasswordUpdating}
                    style={{ borderTopRightRadius: '14px', borderBottomRightRadius: '14px' }}
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label small fw-bold text-muted text-uppercase mb-3 px-1 required-label">New Password</label>
                <div className="input-group mb-2">
                  <span className="input-group-text bg-light border-0 px-3" style={{ borderTopLeftRadius: '14px', borderBottomLeftRadius: '14px' }}>
                    <i className="bi bi-shield-plus text-muted"></i>
                  </span>
                  <input
                    type="password"
                    name="newPassword"
                    className={`form-control border-0 bg-light py-3 px-3 ${validationErrors.newPassword ? 'is-invalid' : ''}`}
                    placeholder="Min. 8 characters"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    disabled={isPasswordUpdating}
                    style={{ borderTopRightRadius: '14px', borderBottomRightRadius: '14px' }}
                  />
                </div>
                {/* Strength Meter */}
                {passwordData.newPassword && (
                  <div className="px-1 mt-3">
                    <div className="progress" style={{ height: '6px', borderRadius: '3px' }}>
                      <div 
                        className={`progress-bar ${passwordStrength < 50 ? 'bg-danger' : passwordStrength < 100 ? 'bg-warning' : 'bg-success'}`} 
                        role="progressbar" 
                        style={{ width: `${passwordStrength}%`, transition: 'width 0.3s ease' }}
                      ></div>
                    </div>
                    <div className="d-flex justify-content-between mt-2">
                      <small className="text-muted" style={{ fontSize: '0.7rem' }}>Security Strength</small>
                      <small className="fw-bold text-uppercase" style={{ fontSize: '0.7rem', color: passwordStrength === 100 ? 'var(--geist-success)' : 'inherit' }}>
                        {passwordStrength < 50 ? 'Weak' : passwordStrength < 100 ? 'Medium' : 'Strong'}
                      </small>
                    </div>
                  </div>
                )}
              </div>

              <div className="mb-5">
                <label className="form-label small fw-bold text-muted text-uppercase mb-3 px-1 required-label">Confirm New Password</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-0 px-3" style={{ borderTopLeftRadius: '14px', borderBottomLeftRadius: '14px' }}>
                    <i className="bi bi-check2-all text-muted"></i>
                  </span>
                  <input
                    type="password"
                    name="confirmPassword"
                    className={`form-control border-0 bg-light py-3 px-3 ${validationErrors.confirmPassword ? 'is-invalid' : ''}`}
                    placeholder="Repeat new password"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    disabled={isPasswordUpdating}
                    style={{ borderTopRightRadius: '14px', borderBottomRightRadius: '14px' }}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="btn btn-warning w-100 py-3 d-flex align-items-center justify-content-center shadow-lg text-white"
                disabled={isPasswordUpdating}
                style={{ borderRadius: '16px', fontWeight: '700' }}
              >
                {isPasswordUpdating ? (
                  <span className="spinner-border spinner-border-sm me-2"></span>
                ) : (
                  <i className="bi bi-shield-fill-check me-2 fs-5"></i>
                )}
                Update Credentials
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="mt-5 p-4 border border-info border-opacity-10 bg-info bg-opacity-5 rounded-4 d-flex align-items-center">
        <div className="bg-info text-white rounded-circle p-2 me-4">
          <i className="bi bi-info-circle-fill"></i>
        </div>
        <div className="small text-muted">
          <strong>Security Note:</strong> Changing your password will not end your current session, but it is recommended to use a unique password for this application. Password changes are permanent.
        </div>
      </div>
    </div>
  );
};

export default Settings;
