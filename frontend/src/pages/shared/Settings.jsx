import React, { useState, useEffect } from 'react';
import Icon from '../../components/common/Icon';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';

export default function Settings() {
  const { user, logout } = useAuth();

  const [notifyEmail, setNotifyEmail] = useState(() => localStorage.getItem('settings_notify_email') !== 'false');
  const [notifySms, setNotifySms] = useState(() => localStorage.getItem('settings_notify_sms') === 'true');
  const [compactView, setCompactView] = useState(() => localStorage.getItem('settings_compact_view') === 'true');

  const [displayName, setDisplayName] = useState(user?.name || '');
  const [saveMsg, setSaveMsg] = useState('');

  const [cpCurrent, setCpCurrent] = useState('');
  const [cpNew, setCpNew] = useState('');
  const [cpConfirm, setCpConfirm] = useState('');
  const [cpMsg, setCpMsg] = useState('');
  const [cpError, setCpError] = useState('');
  const [cpLoading, setCpLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem('settings_notify_email', notifyEmail);
    localStorage.setItem('settings_notify_sms', notifySms);
    localStorage.setItem('settings_compact_view', compactView);
    if (compactView) {
      document.body.classList.add('compact-view');
    } else {
      document.body.classList.remove('compact-view');
    }
  }, [notifyEmail, notifySms, compactView]);

  const handleSaveProfile = () => {
    if (displayName.trim() && displayName !== user?.name) {
      localStorage.setItem('edutrack_name', displayName.trim());
    }
    setSaveMsg('Settings saved');
    setTimeout(() => setSaveMsg(''), 2500);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setCpMsg('');
    setCpError('');

    if (cpNew.length < 6) {
      setCpError('New password must be at least 6 characters');
      return;
    }
    if (cpNew !== cpConfirm) {
      setCpError('Passwords do not match');
      return;
    }

    setCpLoading(true);
    try {
      const res = await api.put('/auth/change-password', {
        currentPassword: cpCurrent,
        newPassword: cpNew,
      });
      setCpMsg(res.data?.message || 'Password updated successfully');
      setCpCurrent('');
      setCpNew('');
      setCpConfirm('');
    } catch (err) {
      setCpError(err.response?.data?.message || err.message || 'Failed to update password');
    } finally {
      setCpLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-header">Settings</h1>
        <p className="page-subtitle">Manage your account, security, and preferences.</p>
      </div>

      <div className="card p-6">
        <h3 className="text-title-md text-on-surface mb-4 flex items-center gap-2">
          <Icon name="person" size={20} className="text-primary" />
          Profile
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-body-md text-on-surface font-medium mb-1">Name</label>
            <input
              type="text"
              className="input-field"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-body-md text-on-surface font-medium mb-1">Email</label>
            <input
              type="text"
              className="input-field bg-surface-container-low text-on-surface-variant"
              value={user?.email || ''}
              readOnly
            />
          </div>
          <div>
            <label className="block text-body-md text-on-surface font-medium mb-1">Role</label>
            <input
              type="text"
              className="input-field bg-surface-container-low text-on-surface-variant capitalize"
              value={user?.role || ''}
              readOnly
            />
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button onClick={handleSaveProfile} className="btn-primary">
            <Icon name="save" size={18} />
            Save Profile
          </button>
        </div>
        {saveMsg && (
          <p className="text-emerald-600 text-body-sm mt-2 flex items-center gap-1">
            <Icon name="check_circle" size={16} /> {saveMsg}
          </p>
        )}
      </div>

      <div className="card p-6">
        <h3 className="text-title-md text-on-surface mb-4 flex items-center gap-2">
          <Icon name="lock" size={20} className="text-primary" />
          Change Password
        </h3>

        <form onSubmit={handleChangePassword} className="max-w-md space-y-4">
          <div>
            <label className="block text-body-md text-on-surface font-medium mb-1">Current Password</label>
            <input
              type="password"
              className="input-field"
              placeholder="Enter current password"
              value={cpCurrent}
              onChange={e => setCpCurrent(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-body-md text-on-surface font-medium mb-1">New Password</label>
            <input
              type="password"
              className="input-field"
              placeholder="At least 6 characters"
              value={cpNew}
              onChange={e => setCpNew(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <div>
            <label className="block text-body-md text-on-surface font-medium mb-1">Confirm New Password</label>
            <input
              type="password"
              className="input-field"
              placeholder="Re-enter new password"
              value={cpConfirm}
              onChange={e => setCpConfirm(e.target.value)}
              required
            />
          </div>

          {cpError && (
            <p className="text-error text-body-sm flex items-center gap-1">
              <Icon name="error" size={16} /> {cpError}
            </p>
          )}
          {cpMsg && (
            <p className="text-emerald-600 text-body-sm flex items-center gap-1">
              <Icon name="check_circle" size={16} /> {cpMsg}
            </p>
          )}

          <div className="flex justify-end pt-2">
            <button type="submit" className="btn-primary min-w-[140px] justify-center" disabled={cpLoading}>
              {cpLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Updating...
                </span>
              ) : 'Update Password'}
            </button>
          </div>
        </form>
      </div>

      <div className="card p-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-title-md text-on-surface mb-4 flex items-center gap-2">
              <Icon name="notifications" size={20} className="text-primary" />
              Notification Preferences
            </h3>
            <div className="space-y-4 pl-7">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-body-md text-on-surface">Email Notifications</span>
                <input type="checkbox" className="toggle-checkbox" checked={notifyEmail} onChange={e => setNotifyEmail(e.target.checked)} />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-body-md text-on-surface">SMS Alerts</span>
                <input type="checkbox" className="toggle-checkbox" checked={notifySms} onChange={e => setNotifySms(e.target.checked)} />
              </label>
            </div>
          </div>

          <div className="border-t border-outline-variant/20 my-2" />

          <div>
            <h3 className="text-title-md text-on-surface mb-4 flex items-center gap-2">
              <Icon name="palette" size={20} className="text-primary" />
              Appearance
            </h3>
            <div className="space-y-4 pl-7">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-body-md text-on-surface">Compact View</span>
                <input type="checkbox" className="toggle-checkbox" checked={compactView} onChange={e => setCompactView(e.target.checked)} />
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-title-md text-on-surface mb-4 flex items-center gap-2">
          <Icon name="info" size={20} className="text-primary" />
          Account
        </h3>
        <div className="space-y-2 pl-7 text-body-md text-on-surface-variant">
          <p>Logged in as <span className="font-medium text-on-surface capitalize">{user?.role}</span></p>
          <p>Email: <span className="font-medium text-on-surface">{user?.email}</span></p>
        </div>
      </div>
    </div>
  );
}
