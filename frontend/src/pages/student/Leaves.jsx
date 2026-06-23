import React, { useState, useEffect } from 'react';
import api from '../../api';
import Icon from '../../components/common/Icon';

const statusColors = { 
  Pending: 'bg-amber-100 text-amber-700 border-amber-200', 
  Approved: 'bg-emerald-100 text-emerald-700 border-emerald-200', 
  Rejected: 'bg-red-100 text-red-700 border-red-200' 
};

export default function StudentLeaves() {
  const email = localStorage.getItem('edutrack_email') || 'student@edutrack.pro';
  const [showForm, setShowForm] = useState(false);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [leaveBalances, setLeaveBalances] = useState(null);

  // Form states
  const [leaveType, setLeaveType] = useState('Medical');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reason, setReason] = useState('');

  const fetchLeaves = () => {
    api.get(`/leaves?studentEmail=${email}`)
      .then(res => {
        setRequests(res.data?.leaves || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching leaves:', err);
        setLoading(false);
      });
  };

  const fetchLeaveBalances = () => {
    api.get(`/leaves/balance?email=${email}`)
      .then(res => {
        if (res.data && res.data.sickLeave) {
          setLeaveBalances(res.data);
        } else {
          setLeaveBalances(null);
        }
      })
      .catch(err => {
        console.error('Error fetching leave balances:', err);
        setLeaveBalances(null);
      });
  };

  useEffect(() => {
    fetchLeaves();
    fetchLeaveBalances();
  }, [email]);

  const handleApply = (e) => {
    e.preventDefault();

    api.post('/leaves', {
      studentEmail: email,
      type: leaveType,
      from: fromDate,
      to: toDate,
      reason
    })
      .then(res => {
        setRequests([res.data, ...requests]);
        setShowForm(false);
        setFromDate('');
        setToDate('');
        setReason('');
        fetchLeaveBalances();
      })
      .catch(err => {
        console.error('Error submitting leave:', err);
        alert(err.message);
      });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="page-header">Leave Requests</h1>
          <p className="page-subtitle">Manage your leave applications and view their status.</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="btn-primary flex items-center gap-2"
        >
          <Icon name={showForm ? 'close' : 'add'} size={20} />
          {showForm ? 'Cancel' : 'Apply for Leave'}
        </button>
      </div>

      {/* Leave Balances Header Cards */}
      {leaveBalances && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="stat-card">
            <p className="text-label-md text-on-surface-variant mb-1">Sick/Medical Leaves</p>
            <p className="text-headline-md text-primary font-bold">
              {leaveBalances.sickLeave.total - leaveBalances.sickLeave.used} / {leaveBalances.sickLeave.total}
            </p>
            <p className="text-body-md text-on-surface-variant mt-2">Days remaining</p>
          </div>
          <div className="stat-card">
            <p className="text-label-md text-on-surface-variant mb-1">Casual Leaves</p>
            <p className="text-headline-md text-emerald-600 font-bold">
              {leaveBalances.casualLeave.total - leaveBalances.casualLeave.used} / {leaveBalances.casualLeave.total}
            </p>
            <p className="text-body-md text-on-surface-variant mt-2">Days remaining</p>
          </div>
          <div className="stat-card">
            <p className="text-label-md text-on-surface-variant mb-1">Annual/Personal Leaves</p>
            <p className="text-headline-md text-amber-600 font-bold">
              {leaveBalances.annualLeave.total - leaveBalances.annualLeave.used} / {leaveBalances.annualLeave.total}
            </p>
            <p className="text-body-md text-on-surface-variant mt-2">Days remaining</p>
          </div>
        </div>
      )}

      {showForm && (
        <div className="card p-6 animate-fade-in border border-primary/20">
          <h3 className="text-title-lg text-on-surface mb-4">Submit New Leave Request</h3>
          <form onSubmit={handleApply} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-body-md text-on-surface font-medium mb-2">Leave Type</label>
              <select 
                className="input-field" 
                value={leaveType}
                onChange={e => setLeaveType(e.target.value)}
                required
              >
                <option value="Medical">Medical</option>
                <option value="Casual">Casual</option>
                <option value="Personal">Personal</option>
                <option value="Family">Family</option>
              </select>
            </div>
            <div>
              <label className="block text-body-md text-on-surface font-medium mb-2">Dates</label>
              <div className="flex gap-2">
                <input 
                  type="date" 
                  className="input-field" 
                  value={fromDate}
                  onChange={e => setFromDate(e.target.value)}
                  required 
                />
                <input 
                  type="date" 
                  className="input-field" 
                  value={toDate}
                  onChange={e => setToDate(e.target.value)}
                  required 
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-body-md text-on-surface font-medium mb-2">Reason</label>
              <textarea 
                className="input-field h-24 resize-none" 
                placeholder="Explain the reason for your leave..." 
                value={reason}
                onChange={e => setReason(e.target.value)}
                required 
              />
            </div>
            <div className="md:col-span-2 flex justify-end gap-3 mt-4">
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn-primary">Submit Request</button>
            </div>
          </form>
        </div>
      )}

      <div className="card p-6">
        <h3 className="text-title-lg text-on-surface mb-4">Past Requests</h3>
        {requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center mb-4">
              <Icon name="event_available" size={32} className="text-on-surface-variant" />
            </div>
            <h3 className="text-title-lg text-on-surface mb-2">No Leave Requests</h3>
            <p className="text-body-md text-on-surface-variant max-w-sm">
              You haven't submitted any leave requests yet. Click the button above to apply for a new leave.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => (
              <div key={req.id} className="flex items-center justify-between p-4 rounded-xl border border-outline-variant/20 hover:bg-surface-container-low transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${statusColors[req.status] || 'bg-gray-100'}`}>
                    <Icon name="event" size={24} />
                  </div>
                  <div>
                    <p className="text-title-md text-on-surface font-medium">{req.type} Leave</p>
                    <p className="text-body-md text-on-surface-variant">{req.from} to {req.to} ({req.days} days)</p>
                    {req.reason && <p className="text-xs text-on-surface-variant mt-1">Reason: {req.reason}</p>}
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full border text-label-md font-medium ${statusColors[req.status] || 'bg-gray-100'}`}>
                  {req.status}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
