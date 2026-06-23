import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Icon from '../../components/common/Icon';
import Modal from '../../components/common/Modal';
import api from '../../api';

export default function Students() {
  const location = useLocation();
  const [studentList, setStudentList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState((location.state && location.state.filterClass) || 'All Classes');

  useEffect(() => {
    if (location.state && location.state.filterClass) {
      setFilterClass(location.state.filterClass);
    }
  }, [location.state]);
  const [filterStatus, setFilterStatus] = useState('All Status');
  const [view, setView] = useState('grid');
  
  const [viewStudent, setViewStudent] = useState(null);

  useEffect(() => {
    api.get('/students')
      .then(res => {
        setStudentList(res.data?.students || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching students:', err.message || err);
        setLoading(false);
      });
  }, []);

  const filtered = studentList.filter(s => {
    const nameMatch = (s.name || '').toLowerCase().includes(search.toLowerCase());
    const emailMatch = (s.email || '').toLowerCase().includes(search.toLowerCase());
    const searchMatch = nameMatch || emailMatch;
    
    const classMatch = filterClass === 'All Classes' || s.grade === filterClass;
    const statusMatch = filterStatus === 'All Status' || s.status === filterStatus;
    
    return searchMatch && classMatch && statusMatch;
  });

  const groupedByClass = {};
  filtered.forEach(s => {
    const grade = s.grade || 'Unknown';
    if (!groupedByClass[grade]) groupedByClass[grade] = [];
    groupedByClass[grade].push(s);
  });

  const sortedGrades = Object.keys(groupedByClass).sort();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-header">Student Directory</h1>
          <p className="page-subtitle">View all enrolled student records grouped by class.</p>
        </div>
      </div>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Icon name="search" size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search students..." className="input-field pl-12" />
        </div>
        <select className="input-field w-auto" value={filterClass} onChange={e => setFilterClass(e.target.value)}>
          <option>All Classes</option><option>10-A</option><option>10-B</option><option>9-A</option>
        </select>
        <select className="input-field w-auto" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option>All Status</option><option>Active</option><option>Inactive</option>
        </select>
        <div className="flex border border-outline-variant/40 rounded-lg overflow-hidden">
          <button onClick={() => setView('grid')} className={`p-2.5 ${view === 'grid' ? 'bg-primary-container text-white' : 'bg-white text-on-surface-variant hover:bg-surface-container'} transition-colors`}>
            <Icon name="dashboard" size={18} />
          </button>
          <button onClick={() => setView('list')} className={`p-2.5 ${view === 'list' ? 'bg-primary-container text-white' : 'bg-white text-on-surface-variant hover:bg-surface-container'} transition-colors`}>
            <Icon name="menu" size={18} />
          </button>
        </div>
      </div>
      {/* Student Cards grouped by class */}
      {view === 'grid' ? (
        <div className="space-y-8">
          {sortedGrades.map(grade => (
            <div key={grade}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1 h-8 rounded-full bg-primary-container" />
                <h2 className="text-title-md font-semibold text-on-surface">Class {grade}</h2>
                <span className="text-body-sm text-on-surface-variant">({groupedByClass[grade].length} students)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedByClass[grade].map((student, i) => (
                  <div 
                    key={student.id} 
                    className="card p-5 card-hover group cursor-pointer" 
                    onClick={() => setViewStudent(student)}
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-primary-container/15 flex items-center justify-center group-hover:bg-primary-container/25 transition-colors">
                        <span className="text-title-md text-primary-container font-semibold">{student.avatar}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-title-md text-on-surface truncate font-semibold">{student.rollNo} - {student.name}</h3>
                        <p className="text-body-md text-on-surface-variant truncate">{student.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-outline-variant/20">
                      <div className="flex items-center gap-2">
                        <span className="chip bg-surface-container text-on-surface-variant">Grade {student.grade}</span>
                        <span className={`chip ${student.status === 'Active' ? 'chip-success' : 'chip-danger'}`}>{student.status}</span>
                      </div>
                      <span className="text-label-md text-on-surface-variant">GPA {student.gpa}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {sortedGrades.length === 0 && (
            <div className="card p-12 text-center text-on-surface-variant">
              <Icon name="school" size={48} className="mx-auto mb-3 text-outline-variant" />
              <p className="text-title-md">No students found matching the current filters.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {sortedGrades.map(grade => (
            <div key={grade} className="card overflow-hidden">
              <div className="px-6 py-3 bg-surface-container flex items-center gap-3">
                <div className="w-1 h-6 rounded-full bg-primary-container" />
                <h2 className="text-title-sm font-semibold text-on-surface">Class {grade}</h2>
                <span className="text-body-sm text-on-surface-variant">({groupedByClass[grade].length} students)</span>
              </div>
              <table className="data-table">
                <thead><tr><th>Student</th><th>Email</th><th>Grade</th><th>Status</th><th>GPA</th><th>Actions</th></tr></thead>
                <tbody>
                  {groupedByClass[grade].map(s => (
                    <tr key={s.id}>
                      <td><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-primary-container/15 flex items-center justify-center"><span className="text-label-md text-primary-container">{s.avatar}</span></div>{s.rollNo} - {s.name}</div></td>
                      <td>{s.email}</td>
                      <td>{s.grade}</td>
                      <td><span className={`chip ${s.status === 'Active' ? 'chip-success' : 'chip-danger'}`}>{s.status}</span></td>
                      <td>{s.gpa}</td>
                      <td>
                        <div className="flex gap-2">
                          <button className="btn-ghost text-label-md py-1" onClick={(e) => { e.stopPropagation(); setViewStudent(s); }}><Icon name="visibility" size={16} />View</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
          {sortedGrades.length === 0 && (
            <div className="card p-12 text-center text-on-surface-variant">
              <Icon name="school" size={48} className="mx-auto mb-3 text-outline-variant" />
              <p className="text-title-md">No students found matching the current filters.</p>
            </div>
          )}
        </div>
      )}

      {/* View Student Modal (read-only for admin) */}
      <Modal isOpen={!!viewStudent} onClose={() => setViewStudent(null)} title="Student Details">
        {viewStudent && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 border-b border-gray-100 pb-4">
              <div className="w-16 h-16 rounded-full bg-primary-container/15 flex items-center justify-center">
                <span className="text-xl text-primary-container font-semibold">{viewStudent.avatar}</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{viewStudent.name}</h3>
                <p className="text-gray-500">{viewStudent.rollNo}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{viewStudent.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Grade</p>
                <p className="font-medium">{viewStudent.grade}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <span className={`chip mt-1 ${viewStudent.status === 'Active' ? 'chip-success' : 'chip-danger'}`}>{viewStudent.status}</span>
              </div>
              <div>
                <p className="text-sm text-gray-500">GPA</p>
                <p className="font-medium">{viewStudent.gpa}</p>
              </div>
              {viewStudent.phone && (
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{viewStudent.phone}</p>
                </div>
              )}
              {viewStudent.address && (
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="font-medium">{viewStudent.address}</p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
              <button type="button" className="btn-secondary" onClick={() => setViewStudent(null)}>Close</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
