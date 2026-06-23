import React, { useState, useEffect } from 'react';
import Icon from '../../components/common/Icon';
import api from '../../api';

const statusColors = { Pending: 'chip-warning', Approved: 'chip-success', Rejected: 'chip-danger' };

export default function Leaves() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Apply leave form (for Admin self-leave simulation or just simulation)
  const [leaveType, setLeaveType] = useState('Medical');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reason, setReason] = useState('');

  const fetchLeaves = () => {
    setLoading(true);
    api.get('/leaves')
      .then(res => {
        setRequests(res.data?.leaves || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching leaves:', err.message || err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const updateStatus = (id, newStatus) => {
    api.put(`/leaves/${id}`, { status: newStatus })
      .then(() => {
        setRequests(requests.map(req => req.id === id ? { ...req, status: newStatus } : req));
      })
      .catch(err => console.error('Error updating leave status:', err.message || err));
  };

  const handleApply = (e) => {
    e.preventDefault();
    api.post('/leaves', {
      studentEmail: 'rajinikanth@student.com',
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
      })
      .catch(err => console.error('Error submitting leave:', err.message || err));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-header">Leave Requests</h1>
          <p className="page-subtitle">Submit, track, and manage student leave applications.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          <Icon name="add" size={18} />Apply for Leave
        </button>
      </div>

      {/* Apply Form */}
      {showForm && (
        <div className="card p-6 animate-scale-in">
          <div className="flex items-center gap-2 mb-4">
            <Icon name="edit_document" size={22} className="text-primary-container" />
            <h3 className="text-title-lg text-on-surface">Apply for Leave (Simulation)</h3>
          </div>
          <form onSubmit={handleApply} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-body-md text-on-surface font-medium mb-2">Leave Type</label>
              <select className="input-field" value={leaveType} onChange={e => setLeaveType(e.target.value)}>
                <option value="Medical">Medical</option>
                <option value="Casual">Casual</option>
                <option value="Personal">Personal</option>
                <option value="Family">Family</option>
              </select>
            </div>
            <div>
              <label className="block text-body-md text-on-surface font-medium mb-2">Duration</label>
              <div className="flex gap-2">
                <input type="date" className="input-field" value={fromDate} onChange={e => setFromDate(e.target.value)} required />
                <input type="date" className="input-field" value={toDate} onChange={e => setToDate(e.target.value)} required />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-body-md text-on-surface font-medium mb-2">Reason</label>
              <textarea className="input-field h-20 resize-none" value={reason} onChange={e => setReason(e.target.value)} placeholder="Provide reason..." required />
            </div>
            <div className="md:col-span-2 flex justify-end gap-2 mt-2">
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn-primary">Submit Request</button>
            </div>
          </form>
        </div>
      )}

      {/* Leave Requests List */}
      <div className="card p-6">
        <h3 className="text-title-lg text-on-surface mb-4">Pending & Past Applications</h3>
        {loading ? (
          <div className="flex items-center justify-center min-h-[200px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-6 text-on-surface-variant">No leave requests found.</div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => (
              <div key={req.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-outline-variant/20 hover:bg-surface-container-low transition-colors gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${statusColors[req.status] || 'bg-gray-100'}`}>
                    <Icon name="event" size={24} />
                  </div>
                  <div>
                    <p className="text-title-md text-on-surface font-medium">
                      {req.name} <span className="text-body-md text-on-surface-variant">({req.rollNo} • Class {req.grade || 'N/A'})</span>
                    </p>
                    <p className="text-body-md text-on-surface-variant">
                      {req.type} Leave • {req.from} to {req.to} ({req.days} days)
                    </p>
                    {req.reason && <p className="text-xs text-on-surface-variant mt-1">Reason: {req.reason}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`chip ${statusColors[req.status] || 'bg-gray-50'}`}>{req.status}</span>
                  {req.status === 'Pending' && (
                    <div className="flex gap-1.5 ml-2">
                      <button 
                        onClick={() => updateStatus(req.id, 'Approved')}
                        className="p-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded transition-colors"
                        title="Approve"
                      >
                        <Icon name="check" size={18} />
                      </button>
                      <button 
                        onClick={() => updateStatus(req.id, 'Rejected')}
                        className="p-1 bg-red-50 hover:bg-red-100 text-red-700 rounded transition-colors"
                        title="Reject"
                      >
                        <Icon name="close" size={18} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
