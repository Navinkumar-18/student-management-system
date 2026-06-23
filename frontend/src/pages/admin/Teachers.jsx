import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/common/Icon';
import Modal from '../../components/common/Modal';
import api from '../../api';

export default function Teachers() {
  const navigate = useNavigate();
  const [teacherList, setTeacherList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('All Classes');
  const [filterStatus, setFilterStatus] = useState('All Status');
  const [view, setView] = useState('grid');

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [error, setError] = useState('');
  const [viewTeacher, setViewTeacher] = useState(null);
  const [showAddPassword, setShowAddPassword] = useState(false);

  // Form states
  const [newTeacher, setNewTeacher] = useState({
    name: '',
    email: '',
    password: '',
    employeeId: '',
    phone: '',
    qualification: '',
    subjects: '',
    classTeacherOf: 'None',
    status: 'Active'
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    employeeId: '',
    phone: '',
    qualification: '',
    subjects: '',
    classTeacherOf: 'None',
    status: 'Active'
  });

  const validateLoginEmail = (email) => email.trim().toLowerCase().endsWith('@gmail.com');
  const emailError = 'Please enter a proper professional mail id ending with @gmail.com';

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = () => {
    api.get('/teachers')
      .then(res => {
        setTeacherList(res.data?.teachers || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching teachers:', err.message || err);
        setLoading(false);
      });
  };

  const handleAddTeacher = (e) => {
    e.preventDefault();
    setError('');

    if (!validateLoginEmail(newTeacher.email)) {
      setError(emailError);
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$/;
    if (!passwordRegex.test(newTeacher.password)) {
      setError('Password must be at least 6 characters long and include an uppercase letter, a lowercase letter, a number, and a special character.');
      return;
    }

    const payload = {
      ...newTeacher,
      subjects: newTeacher.subjects.split(',').map(s => s.trim()).filter(Boolean)
    };

    api.post('/teachers', payload)
      .then(() => {
        fetchTeachers();
        setIsAddOpen(false);
        setError('');
        setNewTeacher({
          name: '',
          email: '',
          password: '',
          employeeId: '',
          phone: '',
          qualification: '',
          subjects: '',
          classTeacherOf: 'None',
          status: 'Active'
        });
      })
      .catch(err => {
        setError(err.message || 'Error adding teacher');
        console.error('Error adding teacher:', err);
      });
  };

  const handleStartEdit = (teacher) => {
    setEditForm({
      name: teacher.name,
      email: teacher.email,
      employeeId: teacher.employeeId,
      phone: teacher.phone || '',
      qualification: teacher.qualification || '',
      subjects: teacher.subjects ? teacher.subjects.join(', ') : '',
      classTeacherOf: teacher.classTeacherOf || 'None',
      status: teacher.status || 'Active'
    });
    setIsEditing(true);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    const payload = {
      ...editForm,
      subjects: editForm.subjects.split(',').map(s => s.trim()).filter(Boolean)
    };

    api.put(`/teachers/${viewTeacher.id}`, payload)
      .then(() => {
        fetchTeachers();
        setViewTeacher(null);
        setIsEditing(false);
      })
      .catch(err => console.error('Error updating teacher:', err.message || err));
  };

  const handleDeleteTeacher = (id) => {
    if (window.confirm('Are you sure you want to delete this teacher record? This will also delete their login account.')) {
      api.delete(`/teachers/${id}`)
        .then(() => {
          setTeacherList(teacherList.filter(t => t.id !== id));
          setViewTeacher(null);
          setIsEditing(false);
        })
        .catch(err => console.error('Error deleting teacher:', err.message || err));
    }
  };

  const filtered = teacherList.filter(t => {
    const searchMatch =
      (t.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.employeeId || '').toLowerCase().includes(search.toLowerCase());

    const classMatch = filterClass === 'All Classes' || t.classTeacherOf === filterClass;
    const statusMatch = filterStatus === 'All Status' || t.status === filterStatus;

    return searchMatch && classMatch && statusMatch;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-header">Teacher Directory</h1>
          <p className="page-subtitle">Add teachers and view registered faculty members.</p>
        </div>
        <button className="btn-primary" onClick={() => setIsAddOpen(true)}>
          <Icon name="add" size={18} />Add Teacher
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Icon name="search" size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search teachers by name, email, or employee ID..."
            className="input-field pl-12"
          />
        </div>
        <select className="input-field w-auto" value={filterClass} onChange={e => setFilterClass(e.target.value)}>
          <option>All Classes</option>
          <option>10-A</option>
          <option>10-B</option>
          <option>9-A</option>
          <option>9-B</option>
          <option>None</option>
        </select>
        <select className="input-field w-auto" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option>All Status</option>
          <option>Active</option>
          <option>Inactive</option>
        </select>
        <div className="flex border border-outline-variant/40 rounded-lg overflow-hidden">
          <button
            onClick={() => setView('grid')}
            className={`p-2.5 ${view === 'grid' ? 'bg-primary-container text-white' : 'bg-white text-on-surface-variant hover:bg-surface-container'} transition-colors`}
          >
            <Icon name="dashboard" size={18} />
          </button>
          <button
            onClick={() => setView('list')}
            className={`p-2.5 ${view === 'list' ? 'bg-primary-container text-white' : 'bg-white text-on-surface-variant hover:bg-surface-container'} transition-colors`}
          >
            <Icon name="menu" size={18} />
          </button>
        </div>
      </div>

      {/* Teacher grid / list */}
      {loading ? (
        <div className="flex justify-center items-center py-12 text-on-surface-variant">
          <p>Loading teacher records...</p>
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((teacher, i) => (
            <div
              key={teacher.id}
              className="card p-5 card-hover group cursor-pointer"
              onClick={() => {
                if (teacher.classTeacherOf && teacher.classTeacherOf !== 'None') {
                  navigate('/admin/students', { state: { filterClass: teacher.classTeacherOf } });
                } else {
                  setViewTeacher(teacher);
                }
              }}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-primary-container/15 flex items-center justify-center group-hover:bg-primary-container/25 transition-colors">
                  <span className="text-title-md text-primary-container font-semibold">{teacher.avatar}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-title-md text-on-surface truncate font-semibold">{teacher.name}</h3>
                  <p className="text-body-md text-on-surface-variant truncate">{teacher.email}</p>
                </div>
                <button
                  className="p-1.5 hover:bg-surface-container rounded-md opacity-0 group-hover:opacity-100 transition-all"
                  onClick={(e) => {
                    e.stopPropagation();
                    setViewTeacher(teacher);
                  }}
                >
                  <Icon name="visibility" size={18} className="text-on-surface-variant" />
                </button>
              </div>
              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between text-body-md">
                  <span className="text-on-surface-variant">ID:</span>
                  <span className="font-medium">{teacher.employeeId}</span>
                </div>
                <div className="flex items-center justify-between text-body-md">
                  <span className="text-on-surface-variant">Subjects:</span>
                  <span className="truncate max-w-[150px] font-medium" title={teacher.subjects.join(', ')}>
                    {teacher.subjects.join(', ') || 'N/A'}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-outline-variant/20">
                <span className="chip bg-surface-container text-on-surface-variant">
                  Class: {teacher.classTeacherOf}
                </span>
                <span className={`chip ${teacher.status === 'Active' ? 'chip-success' : 'chip-danger'}`}>
                  {teacher.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Teacher Name</th>
                <th>Employee ID</th>
                <th>Email</th>
                <th>Subjects</th>
                <th>Class Assigned</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr
                  key={t.id}
                  className="cursor-pointer hover:bg-surface-container-low"
                  onClick={() => {
                    if (t.classTeacherOf && t.classTeacherOf !== 'None') {
                      navigate('/admin/students', { state: { filterClass: t.classTeacherOf } });
                    } else {
                      setViewTeacher(t);
                    }
                  }}
                >
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-container/15 flex items-center justify-center">
                        <span className="text-label-md text-primary-container font-semibold">{t.avatar}</span>
                      </div>
                      <span className="font-semibold">{t.name}</span>
                    </div>
                  </td>
                  <td>{t.employeeId}</td>
                  <td>{t.email}</td>
                  <td>{t.subjects.join(', ') || 'N/A'}</td>
                  <td>
                    <span className="chip bg-surface-container text-on-surface-variant">{t.classTeacherOf}</span>
                  </td>
                  <td>
                    <span className={`chip ${t.status === 'Active' ? 'chip-success' : 'chip-danger'}`}>{t.status}</span>
                  </td>
                  <td>
                    <button
                      className="btn-ghost text-label-md py-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewTeacher(t);
                      }}
                    >
                      <Icon name="visibility" size={16} />View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Teacher Modal */}
      <Modal isOpen={isAddOpen} onClose={() => { setIsAddOpen(false); setError(''); setShowAddPassword(false); }} title="Add New Teacher">
        <form onSubmit={handleAddTeacher} className="space-y-4">
          {error && (
            <div className="bg-error/10 text-error p-3 rounded-lg text-sm font-medium">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              required
              type="text"
              className="input-field"
              value={newTeacher.name}
              onChange={e => setNewTeacher({ ...newTeacher, name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                required
                type="email"
                className="input-field"
                value={newTeacher.email}
                onChange={e => setNewTeacher({ ...newTeacher, email: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
              <input
                required
                type="text"
                placeholder="e.g. TCH045"
                className="input-field"
                value={newTeacher.employeeId}
                onChange={e => setNewTeacher({ ...newTeacher, employeeId: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input
                required
                type={showAddPassword ? 'text' : 'password'}
                placeholder="Enter password"
                className="input-field pr-10"
                value={newTeacher.password}
                onChange={e => setNewTeacher({ ...newTeacher, password: e.target.value })}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 flex items-center justify-center"
                onClick={() => setShowAddPassword(!showAddPassword)}
              >
                <Icon name={showAddPassword ? 'visibility_off' : 'visibility'} size={18} />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class Teacher Of</label>
              <select
                className="input-field"
                value={newTeacher.classTeacherOf}
                onChange={e => setNewTeacher({ ...newTeacher, classTeacherOf: e.target.value })}
              >
                <option>None</option>
                <option>10-A</option>
                <option>10-B</option>
                <option>9-A</option>
                <option>9-B</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="text"
                className="input-field"
                value={newTeacher.phone}
                onChange={e => setNewTeacher({ ...newTeacher, phone: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subjects (Comma separated)</label>
            <input
              type="text"
              placeholder="e.g. Maths, Science"
              className="input-field"
              value={newTeacher.subjects}
              onChange={e => setNewTeacher({ ...newTeacher, subjects: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Qualification</label>
            <input
              type="text"
              placeholder="e.g. M.Sc, B.Ed"
              className="input-field"
              value={newTeacher.qualification}
              onChange={e => setNewTeacher({ ...newTeacher, qualification: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <button type="button" className="btn-secondary" onClick={() => setIsAddOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary">Add Teacher</button>
          </div>
        </form>
      </Modal>

      {/* View/Edit Teacher Modal */}
      <Modal
        isOpen={!!viewTeacher}
        onClose={() => {
          setViewTeacher(null);
          setIsEditing(false);
        }}
        title={isEditing ? "Edit Teacher Details" : "Teacher Profile"}
      >
        {viewTeacher && (
          isEditing ? (
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  required
                  type="text"
                  className="input-field"
                  value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    required
                    type="email"
                    className="input-field"
                    value={editForm.email}
                    onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                  <input
                    required
                    type="text"
                    className="input-field"
                    value={editForm.employeeId}
                    onChange={e => setEditForm({ ...editForm, employeeId: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Class Teacher Of</label>
                  <select
                    className="input-field"
                    value={editForm.classTeacherOf}
                    onChange={e => setEditForm({ ...editForm, classTeacherOf: e.target.value })}
                  >
                    <option>None</option>
                    <option>10-A</option>
                    <option>10-B</option>
                    <option>9-A</option>
                    <option>9-B</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    className="input-field"
                    value={editForm.status}
                    onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                  >
                    <option>Active</option>
                    <option>Inactive</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    className="input-field"
                    value={editForm.phone}
                    onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Qualification</label>
                  <input
                    type="text"
                    className="input-field"
                    value={editForm.qualification}
                    onChange={e => setEditForm({ ...editForm, qualification: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subjects (Comma separated)</label>
                <input
                  type="text"
                  className="input-field"
                  value={editForm.subjects}
                  onChange={e => setEditForm({ ...editForm, subjects: e.target.value })}
                />
              </div>
              <div className="flex justify-between gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  className="btn-secondary text-red-600 hover:bg-red-50 border-red-200"
                  onClick={() => handleDeleteTeacher(viewTeacher.id)}
                >
                  Delete
                </button>
                <div className="flex gap-2">
                  <button type="button" className="btn-secondary" onClick={() => setIsEditing(false)}>Cancel</button>
                  <button type="submit" className="btn-primary">Save Changes</button>
                </div>
              </div>
            </form>
          ) : (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-4 border-b border-gray-100 pb-4">
                <div className="w-16 h-16 rounded-full bg-primary-container/15 flex items-center justify-center">
                  <span className="text-xl text-primary-container font-semibold">{viewTeacher.avatar}</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{viewTeacher.name}</h3>
                  <p className="text-gray-500">Employee ID: {viewTeacher.employeeId}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Email Address</p>
                  <p className="font-medium text-gray-800">{viewTeacher.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className={`chip mt-1 ${viewTeacher.status === 'Active' ? 'chip-success' : 'chip-danger'}`}>
                    {viewTeacher.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Class Assigned</p>
                  <span className="chip mt-1 bg-surface-container text-on-surface-variant">
                    {viewTeacher.classTeacherOf}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium text-gray-800">{viewTeacher.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Qualification</p>
                  <p className="font-medium text-gray-800">{viewTeacher.qualification || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date of Joining</p>
                  <p className="font-medium text-gray-800">{viewTeacher.dateOfJoining || 'N/A'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Subjects Handled</p>
                  <p className="font-medium text-gray-800">{viewTeacher.subjects.join(', ') || 'None'}</p>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button type="button" className="btn-secondary" onClick={() => setViewTeacher(null)}>Close</button>
                <button type="button" className="btn-primary" onClick={() => handleStartEdit(viewTeacher)}>Edit</button>
              </div>
            </div>
          )
        )}
      </Modal>
    </div>
  );
}
