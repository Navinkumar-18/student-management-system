import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Icon from '../common/Icon';

const adminNavItems = [
  { label: 'Dashboard', icon: 'dashboard', path: '/admin/dashboard' },
  { label: 'Attendance', icon: 'calendar_month', path: '/admin/attendance' },
  { label: 'Homework', icon: 'assignment', path: '/admin/homework' },
  { label: 'Marks', icon: 'grade', path: '/admin/marks' },
  { label: 'Fees Management', icon: 'payments', path: '/admin/fees' },
  { label: 'Leave Requests', icon: 'event_busy', path: '/admin/leaves' },
  { label: 'Reports', icon: 'assessment', path: '/admin/reports' },
];

const teacherNavItems = [
  { label: 'Dashboard', icon: 'dashboard', path: '/teacher/dashboard' },
  { label: 'Attendance Tracking', icon: 'calendar_month', path: '/teacher/attendance' },
  { label: 'Homework Verify', icon: 'assignment', path: '/teacher/homework' },
  { label: 'Marks Entry', icon: 'grade', path: '/teacher/marks' },
  { label: 'Leave Approvals', icon: 'event_busy', path: '/teacher/leaves' },
  { label: 'Fees Setting', icon: 'payments', path: '/teacher/fees' },
];

const studentNavItems = [
  { label: 'Dashboard', icon: 'dashboard', path: '/student/dashboard' },
  { label: 'My Attendance', icon: 'calendar_month', path: '/student/attendance' },
  { label: 'My Homework', icon: 'assignment', path: '/student/homework' },
  { label: 'My Marks', icon: 'grade', path: '/student/marks' },
  { label: 'My Fees', icon: 'payments', path: '/student/fees' },
  { label: 'Leave Requests', icon: 'event_busy', path: '/student/leaves' },
];

const adminBottomItems = [
  { label: 'Students', icon: 'school', path: '/admin/students' },
  { label: 'Teachers', icon: 'supervisor_account', path: '/admin/teachers' },
  { label: 'Profile', icon: 'person', path: '/admin/profile' },
  { label: 'Settings', icon: 'settings', path: '/admin/settings' },
];

const teacherBottomItems = [
  { label: 'Students', icon: 'school', path: '/teacher/students' },
  { label: 'Profile', icon: 'person', path: '/teacher/profile' },
  { label: 'Settings', icon: 'settings', path: '/teacher/settings' },
];

const studentBottomItems = [
  { label: 'Profile', icon: 'person', path: '/student/profile' },
  { label: 'Settings', icon: 'settings', path: '/student/settings' },
];

export default function Sidebar({ collapsed, onToggle }) {
  const navigate = useNavigate();
  const { role: userRole, logout } = useAuth();
  const role = userRole || 'student';
  const navItems = role === 'admin' ? adminNavItems : role === 'teacher' ? teacherNavItems : studentNavItems;
  const bottomItems = role === 'admin' ? adminBottomItems : role === 'teacher' ? teacherBottomItems : studentBottomItems;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile overlay */}
      {!collapsed && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full z-50 bg-white border-r border-outline-variant/30 
        flex flex-col transition-all duration-300 ease-in-out
        ${collapsed ? '-translate-x-full lg:translate-x-0 lg:w-20' : 'translate-x-0 w-sidebar'}
        lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-outline-variant/20">
          <div className="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center flex-shrink-0">
            <Icon name="school" size={24} className="text-white" />
          </div>
          {!collapsed && (
            <div className="animate-fade-in">
              <h1 className="text-title-lg text-on-surface">EduTrack Pro</h1>
              <p className="text-label-md text-on-surface-variant">
                {role === 'admin' ? 'Admin Portal' : role === 'teacher' ? 'Teacher Portal' : 'Student Portal'}
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto">
          <div className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
                }
                title={collapsed ? item.label : undefined}
              >
                <Icon name={item.icon} size={22} />
                {!collapsed && <span className="text-body-md">{item.label}</span>}
              </NavLink>
            ))}
          </div>

          <div className="my-4 border-t border-outline-variant/20" />

          <div className="space-y-1">
            {bottomItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
                }
                title={collapsed ? item.label : undefined}
              >
                <Icon name={item.icon} size={22} />
                {!collapsed && <span className="text-body-md">{item.label}</span>}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Logout */}
        <div className="px-3 pb-4">
          <button
            onClick={handleLogout}
            className="sidebar-link w-full text-red-500 hover:bg-red-50 hover:text-red-600"
          >
            <Icon name="logout" size={22} />
            {!collapsed && <span className="text-body-md">Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
