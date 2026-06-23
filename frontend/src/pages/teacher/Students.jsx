import { useState, useEffect } from 'react';
import api from '../../api';
import Icon from '../../components/common/Icon';
import Modal from '../../components/common/Modal';

export default function Students() {
  const [studentList, setStudentList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All Status');
  
  // Modal & Form States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: '', email: '', password: '' });
  const [addError, setAddError] = useState('');
  const [showAddPassword, setShowAddPassword] = useState(false);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', password: '', grade: '10-A', status: 'Active', gpa: '0.0', phone: '', address: '' });
  const [editError, setEditError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const validateLoginEmail = (email) => email.trim().toLowerCase().endsWith('@gmail.com');
  const emailError = 'Please enter a proper professional mail id ending with @gmail.com';

  function fetchStudents() {
    setLoading(true);
    api.get('/students')
      .then(res => {
        setStudentList(res.data?.students || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching students:', err.message || err);
        setLoading(false);
      });
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      fetchStudents();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const handleAddStudent = (e) => {
    e.preventDefault();
    setAddError('');

    if (!validateLoginEmail(newStudent.email)) {
      setAddError(emailError);
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$/;
    if (!passwordRegex.test(newStudent.password)) {
      setAddError('Password must be at least 6 characters long and include an uppercase letter, a lowercase letter, a number, and a special character.');
      return;
    }

    api.post('/students', newStudent)
      .then(() => {
        fetchStudents();
        setIsAddOpen(false);
        setNewStudent({ name: '', email: '', password: '' });
      })
      .catch(err => {
        console.error('Error adding student:', err);
        setAddError(err.message || 'Error adding student');
      });
  };

  const handleStartEdit = (student) => {
    setEditingStudent(student);
    setEditForm({
      name: student.name,
      email: student.email,
      password: '', // blank by default, only updated if entered
      grade: student.grade || '',
      status: student.status || 'Active',
      gpa: student.gpa || '0.0',
      phone: student.phone || '',
      address: student.address || ''
    });
    setEditError('');
    setShowPassword(false);
    setIsEditOpen(true);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    setEditError('');

    const bodyData = { ...editForm };
    if (!validateLoginEmail(bodyData.email)) {
      setEditError(emailError);
      return;
    }

    if (!bodyData.password) {
      delete bodyData.password;
    } else {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$/;
      if (!passwordRegex.test(bodyData.password)) {
        setEditError('Password must be at least 6 characters long and include an uppercase letter, a lowercase letter, a number, and a special character.');
        return;
      }
    }

    api.put(`/students/${editingStudent.id}`, bodyData)
      .then(() => {
        fetchStudents();
        setIsEditOpen(false);
        setEditingStudent(null);
      })
      .catch(err => {
        console.error('Error updating student:', err);
        setEditError(err.message || 'Error updating student');
      });
  };

  const closeEditModal = () => {
    setIsEditOpen(false);
    setEditingStudent(null);
    setEditError('');
    setShowPassword(false);
    setIsDeleting(false);
  };

  const handleDeleteStudent = (id) => {
    if (window.confirm('Are you sure you want to delete this student record? This will also delete their login account.')) {
      setEditError('');
      setIsDeleting(true);
      api.delete(`/students/${id}`)
        .then(() => {
          setStudentList(currentStudents => currentStudents.filter(s => s.id !== id));
          closeEditModal();
        })
        .catch(err => {
          console.error('Error deleting student:', err);
          setEditError(err.message || 'Error deleting student');
        })
        .finally(() => setIsDeleting(false));
    }
  };

  const filtered = studentList.filter(s => {
    const statusMatch = filterStatus === 'All Status' || s.status === filterStatus;
    const searchMatch =
      (s.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.rollNo || '').toLowerCase().includes(search.toLowerCase());

    return statusMatch && searchMatch;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-header">Class Roster</h1>
          <p className="page-subtitle">Manage enrolled students.</p>
        </div>
        <button className="btn-primary" onClick={() => setIsAddOpen(true)}>
          <Icon name="add" size={18} />Add Student
        </button>
      </div>

      {/* Select Controls & Filters */}
      <div className="card p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Filter Status</label>
            <select
              className="input-field"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
            >
              <option>All Status</option>
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Search Student</label>
            <div className="relative">
              <Icon name="search" size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input
                type="text"
                placeholder="Search by name, roll no, email..."
                className="input-field pl-10"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Class List Table */}
      {loading ? (
        <div className="flex justify-center items-center py-12 text-on-surface-variant">
          <p>Loading roster...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center text-on-surface-variant">
          <Icon name="school" size={48} className="mx-auto mb-3 text-outline-variant" />
          <p className="text-title-md">No students found matching filters.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Roll No</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>GPA</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id}>
                  <td className="font-semibold text-gray-600">{s.rollNo}</td>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-container/15 flex items-center justify-center">
                        <span className="text-label-md text-primary-container font-semibold">{s.avatar}</span>
                      </div>
                      <span className="font-semibold text-gray-800">{s.name}</span>
                    </div>
                  </td>
                  <td>{s.email}</td>
                  <td>{s.phone || 'N/A'}</td>
                  <td>
                    <span className="font-medium text-gray-800">{s.gpa}</span>
                  </td>
                  <td>
                    <span className={`chip ${s.status === 'Active' ? 'chip-success' : 'chip-danger'}`}>
                      {s.status}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn-ghost text-label-md py-1 text-primary-container" onClick={() => handleStartEdit(s)}>
                        <Icon name="edit" size={16} />Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Student Modal */}
      <Modal isOpen={isAddOpen} onClose={() => { setIsAddOpen(false); setAddError(''); setShowAddPassword(false); }} title="Add New Student">
        <form onSubmit={handleAddStudent} className="space-y-4">
          {addError && (
            <div className="bg-error/10 text-error p-3 rounded-lg text-sm font-medium">
              {addError}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input required type="text" className="input-field" value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input required type="email" className="input-field" value={newStudent.email} onChange={e => setNewStudent({...newStudent, email: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input
                required
                type={showAddPassword ? 'text' : 'password'}
                placeholder="Enter password"
                className="input-field pr-10"
                value={newStudent.password}
                onChange={e => setNewStudent({...newStudent, password: e.target.value})}
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
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" className="btn-secondary" onClick={() => { setIsAddOpen(false); setAddError(''); setShowAddPassword(false); }}>Cancel</button>
            <button type="submit" className="btn-primary">Add Student</button>
          </div>
        </form>
      </Modal>

      {/* Edit Student Modal */}
      <Modal isOpen={isEditOpen} onClose={closeEditModal} title="Edit Student Details">
        {editingStudent && (
          <form onSubmit={handleSaveEdit} className="space-y-4">
            {editError && (
              <div className="bg-error/10 text-error p-3 rounded-lg text-sm font-medium">
                {editError}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input required type="text" className="input-field" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input required type="email" className="input-field" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Leave blank to keep current password"
                  className="input-field pr-10"
                  value={editForm.password}
                  onChange={e => setEditForm({ ...editForm, password: e.target.value })}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 flex items-center justify-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <Icon name={showPassword ? 'visibility_off' : 'visibility'} size={18} />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class/Grade</label>
                <input type="text" disabled className="input-field bg-gray-50 text-gray-500 cursor-not-allowed" value={editForm.grade || ''} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GPA</label>
                <input type="text" className="input-field" value={editForm.gpa} onChange={e => setEditForm({...editForm, gpa: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select className="input-field" value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})}>
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input type="text" className="input-field" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <textarea className="input-field" rows={2} value={editForm.address} onChange={e => setEditForm({...editForm, address: e.target.value})} />
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
              <button
                type="button"
                className="btn-ghost text-red-600 hover:bg-red-50 mr-auto"
                onClick={() => handleDeleteStudent(editingStudent.id)}
                disabled={isDeleting}
              >
                <Icon name="delete" size={16} />{isDeleting ? 'Deleting...' : 'Delete Student'}
              </button>
              <button type="button" className="btn-secondary" onClick={closeEditModal}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={isDeleting}>Save Changes</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
