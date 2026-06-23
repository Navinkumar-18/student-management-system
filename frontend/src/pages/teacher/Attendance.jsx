import React, { useState, useEffect } from 'react';
import api from '../../api';
import Icon from '../../components/common/Icon';

export default function Attendance() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchAttendance();
  }, [selectedDate]);

  const fetchAttendance = () => {
    setLoading(true);
    api.get(`/attendance?date=${selectedDate}`)
      .then(res => {
        setRecords(Array.isArray(res.data) ? res.data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching attendance:', err.message || err);
        setLoading(false);
      });
  };

  const handleStatusChange = (studentId, status) => {
    setRecords(records.map(r => r.id === studentId ? { ...r, status } : r));
  };

  const handleSave = () => {
    setSaving(true);
    setMessage(null);

    const payload = {
      date: selectedDate,
      records: records.map(r => ({
        studentId: r.id,
        status: r.status,
        time: r.status === 'Present' ? '8:00 AM' : r.status === 'Late' ? '9:15 AM' : '-'
      }))
    };

    api.post('/attendance', payload)
      .then(() => {
        setSaving(false);
        setMessage({ type: 'success', text: 'Attendance records updated successfully!' });
        fetchAttendance();
      })
      .catch(err => {
        console.error('Error saving attendance:', err.message || err);
        setSaving(false);
        setMessage({ type: 'error', text: 'Failed to update attendance records.' });
      });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-header">Attendance Tracking</h1>
        <p className="page-subtitle">Track daily attendance status for students by class and date.</p>
      </div>

      {/* Select Controls */}
      <div className="card p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Select Date</label>
            <input
              type="date"
              className="input-field"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={loading || saving || records.length === 0}
              className="btn-primary w-full md:w-auto"
            >
              {saving ? 'Saving...' : 'Save Attendance'}
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          <Icon name={message.type === 'success' ? 'check_circle' : 'error'} size={20} />
          <p className="text-body-md font-medium">{message.text}</p>
        </div>
      )}

      {/* Student List */}
      {loading ? (
        <div className="flex justify-center items-center py-12 text-on-surface-variant">
          <p>Loading class roster...</p>
        </div>
      ) : records.length === 0 ? (
        <div className="card p-12 text-center text-on-surface-variant">
          <Icon name="group" size={48} className="mx-auto mb-3 text-outline-variant" />
          <p className="text-title-md">No students found in this class.</p>
          <p className="text-body-md mt-1">No students enrolled in your class.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Roll No</th>
                <th>Student Name</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map(r => (
                <tr key={r.id}>
                  <td className="font-semibold text-gray-600">{r.rollNo}</td>
                  <td>
                    <div className="font-medium text-gray-800">{r.name}</div>
                  </td>
                  <td>
                    <span className={`chip ${
                      r.status === 'Present' ? 'chip-success' :
                      r.status === 'Late' ? 'bg-amber-100 text-amber-800' :
                      'chip-danger'
                    }`}>
                      {r.status}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleStatusChange(r.id, 'Present')}
                        className={`px-3 py-1.5 rounded-lg text-label-md transition-colors ${
                          r.status === 'Present'
                            ? 'bg-green-600 text-white font-semibold'
                            : 'bg-surface-container hover:bg-green-50 text-green-700'
                        }`}
                      >
                        Present
                      </button>
                      <button
                        onClick={() => handleStatusChange(r.id, 'Late')}
                        className={`px-3 py-1.5 rounded-lg text-label-md transition-colors ${
                          r.status === 'Late'
                            ? 'bg-amber-500 text-white font-semibold'
                            : 'bg-surface-container hover:bg-amber-50 text-amber-700'
                        }`}
                      >
                        Late
                      </button>
                      <button
                        onClick={() => handleStatusChange(r.id, 'Absent')}
                        className={`px-3 py-1.5 rounded-lg text-label-md transition-colors ${
                          r.status === 'Absent'
                            ? 'bg-red-600 text-white font-semibold'
                            : 'bg-surface-container hover:bg-red-50 text-red-700'
                        }`}
                      >
                        Absent
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
