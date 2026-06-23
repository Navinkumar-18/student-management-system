import React, { useState, useEffect } from 'react';
import api from '../../api';
import Icon from '../../components/common/Icon';
import Modal from '../../components/common/Modal';

export default function Leaves() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('Pending');

  // Modals state
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [actionType, setActionType] = useState('Approve'); // Approve or Reject

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = () => {
    setLoading(true);
    api.get('/leaves')
      .then(res => {
        setLeaves(res.data?.leaves || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching leaves:', err.message || err);
        setLoading(false);
      });
  };

  const handleAction = (e) => {
    e.preventDefault();
    const finalStatus = actionType === 'Approve' ? 'Approved' : 'Rejected';

    api.put(`/leaves/${selectedLeave.id}`, {
      status: finalStatus,
      remarks: remarks
    })
      .then(() => {
        setSelectedLeave(null);
        setRemarks('');
        fetchLeaves();
      })
      .catch(err => console.error('Error updating leave status:', err.message || err));
  };

  const filtered = leaves.filter(l => {
    if (filterStatus === 'All') return true;
    return l.status === filterStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-header">Leave Approvals</h1>
        <p className="page-subtitle">Approve or reject student leave requests and review reasons.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-outline-variant/30 gap-2">
        {['Pending', 'Approved', 'Rejected', 'All'].map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-5 py-3 text-body-md font-medium transition-all border-b-2 -mb-[2px] ${
              filterStatus === status
                ? 'border-primary-container text-primary-container'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Leave Table / List */}
      {loading ? (
        <div className="flex justify-center items-center py-12 text-on-surface-variant">
          <p>Loading leave requests...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center text-on-surface-variant">
          <Icon name="event_busy" size={48} className="mx-auto mb-3 text-outline-variant" />
          <p className="text-title-md">No leave requests found for status "{filterStatus}".</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Class</th>
                <th>Type</th>
                <th>Dates</th>
                <th>Days</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(l => (
                <tr key={l.id}>
                  <td className="font-semibold text-gray-800">{l.name} ({l.rollNo})</td>
                  <td>{l.grade}</td>
                  <td>
                    <span className="chip bg-surface-container text-on-surface-variant">{l.type}</span>
                  </td>
                  <td>{l.from} to {l.to}</td>
                  <td>{l.days}</td>
                  <td className="max-w-[200px] truncate" title={l.reason}>{l.reason}</td>
                  <td>
                    <span className={`chip ${
                      l.status === 'Approved' ? 'chip-success' :
                      l.status === 'Rejected' ? 'chip-danger' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {l.status}
                    </span>
                  </td>
                  <td>
                    {l.status === 'Pending' ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedLeave(l);
                            setActionType('Approve');
                          }}
                          className="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-label-md transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            setSelectedLeave(l);
                            setActionType('Reject');
                          }}
                          className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-label-md transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-body-md text-gray-400">Decision made</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Approve/Reject Leave Modal */}
      <Modal
        isOpen={!!selectedLeave}
        onClose={() => setSelectedLeave(null)}
        title={selectedLeave ? `${actionType} Leave Request: ${selectedLeave.name}` : ''}
      >
        {selectedLeave && (
          <form onSubmit={handleAction} className="space-y-4">
            <div className="bg-surface-container p-3 rounded-lg border border-outline-variant/10 text-body-md text-gray-700">
              <p className="font-semibold">Reason for leave:</p>
              <p className="italic mt-1">"{selectedLeave.reason}"</p>
              <p className="mt-2 text-label-md text-gray-400">Requested for {selectedLeave.days} day(s) ({selectedLeave.from} to {selectedLeave.to})</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Remarks / Note</label>
              <textarea
                className="input-field"
                rows={3}
                placeholder="Add optional comments or reason for decision..."
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
              <button type="button" className="btn-secondary" onClick={() => setSelectedLeave(null)}>Cancel</button>
              <button
                type="submit"
                className={`btn-primary ${actionType === 'Reject' ? 'bg-red-600 hover:bg-red-700' : ''}`}
              >
                Confirm {actionType}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
