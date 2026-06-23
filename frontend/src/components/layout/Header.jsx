import React, { useState, useEffect, useRef } from 'react';
import api from '../../api';
import Icon from '../common/Icon';
import Modal from '../common/Modal';

export default function Header({ onMenuToggle, title }) {
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'New Leave Request', desc: 'Rajinikanth requested 2 days of leave.', time: '10m ago', unread: true },
    { id: 2, title: 'Homework Uploaded', desc: '10th Grade Math assignment is live.', time: '1h ago', unread: false },
    { id: 3, title: 'System Update', desc: 'Maintenance scheduled for tonight at 12 AM.', time: '3h ago', unread: false }
  ]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isViewAllOpen, setIsViewAllOpen] = useState(false);
  const dropdownRef = useRef(null);

  const hasUnread = notifications.some(n => n.unread);

  const handleMarkAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
  };

  const handleNotificationClick = (id) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, unread: false } : n));
  };

  const role = localStorage.getItem('edutrack_role') || 'student';
  
  // Search states for Admin
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [filteredTeachers, setFilteredTeachers] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeStudent, setActiveStudent] = useState(null);
  const [activeTeacher, setActiveTeacher] = useState(null);
  
  const searchContainerRef = useRef(null);

  useEffect(() => {
    if (role === 'admin') {
      api.get('/students')
        .then(res => setStudents(res.data?.students || []))
        .catch(err => console.error('Error fetching search students:', err.message || err));

      api.get('/teachers')
        .then(res => setTeachers(res.data?.teachers || []))
        .catch(err => console.error('Error fetching search teachers:', err.message || err));
    }
  }, [role]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredStudents([]);
      setFilteredTeachers([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    
    const matchedStudents = students.filter(s => 
      (s.name || '').toLowerCase().includes(query) ||
      (s.rollNo || '').toLowerCase().includes(query) ||
      (s.email || '').toLowerCase().includes(query)
    );

    const matchedTeachers = teachers.filter(t => 
      (t.name || '').toLowerCase().includes(query) ||
      (t.employeeId || '').toLowerCase().includes(query) ||
      (t.email || '').toLowerCase().includes(query)
    );

    setFilteredStudents(matchedStudents.slice(0, 5));
    setFilteredTeachers(matchedTeachers.slice(0, 5));
  }, [searchQuery, students, teachers]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-outline-variant/20">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onMenuToggle}
              className="lg:hidden p-2 hover:bg-surface-container rounded-lg transition-colors"
            >
              <Icon name="menu" size={24} className="text-on-surface" />
            </button>
            {title && <h2 className="text-title-lg text-on-surface hidden sm:block">{title}</h2>}
          </div>

          <div className="flex items-center gap-3">
            {/* Search (Admin Only) */}
            {role === 'admin' && (
              <div className="relative" ref={searchContainerRef}>
                <div className="hidden md:flex items-center gap-2 bg-surface-container rounded-lg px-4 py-2 min-w-[320px]">
                  <Icon name="search" size={20} className="text-on-surface-variant" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => {
                      setSearchQuery(e.target.value);
                      setShowDropdown(true);
                    }}
                    onFocus={() => setShowDropdown(true)}
                    placeholder="Search student or teacher..."
                    className="bg-transparent border-none outline-none text-body-md text-on-surface placeholder:text-on-surface-variant/50 w-full"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => { setSearchQuery(''); setShowDropdown(false); }}
                      className="p-1 hover:bg-outline-variant/20 rounded"
                    >
                      <Icon name="close" size={16} className="text-on-surface-variant" />
                    </button>
                  )}
                </div>

                {/* Search Results Dropdown */}
                {showDropdown && (filteredStudents.length > 0 || filteredTeachers.length > 0) && (
                  <div className="absolute left-0 top-full mt-2 w-full bg-white rounded-xl shadow-lg border border-outline-variant/20 z-50 overflow-hidden max-h-[360px] overflow-y-auto">
                    {filteredStudents.length > 0 && (
                      <div>
                        <div className="bg-gray-50 px-4 py-1.5 text-label-md text-gray-500 font-semibold border-b border-outline-variant/10">Students</div>
                        {filteredStudents.map(student => (
                          <div 
                            key={student.id}
                            onClick={() => {
                              setActiveStudent(student);
                              setShowDropdown(false);
                              setSearchQuery('');
                            }}
                            className="px-4 py-2 hover:bg-primary-container/5 cursor-pointer flex items-center justify-between transition-colors border-b border-outline-variant/5"
                          >
                            <div>
                              <p className="text-body-md font-semibold text-gray-800">{student.name}</p>
                              <p className="text-label-md text-gray-500">Roll No: {student.rollNo} • Grade: {student.grade}</p>
                            </div>
                            <span className="chip chip-success text-xs py-0.5">{student.status}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {filteredTeachers.length > 0 && (
                      <div>
                        <div className="bg-gray-50 px-4 py-1.5 text-label-md text-gray-500 font-semibold border-b border-outline-variant/10 border-t border-outline-variant/10">Teachers</div>
                        {filteredTeachers.map(teacher => (
                          <div 
                            key={teacher.id}
                            onClick={() => {
                              setActiveTeacher(teacher);
                              setShowDropdown(false);
                              setSearchQuery('');
                            }}
                            className="px-4 py-2 hover:bg-primary-container/5 cursor-pointer flex items-center justify-between transition-colors border-b border-outline-variant/5"
                          >
                            <div>
                              <p className="text-body-md font-semibold text-gray-800">{teacher.name}</p>
                              <p className="text-label-md text-gray-500">ID: {teacher.employeeId} • Subjects: {teacher.subjects?.join(', ')}</p>
                            </div>
                            <span className="chip chip-success text-xs py-0.5">{teacher.status}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Notifications */}
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="relative p-2 hover:bg-surface-container rounded-lg transition-colors"
              >
                <Icon name="notifications" size={22} className="text-on-surface-variant" />
                {hasUnread && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full" />}
              </button>
              
              {isDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-surface rounded-xl shadow-card border border-outline-variant/20 z-50 overflow-hidden animate-fade-in">
                  <div className="p-4 border-b border-outline-variant/20 flex justify-between items-center">
                    <h3 className="font-semibold text-on-surface text-title-md">Notifications</h3>
                    <button onClick={handleMarkAllRead} className="text-label-sm text-primary-container font-medium hover:text-primary">Mark all as read</button>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((n) => (
                        <div 
                          key={n.id} 
                          onClick={() => handleNotificationClick(n.id)}
                          className={`p-4 border-b border-outline-variant/10 hover:bg-surface-container-low transition-colors cursor-pointer ${n.unread ? 'bg-primary-container/5' : ''}`}
                        >
                          <div className="flex justify-between mb-1">
                            <span className="font-medium text-body-md text-on-surface">{n.title}</span>
                            <span className="text-label-sm text-on-surface-variant">{n.time}</span>
                          </div>
                          <p className="text-body-sm text-on-surface-variant line-clamp-2">{n.desc}</p>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-on-surface-variant text-body-md">No notifications</div>
                    )}
                  </div>
                  <div 
                    onClick={() => {
                      setIsDropdownOpen(false);
                      setIsViewAllOpen(true);
                    }} 
                    className="p-3 text-center border-t border-outline-variant/20 bg-surface-container-low/50 hover:bg-surface-container-low cursor-pointer transition-colors"
                  >
                    <span className="text-label-md text-primary-container font-medium">View All Notifications</span>
                  </div>
                </div>
              )}
            </div>

            {/* User Avatar */}
            <div className="flex items-center gap-3 pl-3 border-l border-outline-variant/30">
              <div className="w-9 h-9 rounded-full bg-primary-container/20 flex items-center justify-center">
                <span className="text-label-md text-primary-container font-semibold">
                  {(localStorage.getItem('edutrack_name') || 'Student User')
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase()}
                </span>
              </div>
              <div className="hidden sm:block">
                <p className="text-body-md text-on-surface font-medium">
                  {localStorage.getItem('edutrack_name') || (localStorage.getItem('edutrack_role') === 'admin' ? 'Admin User' : 'Student User')}
                </p>
                <p className="text-label-md text-on-surface-variant capitalize">
                  {localStorage.getItem('edutrack_role') || 'Student'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* View All Notifications Modal */}
      <Modal 
        isOpen={isViewAllOpen} 
        onClose={() => setIsViewAllOpen(false)} 
        title="All Notifications"
      >
        <div className="flex justify-end mb-4">
          <button 
            onClick={handleMarkAllRead} 
            className="text-primary-container hover:text-primary font-medium text-body-md"
          >
            Mark all as read
          </button>
        </div>
        <div className="space-y-3">
          {notifications.map((n) => (
            <div 
              key={n.id} 
              onClick={() => handleNotificationClick(n.id)}
              className={`p-4 rounded-xl border transition-colors cursor-pointer ${n.unread ? 'bg-primary-container/5 border-primary/20' : 'bg-surface border-outline-variant/20 hover:bg-surface-container-low'}`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="font-semibold text-title-md text-on-surface">{n.title}</span>
                <span className="text-label-md text-on-surface-variant whitespace-nowrap ml-2">{n.time}</span>
              </div>
              <p className="text-body-md text-on-surface-variant">{n.desc}</p>
            </div>
          ))}
          {notifications.length === 0 && (
            <div className="text-center text-on-surface-variant py-8">
              No notifications found
            </div>
          )}
        </div>
      </Modal>

      {/* Student Details Search Modal */}
      <Modal
        isOpen={!!activeStudent}
        onClose={() => setActiveStudent(null)}
        title="Student Details (Search Result)"
      >
        {activeStudent && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 border-b border-gray-100 pb-4">
              <div className="w-16 h-16 rounded-full bg-primary-container/15 flex items-center justify-center">
                <span className="text-xl text-primary-container font-semibold">{activeStudent.avatar}</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{activeStudent.name}</h3>
                <p className="text-gray-500">{activeStudent.rollNo}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-800">{activeStudent.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Grade</p>
                <p className="font-medium text-gray-800">{activeStudent.grade}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <span className={`chip mt-1 ${activeStudent.status === 'Active' ? 'chip-success' : 'chip-danger'}`}>{activeStudent.status}</span>
              </div>
              <div>
                <p className="text-sm text-gray-500">GPA</p>
                <p className="font-medium text-gray-800">{activeStudent.gpa}</p>
              </div>
              {activeStudent.phone && (
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium text-gray-800">{activeStudent.phone}</p>
                </div>
              )}
              {activeStudent.address && (
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="font-medium text-gray-800">{activeStudent.address}</p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
              <button type="button" className="btn-secondary" onClick={() => setActiveStudent(null)}>Close</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Teacher Details Search Modal */}
      <Modal
        isOpen={!!activeTeacher}
        onClose={() => setActiveTeacher(null)}
        title="Teacher Profile (Search Result)"
      >
        {activeTeacher && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 border-b border-gray-100 pb-4">
              <div className="w-16 h-16 rounded-full bg-primary-container/15 flex items-center justify-center">
                <span className="text-xl text-primary-container font-semibold">{activeTeacher.avatar}</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{activeTeacher.name}</h3>
                <p className="text-gray-500">Employee ID: {activeTeacher.employeeId}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Email Address</p>
                <p className="font-medium text-gray-800">{activeTeacher.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <span className={`chip mt-1 ${activeTeacher.status === 'Active' ? 'chip-success' : 'chip-danger'}`}>{activeTeacher.status}</span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Class Assigned</p>
                <span className="chip mt-1 bg-surface-container text-on-surface-variant">{activeTeacher.classTeacherOf}</span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium text-gray-800">{activeTeacher.phone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Qualification</p>
                <p className="font-medium text-gray-800">{activeTeacher.qualification || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date of Joining</p>
                <p className="font-medium text-gray-800">{activeTeacher.dateOfJoining || 'N/A'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-500">Subjects Handled</p>
                <p className="font-medium text-gray-800">{activeTeacher.subjects?.join(', ') || 'None'}</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
              <button type="button" className="btn-secondary" onClick={() => setActiveTeacher(null)}>Close</button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
