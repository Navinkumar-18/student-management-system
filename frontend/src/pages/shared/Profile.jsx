import React, { useState, useEffect } from 'react';
import Icon from '../../components/common/Icon';

export default function Profile() {
  const role = localStorage.getItem('edutrack_role') || 'User';
  const userEmail = localStorage.getItem('edutrack_email') || 'user@edutrack.pro';
  const userName = localStorage.getItem('edutrack_name') || `${role} User`;
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  const currentDate = new Date();
  const currentMonthYear = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Load initial data from localStorage or use defaults
  const [profileData, setProfileData] = useState(() => {
    const savedData = localStorage.getItem(`profileData_${userEmail}`);
    if (savedData) {
      return JSON.parse(savedData);
    }
    return {
      name: userName,
      phone: '+91 98765 43210',
      email: userEmail,
      dateJoined: currentMonthYear
    };
  });

  const handleSaveProfile = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const updatedData = {
      ...profileData,
      name: formData.get('name'),
      phone: formData.get('phone'),
      email: formData.get('email'),
    };
    setProfileData(updatedData);
    localStorage.setItem(`profileData_${userEmail}`, JSON.stringify(updatedData));
    localStorage.setItem('edutrack_name', updatedData.name);
    localStorage.setItem('edutrack_email', updatedData.email);
    setIsEditing(false);
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    setIsChangingPassword(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-header">My Profile</h1>
        <p className="page-subtitle">View and manage your personal information.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 md:col-span-1 flex flex-col items-center text-center">
          <div className="w-32 h-32 rounded-full bg-primary-container/20 flex items-center justify-center text-primary-container text-4xl font-bold mb-4">
            <Icon name="person" size={64} />
          </div>
          <h2 className="text-title-lg text-on-surface font-semibold capitalize">{profileData.name}</h2>
          <p className="text-body-md text-on-surface-variant capitalize">{role}</p>
          <div className="w-full mt-6 space-y-3">
            <button 
              onClick={() => { setIsEditing(true); setIsChangingPassword(false); }}
              className="btn-primary w-full justify-center"
            >
              Edit Profile
            </button>
            <button 
              onClick={() => { setIsChangingPassword(true); setIsEditing(false); }}
              className="btn-secondary w-full justify-center text-error hover:bg-error/10 hover:text-error border-error/30"
            >
              Change Password
            </button>
          </div>
        </div>

        <div className="card p-6 md:col-span-2">
          {isEditing ? (
            <div className="animate-fade-in">
              <h3 className="text-title-md text-on-surface mb-6 border-b border-outline-variant/20 pb-4 flex items-center gap-2">
                <Icon name="edit" size={20} className="text-primary" /> Edit Profile
              </h3>
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-body-md text-on-surface font-medium mb-1">Full Name</label>
                    <input type="text" name="name" className="input-field" defaultValue={profileData.name} required />
                  </div>
                  <div>
                    <label className="block text-body-md text-on-surface font-medium mb-1">Phone Number</label>
                    <input type="text" name="phone" className="input-field" defaultValue={profileData.phone} required />
                  </div>
                </div>
                <div>
                  <label className="block text-body-md text-on-surface font-medium mb-1">Email Address</label>
                  <input type="email" name="email" className="input-field" defaultValue={profileData.email} required />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button type="button" className="btn-secondary" onClick={() => setIsEditing(false)}>Cancel</button>
                  <button type="submit" className="btn-primary">Save Changes</button>
                </div>
              </form>
            </div>
          ) : isChangingPassword ? (
            <div className="animate-fade-in">
              <h3 className="text-title-md text-on-surface mb-6 border-b border-outline-variant/20 pb-4 flex items-center gap-2">
                <Icon name="lock" size={20} className="text-error" /> Change Password
              </h3>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-body-md text-on-surface font-medium mb-1">Current Password</label>
                  <input type="password" name="currentPassword" className="input-field" required />
                </div>
                <div>
                  <label className="block text-body-md text-on-surface font-medium mb-1">New Password</label>
                  <input type="password" name="newPassword" className="input-field" required />
                </div>
                <div>
                  <label className="block text-body-md text-on-surface font-medium mb-1">Confirm New Password</label>
                  <input type="password" name="confirmPassword" className="input-field" required />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button type="button" className="btn-secondary" onClick={() => setIsChangingPassword(false)}>Cancel</button>
                  <button type="submit" className="btn-primary">Update Password</button>
                </div>
              </form>
            </div>
          ) : (
            <div className="animate-fade-in">
              <h3 className="text-title-md text-on-surface mb-6 border-b border-outline-variant/20 pb-4">Personal Details</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="text-label-sm text-on-surface-variant block mb-1">Full Name</label>
                  <p className="text-body-lg text-on-surface font-medium capitalize">{profileData.name}</p>
                </div>
                <div>
                  <label className="text-label-sm text-on-surface-variant block mb-1">Email Address</label>
                  <p className="text-body-lg text-on-surface font-medium">{profileData.email}</p>
                </div>
                <div>
                  <label className="text-label-sm text-on-surface-variant block mb-1">Phone Number</label>
                  <p className="text-body-lg text-on-surface font-medium">{profileData.phone}</p>
                </div>
                <div>
                  <label className="text-label-sm text-on-surface-variant block mb-1">Date Joined</label>
                  <p className="text-body-lg text-on-surface font-medium">{profileData.dateJoined}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
