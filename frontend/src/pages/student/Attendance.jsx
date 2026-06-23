import React, { useState, useEffect } from 'react';
import api from '../../api';
import Icon from '../../components/common/Icon';

const statusColors = {
  Present: 'chip-success',
  Absent: 'chip-danger',
  Late: 'chip-warning',
};

export default function StudentAttendance() {
  const email = localStorage.getItem('edutrack_email') || 'student@edutrack.pro';
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/attendance?studentEmail=${email}`)
      .then(res => {
        setAttendanceLogs(Array.isArray(res.data) ? res.data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching attendance logs:', err);
        setLoading(false);
      });
  }, [email]);

  const totalDays = attendanceLogs.length;
  const absentCount = attendanceLogs.filter(l => l.status === 'Absent').length;
  const lateCount = attendanceLogs.filter(l => l.status === 'Late').length;
  const presentCount = attendanceLogs.filter(l => l.status === 'Present').length;
  const attendanceRateVal = totalDays > 0 ? Math.round(((presentCount + lateCount) / totalDays) * 100) : null;
  const attendanceRate = attendanceRateVal !== null ? `${attendanceRateVal}%` : 'N/A';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-header">My Attendance</h1>
        <p className="page-subtitle">Track your daily attendance history and academic year status.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <div className="stat-card">
          <p className="text-label-md text-on-surface-variant mb-1">Attendance Rate</p>
          <p className="text-headline-md text-primary font-bold">{attendanceRate}</p>
          <p className={`text-body-md mt-2 ${attendanceRateVal !== null ? 'text-emerald-600' : 'text-on-surface-variant'}`}>
            {attendanceRateVal !== null ? (attendanceRateVal >= 75 ? 'Above warning limit (75%)' : 'Below warning limit (75%)') : 'No attendance records yet'}
          </p>
        </div>
        <div className="stat-card">
          <p className="text-label-md text-on-surface-variant mb-1">Days Present</p>
          <p className="text-headline-md text-emerald-600 font-bold">{presentCount}</p>
          <p className="text-body-md text-on-surface-variant mt-2">Days checked in</p>
        </div>
        <div className="stat-card">
          <p className="text-label-md text-on-surface-variant mb-1">Days Absent</p>
          <p className="text-headline-md text-error font-bold">{absentCount}</p>
          <p className="text-body-md text-on-surface-variant mt-2">Excused/Unexcused leaves</p>
        </div>
        <div className="stat-card">
          <p className="text-label-md text-on-surface-variant mb-1">Days Late</p>
          <p className="text-headline-md text-amber-600 font-bold">{lateCount}</p>
          <p className="text-body-md text-on-surface-variant mt-2">Checked in after 8:30 AM</p>
        </div>
      </div>

      {/* Attendance History */}
      <div className="card p-6">
        <h3 className="text-title-lg text-on-surface mb-4">Recent Daily Logs</h3>
        <div className="overflow-x-auto">
          {attendanceLogs.length === 0 ? (
            <div className="text-center py-6 text-on-surface-variant">No attendance logs found.</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Check-in Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {attendanceLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="font-medium text-on-surface">{log.date}</td>
                    <td className="text-on-surface-variant">{log.time}</td>
                    <td>
                      <span className={`chip ${statusColors[log.status]}`}>{log.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
