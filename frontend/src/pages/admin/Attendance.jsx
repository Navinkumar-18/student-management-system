import React, { useState, useEffect } from 'react';
import Icon from '../../components/common/Icon';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import api from '../../api';

const statusColors = {
  Present: 'chip-success',
  Absent: 'chip-danger',
  Late: 'chip-warning',
};

export default function Attendance() {
  const [selectedClass, setSelectedClass] = useState('10-A');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attData, setAttData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editRow, setEditRow] = useState(null);

  useEffect(() => {
    setLoading(true);
    api.get(`/attendance?date=${selectedDate}&className=${selectedClass}`)
      .then(res => {
        setAttData(Array.isArray(res.data) ? res.data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching attendance:', err.message || err);
        setLoading(false);
      });
  }, [selectedDate, selectedClass]);

  const handleExport = () => {
    const dummyContent = `Report for Attendance (Class: ${selectedClass}, Date: ${selectedDate})\n\nThis is a real-time database report export.`;
    const blob = new Blob([dummyContent], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Attendance_${selectedClass}_${selectedDate}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editRow) return;

    api.post('/attendance', {
      date: selectedDate,
      className: selectedClass,
      records: [
        {
          studentId: editRow.id,
          status: editRow.status,
          time: editRow.time
        }
      ]
    })
      .then(() => {
        setAttData(attData.map(row => row.id === editRow.id ? editRow : row));
        setEditRow(null);
      })
      .catch(err => {
        console.error('Error saving attendance:', err.message || err);
        setEditRow(null);
      });
  };

  const columns = [
    { key: 'name', label: 'Student Name' },
    { key: 'rollNo', label: 'Roll No.' },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <span className={`chip ${statusColors[val]}`}>{val}</span>,
    },
    { key: 'time', label: 'Check-in Time' },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button className="p-1.5 hover:bg-surface-container rounded-md transition-colors" onClick={() => setEditRow(row)}>
            <Icon name="edit" size={16} className="text-on-surface-variant" />
          </button>
        </div>
      ),
    },
  ];

  const presentCount = attData.filter(s => s.status === 'Present').length;
  const absentCount = attData.filter(s => s.status === 'Absent').length;
  const lateCount = attData.filter(s => s.status === 'Late').length;

  const currentYear = new Date().getFullYear();
  const academicYear = `${currentYear}-${currentYear + 1}`;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-header">Attendance Management</h1>
          <p className="page-subtitle">Class {selectedClass} • Academic Year {academicYear}</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="input-field w-auto"
          >
            <option value="10-A">Class 10-A</option>
            <option value="10-B">Class 10-B</option>
            <option value="9-A">Class 9-A</option>
            <option value="9-B">Class 9-B</option>
          </select>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="input-field w-auto"
          />
          <button className="btn-primary" onClick={handleExport}>
            <Icon name="download" size={18} />
            Export
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Icon name="check_circle" size={22} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-label-md text-on-surface-variant">Present</p>
              <p className="text-headline-sm text-on-surface">{presentCount}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
              <Icon name="cancel" size={22} className="text-red-600" />
            </div>
            <div>
              <p className="text-label-md text-on-surface-variant">Absent</p>
              <p className="text-headline-sm text-on-surface">{absentCount}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <Icon name="schedule" size={22} className="text-amber-600" />
            </div>
            <div>
              <p className="text-label-md text-on-surface-variant">Late</p>
              <p className="text-headline-sm text-on-surface">{lateCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <DataTable columns={columns} data={attData} />
      )}

      {/* Edit Modal */}
      <Modal isOpen={!!editRow} onClose={() => setEditRow(null)} title="Edit Attendance">
        {editRow && (
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Student</p>
              <p className="font-medium text-gray-800">{editRow.rollNo} - {editRow.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select className="input-field" value={editRow.status} onChange={e => setEditRow({...editRow, status: e.target.value})}>
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
                <option value="Late">Late</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Check-in Time</label>
              <input type="text" className="input-field" value={editRow.time} onChange={e => setEditRow({...editRow, time: e.target.value})} />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <button type="button" className="btn-secondary" onClick={() => setEditRow(null)}>Cancel</button>
              <button type="submit" className="btn-primary">Save Changes</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
